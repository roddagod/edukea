-- ============================================================
-- Passage class-by-class : refactor du workflow batch en workflow incrémental.
--
-- Le secrétariat travaille classe par classe (papier du conseil de classe → saisie
-- dans l'app). Deux RPC :
--   1. save_class_transitions(...) : upsert les décisions d'une classe (pending)
--   2. finalize_year_advancement(...) : à la fin, génère les SSYL N+1 pour
--      toutes les décisions advance/repeat de l'année source.
--
-- + Vue v_passage_progress_by_class : compteurs par classe pour la sidebar.
-- ============================================================

-- Contrainte d'unicité : on a UNE décision par (student, from_year, to_year)
-- Sinon les UPSERT vont dupliquer.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'uq_enrollment_transitions_scope'
  ) THEN
    CREATE UNIQUE INDEX uq_enrollment_transitions_scope
      ON enrollment_transitions(student_id, from_year_id, to_year_id);
  END IF;
END $$;

-- ==================== v_passage_progress_by_class ====================
-- Pour chaque classe de l'année source, compte n_students total + n_decided + breakdowns.
CREATE OR REPLACE VIEW v_passage_progress_by_class AS
SELECT
  ssyl.school_id,
  ssyl.school_year_id           AS from_year_id,
  ssyl.classroom_id,
  MAX(cl.name)                  AS classroom_name,
  MAX(lv.name)                  AS level_name,
  MAX(cy.name)                  AS cycle_name,
  MAX(lv.order_by)              AS level_order,
  COUNT(*)::INT                 AS n_students,
  COUNT(t.id)::INT              AS n_decided,
  COUNT(*) FILTER (WHERE t.decision = 'advance')::INT AS n_advance,
  COUNT(*) FILTER (WHERE t.decision = 'repeat')::INT  AS n_repeat,
  COUNT(*) FILTER (WHERE t.decision = 'leave')::INT   AS n_leave,
  COUNT(*) FILTER (WHERE t.decision = 'pending')::INT AS n_pending
