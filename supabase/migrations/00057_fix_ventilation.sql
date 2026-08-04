-- =============================================================================
-- 00057 — Fix ventilation : materialisation classroom_fee_installments + vue
-- =============================================================================
-- Diagnostic :
--   * v_ssyl_installment_status joignait sur classroom_fee_installments (par classe)
--   * classroom_fee_installments etait TOUJOURS vide (personne ne l'alimente)
--   * Les frais sont dans level_fee_installments (par niveau)
--
-- Architecture voulue :
--   level_fee_installments = template niveau (source de verite quand pas override)
--   classroom_fee_installments = copie par classe, peut etre override par
--     classe si besoin (overrides_level_installment_id pointe sur l'original)
--
-- Fix :
--   1. Nouvelle fonction materialize_classroom_fees(classroom_id, student_type_id, year_id)
--      qui copie level_fee_installments -> classroom_fee_installments si absents.
--      Calcule due_date depuis year.date_start + due_month + due_year_offset.
--   2. Trigger on_ssyl_created : appelle la materialisation automatiquement.
--   3. Vue v_ssyl_installment_status : join sur ssyl.type_student_id (cast text).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Fonction de materialisation
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.materialize_classroom_fees(
  p_classroom_id  TEXT,
  p_student_type_id TEXT,
  p_school_year_id TEXT
) RETURNS INT
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_level_id       TEXT;
  v_year_start     DATE;
  v_type_uuid      UUID;
  v_created        INT := 0;
  v_row            RECORD;
BEGIN
  SELECT level_id INTO v_level_id FROM classrooms WHERE id = p_classroom_id;
  IF v_level_id IS NULL THEN
    RAISE EXCEPTION 'materialize_classroom_fees : classroom % introuvable ou sans level', p_classroom_id;
  END IF;

  SELECT date_start::DATE INTO v_year_start FROM school_years WHERE id = p_school_year_id;
  IF v_year_start IS NULL THEN
    v_year_start := DATE_TRUNC('year', CURRENT_DATE);
  END IF;

  BEGIN
    v_type_uuid := p_student_type_id::UUID;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'materialize_classroom_fees : student_type_id % invalide (attendu UUID)', p_student_type_id;
  END;

  -- Copie chaque installment de niveau vers classroom si absent
  FOR v_row IN
    SELECT lfi.*
    FROM level_fee_installments lfi
    WHERE lfi.level_id = v_level_id
      AND lfi.student_type_id = v_type_uuid
      AND NOT EXISTS (
        SELECT 1 FROM classroom_fee_installments cfi
        WHERE cfi.classroom_id = p_classroom_id
          AND cfi.student_type_id = v_type_uuid
          AND cfi."order" = lfi."order"
      )
  LOOP
    INSERT INTO classroom_fee_installments (
      classroom_id, student_type_id, "order", label, category,
      due_month, due_year_offset, due_date, amount, overrides_level_installment_id
    ) VALUES (
      p_classroom_id, v_type_uuid, v_row."order", v_row.label, v_row.category,
      v_row.due_month, v_row.due_year_offset,
      -- due_date calcule : v_year_start + (due_month - month_of_year_start) mois + due_year_offset annees
      (v_year_start + MAKE_INTERVAL(months => v_row.due_month - EXTRACT(MONTH FROM v_year_start)::INT, years => COALESCE(v_row.due_year_offset, 0)))::DATE,
      COALESCE(v_row.amount, 0),
      v_row.id
    )
    ON CONFLICT DO NOTHING;
    v_created := v_created + 1;
  END LOOP;

  RETURN v_created;
END $function$;

COMMENT ON FUNCTION public.materialize_classroom_fees IS
  'Copie level_fee_installments -> classroom_fee_installments (lazy). Calcule due_date depuis year.date_start.';

-- -----------------------------------------------------------------------------
-- 2. Trigger auto-materialisation sur INSERT SSYL
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_ssyl_materialize_fees()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.classroom_id IS NOT NULL AND NEW.type_student_id IS NOT NULL AND NEW.school_year_id IS NOT NULL THEN
    PERFORM materialize_classroom_fees(NEW.classroom_id, NEW.type_student_id, NEW.school_year_id);
  END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS on_ssyl_materialize_fees ON student_school_year_loggings;
CREATE TRIGGER on_ssyl_materialize_fees
  AFTER INSERT ON student_school_year_loggings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ssyl_materialize_fees();

-- -----------------------------------------------------------------------------
-- 3. Backfill : materialiser pour tous les SSYL existants
-- -----------------------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id, classroom_id, type_student_id, school_year_id
           FROM student_school_year_loggings
           WHERE classroom_id IS NOT NULL AND type_student_id IS NOT NULL AND school_year_id IS NOT NULL
             AND deleted_at IS NULL
  LOOP
    BEGIN
      PERFORM materialize_classroom_fees(r.classroom_id, r.type_student_id, r.school_year_id);
    EXCEPTION WHEN others THEN
      -- silencieux : on ignore les SSYL avec donnees invalides (student_type_id text non-UUID par ex.)
      NULL;
    END;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 4. Vue v_ssyl_installment_status : join sur ssyl.type_student_id (cast text)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_ssyl_installment_status AS
SELECT
  ssyl.id AS ssyl_id,
  cfi.id AS installment_id,
  cfi.label,
  cfi.category,
  cfi.due_date,
  cfi.amount AS amount_due,
  COALESCE(SUM(pa.allocated_amount), 0::numeric) AS amount_paid,
  CASE
    WHEN COALESCE(SUM(pa.allocated_amount), 0::numeric) >= cfi.amount THEN 'paid'
    WHEN COALESCE(SUM(pa.allocated_amount), 0::numeric) > 0::numeric THEN 'partial'
    WHEN cfi.due_date < CURRENT_DATE THEN 'overdue'
    WHEN cfi.due_date <= (CURRENT_DATE + INTERVAL '7 days') THEN 'due'
    ELSE 'future'
  END AS status
FROM student_school_year_loggings ssyl
JOIN classroom_fee_installments cfi
  ON cfi.classroom_id = ssyl.classroom_id
  AND cfi.student_type_id::text = ssyl.type_student_id
LEFT JOIN ledger_transactions lt
  ON lt.ref_id = ssyl.id
LEFT JOIN payment_allocations pa
  ON pa.fee_installment_id = cfi.id
  AND pa.payment_tx_id = lt.id
WHERE ssyl.deleted_at IS NULL
GROUP BY ssyl.id, cfi.id, cfi.label, cfi.category, cfi.due_date, cfi.amount;

COMMENT ON VIEW v_ssyl_installment_status IS
  'Statut par installment pour chaque SSYL. Utilise classroom_fee_installments materialise depuis level_fee_installments.';
