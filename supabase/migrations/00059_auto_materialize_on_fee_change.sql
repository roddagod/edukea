-- =============================================================================
-- 00059 — Auto-materialisation classroom_fee_installments a chaque changement
--          de level_fee_installments
-- =============================================================================
-- Sans ce trigger, si l'ecole configure ses frais APRES inscription des eleves,
-- classroom_fee_installments reste vide -> ventilation = 0.
-- On automatise : a chaque INSERT/UPDATE sur level_fee_installments, on
-- appelle materialize_classroom_fees pour toutes les classrooms du level
-- ayant au moins un SSYL actif avec ce student_type.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.trigger_level_fee_installment_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT ssyl.classroom_id, ssyl.school_year_id
    FROM student_school_year_loggings ssyl
    JOIN classrooms cr ON cr.id = ssyl.classroom_id
    WHERE cr.level_id = NEW.level_id
      AND ssyl.type_student_id = NEW.student_type_id::text
      AND ssyl.deleted_at IS NULL
  LOOP
    BEGIN
      PERFORM materialize_classroom_fees(r.classroom_id, NEW.student_type_id::text, r.school_year_id);
    EXCEPTION WHEN others THEN
      NULL; -- silencieux : on ne casse pas l'insert de lfi si materialisation echoue
    END;
  END LOOP;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS on_level_fee_installment_change ON level_fee_installments;
CREATE TRIGGER on_level_fee_installment_change
  AFTER INSERT OR UPDATE ON level_fee_installments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_level_fee_installment_change();

COMMENT ON FUNCTION public.trigger_level_fee_installment_change IS
  'Auto-materialise classroom_fee_installments pour tous les SSYL impactes quand un frais niveau change.';