FROM student_school_year_loggings ssyl
JOIN classrooms cl ON cl.id = ssyl.classroom_id
LEFT JOIN levels lv ON lv.id = cl.level_id
LEFT JOIN cycles cy ON cy.id = lv.cycle_id
LEFT JOIN enrollment_transitions t
       ON t.student_id = ssyl.student_id
      AND t.from_ssyl_id = ssyl.id
      -- (to_year_id renseigné lors du save : join sans filter to_year → prend n'importe quelle décision existante)
WHERE ssyl.deleted_at IS NULL AND ssyl.classroom_id IS NOT NULL
GROUP BY ssyl.school_id, ssyl.school_year_id, ssyl.classroom_id;

GRANT SELECT ON v_passage_progress_by_class TO authenticated;

-- ==================== save_class_transitions ====================
-- Upsert une batch de décisions pour une classe donnée.
-- entries : [{ ssyl_id, decision, target_classroom_id?, note? }, ...]
CREATE OR REPLACE FUNCTION save_class_transitions(
  p_school_id     TEXT,
  p_from_year_id  TEXT,
  p_to_year_id    TEXT,
  p_entries       JSONB
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_entry JSONB;
  v_ssyl  RECORD;
  v_saved INT := 0;
BEGIN
  IF NOT (is_admin() OR get_school_staff_school_id() = p_school_id) THEN
    RAISE EXCEPTION 'save_class_transitions : accès refusé';
  END IF;

  IF p_entries IS NULL OR jsonb_array_length(p_entries) = 0 THEN
    RETURN jsonb_build_object('saved', 0);
  END IF;

  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries) LOOP
    SELECT id, student_id, classroom_id, school_year_id INTO v_ssyl
    FROM student_school_year_loggings
    WHERE id = v_entry->>'ssyl_id'
      AND school_id = p_school_id
      AND school_year_id = p_from_year_id;
    IF v_ssyl.id IS NULL THEN CONTINUE; END IF;

    -- Upsert (student_id, from_year_id, to_year_id) unique
    INSERT INTO enrollment_transitions
      (student_id, from_ssyl_id, decision, from_classroom_id, to_classroom_id, from_year_id, to_year_id, decided_by, note)
    VALUES
      (v_ssyl.student_id, v_ssyl.id, (v_entry->>'decision')::TEXT,
       v_ssyl.classroom_id, NULLIF(v_entry->>'target_classroom_id',''),
       p_from_year_id, p_to_year_id, auth.uid(), v_entry->>'note')
    ON CONFLICT (student_id, from_year_id, to_year_id) DO UPDATE
      SET decision = EXCLUDED.decision,
          to_classroom_id = EXCLUDED.to_classroom_id,
          note = EXCLUDED.note,
          decided_by = EXCLUDED.decided_by,
          decided_at = now();

    v_saved := v_saved + 1;
  END LOOP;

  RETURN jsonb_build_object('saved', v_saved);
END $$;

GRANT EXECUTE ON FUNCTION save_class_transitions(TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- ==================== finalize_year_advancement ====================
-- Génère les SSYL N+1 pour toutes les décisions advance/repeat non encore
-- concrétisées (to_ssyl_id IS NULL). Bulk atomique. Idempotent.
CREATE OR REPLACE FUNCTION finalize_year_advancement(
  p_school_id     TEXT,
  p_from_year_id  TEXT,
  p_to_year_id    TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row RECORD;
  v_new_ssyl_id TEXT;
  v_n_advance INT := 0;
  v_n_repeat  INT := 0;
  v_n_leave   INT := 0;
  v_n_pending INT := 0;
  v_fees_id TEXT;
  v_billed BIGINT;
BEGIN
  IF NOT (is_admin() OR get_school_staff_school_id() = p_school_id) THEN
    RAISE EXCEPTION 'finalize_year_advancement : accès refusé';
  END IF;

  FOR v_row IN
    SELECT t.id AS transition_id, t.student_id, t.from_ssyl_id, t.decision, t.to_classroom_id
    FROM enrollment_transitions t
    JOIN students s ON s.id = t.student_id AND s.school_id = p_school_id
    WHERE t.from_year_id = p_from_year_id
      AND t.to_year_id   = p_to_year_id
      AND t.to_ssyl_id IS NULL -- pas encore concrétisée
  LOOP
    IF v_row.decision IN ('advance', 'repeat') THEN
      IF v_row.to_classroom_id IS NULL THEN
        -- Décision advance/repeat sans classe cible : skip et compter comme pending
        v_n_pending := v_n_pending + 1;
        CONTINUE;
      END IF;

      -- Fees id + billed_total pour la nouvelle classe
      SELECT id, COALESCE(NULLIF(school_fees_net,'')::BIGINT, 0)
        INTO v_fees_id, v_billed
      FROM classroom_school_fees
      WHERE classroom_id = v_row.to_classroom_id AND school_year_id = p_to_year_id
      LIMIT 1;

      -- Créer SSYL cible via reenroll_student (déjà gère opening balance ledger)
      SELECT (reenroll_student(jsonb_build_object(
        'existing_student_id', v_row.student_id,
        'school_id',           p_school_id,
        'school_year_id',      p_to_year_id,
        'classroom_id',        v_row.to_classroom_id,
        'school_fees_id',      v_fees_id,
        'billed_total',        COALESCE(v_billed, 0),
        'previous_ssyl_id',    v_row.from_ssyl_id
      ))->>'ssyl_id') INTO v_new_ssyl_id;

      -- Marquer la transition comme concrétisée
      UPDATE enrollment_transitions
        SET to_ssyl_id = v_new_ssyl_id
      WHERE id = v_row.transition_id;

      IF v_row.decision = 'advance' THEN v_n_advance := v_n_advance + 1;
      ELSE v_n_repeat := v_n_repeat + 1; END IF;

    ELSIF v_row.decision = 'leave' THEN
      v_n_leave := v_n_leave + 1;
    ELSE
      v_n_pending := v_n_pending + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'advance', v_n_advance,
    'repeat',  v_n_repeat,
    'leave',   v_n_leave,
    'pending', v_n_pending
  );
END $$;

GRANT EXECUTE ON FUNCTION finalize_year_advancement(TEXT, TEXT, TEXT) TO authenticated;
