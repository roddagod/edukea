-- =============================================================================
-- 00071 — RPC resync_classroom_fees : purge + re-materialise (source de verite lfi)
-- =============================================================================
-- Bug : des classroom_fee_installments creees manuellement ou via un ancien code
-- (avec label 'Tranche X' vs nouveau 'Scolarite — Tranche X') restent en base
-- sans overrides_level_installment_id -> doublons dans l'echeancier.
--
-- Solution : RPC qui purge TOUTES les cfi d'un couple (classroom, student_type)
-- puis re-materialise depuis level_fee_installments. Source de verite = lfi.
--
-- + Trigger sur INSERT/DELETE lfi : appelle automatiquement resync pour tous
--   les classrooms du level.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.resync_classroom_fees(
  p_classroom_id text,
  p_student_type_id text,
  p_school_year_id text
) RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_type_uuid UUID;
BEGIN
  BEGIN
    v_type_uuid := p_student_type_id::UUID;
  EXCEPTION WHEN others THEN
    RETURN 0;
  END;

  -- 1. Purge TOUTES les cfi de ce couple (avec ou sans overrides)
  DELETE FROM classroom_fee_installments
   WHERE classroom_id = p_classroom_id
     AND student_type_id = v_type_uuid;

  -- 2. Re-materialise depuis les lfi actuels
  RETURN materialize_classroom_fees(p_classroom_id, p_student_type_id, p_school_year_id);
END $function$;

COMMENT ON FUNCTION public.resync_classroom_fees IS
  'Purge + re-materialise classroom_fee_installments d''un couple classroom/type. Source de verite = level_fee_installments.';

-- Trigger sur level_fee_installments : re-sync auto tous les SSYL impactes
CREATE OR REPLACE FUNCTION public.trigger_level_fee_change_resync()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  r RECORD;
  v_target_level_id TEXT;
  v_target_type_id UUID;
BEGIN
  -- Sur DELETE, utiliser OLD ; sur INSERT/UPDATE, NEW
  IF TG_OP = 'DELETE' THEN
    v_target_level_id := OLD.level_id;
    v_target_type_id := OLD.student_type_id;
  ELSE
    v_target_level_id := NEW.level_id;
    v_target_type_id := NEW.student_type_id;
  END IF;

  FOR r IN
    SELECT DISTINCT ssyl.classroom_id, ssyl.school_year_id
      FROM student_school_year_loggings ssyl
      JOIN classrooms cr ON cr.id = ssyl.classroom_id
     WHERE cr.level_id = v_target_level_id
       AND ssyl.type_student_id = v_target_type_id::text
       AND ssyl.deleted_at IS NULL
  LOOP
    BEGIN
      PERFORM resync_classroom_fees(r.classroom_id, v_target_type_id::text, r.school_year_id);
    EXCEPTION WHEN others THEN NULL;
    END;
  END LOOP;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END $function$;

-- Remplace l'ancien trigger de materialisation par ce nouveau resync
DROP TRIGGER IF EXISTS on_level_fee_installment_change ON level_fee_installments;
DROP TRIGGER IF EXISTS on_level_fee_installment_resync ON level_fee_installments;
CREATE TRIGGER on_level_fee_installment_resync
  AFTER INSERT OR UPDATE OR DELETE ON level_fee_installments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_level_fee_change_resync();
