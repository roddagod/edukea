-- =============================================================================
-- 00068 — Batch fix : RLS students UPDATE + record_student_discount RPC + polissage
-- =============================================================================
-- Bugs diagnostiques :
--   N25 Erreur inscription avec reduction : record_student_discount() n'existe
--       pas mais est appelee par enroll_new_student -> RAISE cryptique
--   N27 Archiver eleve ne fonctionne pas : aucune policy RLS UPDATE sur
--       students -> archive.deleted_at bloque
--   N26 Suppression etablissement : RLS OK, a re-tester (peut etre dependant
--       de N27 via cascade delete des students)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. RLS UPDATE / DELETE sur students (staff peuvent editer leurs eleves)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage students" ON students;
CREATE POLICY "Admins manage students"
  ON students
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "School staff manage own students" ON students;
CREATE POLICY "School staff manage own students"
  ON students
  FOR ALL
  USING (school_id = get_school_staff_school_id())
  WITH CHECK (school_id = get_school_staff_school_id());

-- ---------------------------------------------------------------------------
-- 2. record_student_discount RPC (etait appele mais absent)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_student_discount(
  p_ssyl_id text,
  p_amount bigint,
  p_reason text DEFAULT 'reduction',
  p_note text DEFAULT NULL
) RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_ssyl RECORD;
  v_tx_id UUID;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'record_student_discount : montant doit etre > 0';
  END IF;

  SELECT ssyl.id, ssyl.school_id, ssyl.school_year_id, ssyl.student_id
    INTO v_ssyl
    FROM student_school_year_loggings ssyl
   WHERE ssyl.id = p_ssyl_id
     AND ssyl.deleted_at IS NULL
     AND (is_admin() OR ssyl.school_id = get_school_staff_school_id());

  IF v_ssyl.id IS NULL THEN
    RAISE EXCEPTION 'record_student_discount : SSYL % introuvable ou acces refuse', p_ssyl_id;
  END IF;

  -- Enregistre comme ledger_transaction source 'internal' (reduction interne)
  -- Diminue la creance de l'eleve (student_receivable) via ledger_entries
  INSERT INTO ledger_transactions (school_id, school_year_id, source, status, ref_type, ref_id, memo, occurred_at, posted_at)
  VALUES (v_ssyl.school_id, v_ssyl.school_year_id, 'internal', 'posted', 'discount', p_ssyl_id,
    'Reduction : ' || COALESCE(p_reason, 'reduction') || COALESCE(' — ' || p_note, ''), now(), now())
  RETURNING id INTO v_tx_id;

  -- Diminue la scolarite due (school_fees_total) sur le SSYL
  UPDATE student_school_year_loggings
     SET school_fees_total = GREATEST(0, COALESCE(school_fees_total, 0) - p_amount),
         discount = COALESCE(discount, 0) + p_amount
   WHERE id = p_ssyl_id;

  RETURN v_tx_id;
END $function$;

COMMENT ON FUNCTION public.record_student_discount IS
  'Enregistre une reduction sur la scolarite d''un SSYL. Diminue school_fees_total, augmente discount, cree une ledger_transaction ref_type=discount.';

-- ---------------------------------------------------------------------------
-- 3. Suppression sur school_year_loggings pour les staff (archive eleve inscrit)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "School staff manage own ssyl" ON student_school_year_loggings;
CREATE POLICY "School staff manage own ssyl"
  ON student_school_year_loggings
  FOR ALL
  USING (is_admin() OR school_id = get_school_staff_school_id())
  WITH CHECK (is_admin() OR school_id = get_school_staff_school_id());
