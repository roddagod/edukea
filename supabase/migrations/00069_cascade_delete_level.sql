-- =============================================================================
-- 00069 — Cascade delete niveau -> classes vides + garde-fou SSYL actifs
-- =============================================================================
-- Bug : un manager ne peut pas supprimer un niveau qui contient des classes
-- (FK classrooms.level_id sans CASCADE, RLS OK mais erreur SQL cryptique).
--
-- Fix :
--   1. Trigger BEFORE DELETE sur classrooms : bloque si SSYL actifs presents
--      avec message clair
--   2. FK classrooms.level_id -> ON DELETE CASCADE
--   -> supprimer un niveau supprime automatiquement ses classes VIDES.
--      Si une classe a des SSYL actifs, le trigger bloque le DELETE avec un
--      message actionable ("transferez d'abord les eleves").
-- =============================================================================

-- 1. Trigger anti-suppression si SSYL actifs
CREATE OR REPLACE FUNCTION public.trigger_prevent_classroom_delete_if_enrolled()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
DECLARE
  v_count INT;
  v_classroom_name TEXT;
BEGIN
  SELECT COUNT(*) INTO v_count
    FROM student_school_year_loggings
   WHERE classroom_id = OLD.id
     AND deleted_at IS NULL;
  IF v_count > 0 THEN
    v_classroom_name := OLD.name;
    RAISE EXCEPTION
      'Impossible de supprimer la classe "%": % eleve(s) inscrit(s). Transferez-les d''abord (fiche eleve > bouton Transferer).',
      v_classroom_name, v_count;
  END IF;
  RETURN OLD;
END $function$;

DROP TRIGGER IF EXISTS on_classroom_delete_check_enrollments ON classrooms;
CREATE TRIGGER on_classroom_delete_check_enrollments
  BEFORE DELETE ON classrooms
  FOR EACH ROW
  EXECUTE FUNCTION trigger_prevent_classroom_delete_if_enrolled();

-- 2. FK classrooms.level_id -> CASCADE (supprimer un niveau supprime ses classes)
--    Le trigger ci-dessus garantit la securite : si une classe a des SSYL, le
--    DELETE cascade echouera avec le message clair du trigger.
ALTER TABLE classrooms
  DROP CONSTRAINT IF EXISTS classrooms_level_id_fkey;
ALTER TABLE classrooms
  ADD CONSTRAINT classrooms_level_id_fkey
  FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE;

-- 3. Meme logique sur les cycles : delete cycle -> cascade sur levels
ALTER TABLE levels
  DROP CONSTRAINT IF EXISTS levels_cycle_id_fkey;
ALTER TABLE levels
  ADD CONSTRAINT levels_cycle_id_fkey
  FOREIGN KEY (cycle_id) REFERENCES cycles(id) ON DELETE CASCADE;

-- 4. classroom_fee_installments et classroom_fee_lines : cascade sur classroom
ALTER TABLE classroom_fee_installments
  DROP CONSTRAINT IF EXISTS classroom_fee_installments_classroom_id_fkey;
ALTER TABLE classroom_fee_installments
  ADD CONSTRAINT classroom_fee_installments_classroom_id_fkey
  FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE;

ALTER TABLE classroom_fee_lines
  DROP CONSTRAINT IF EXISTS classroom_fee_lines_classroom_id_fkey;
ALTER TABLE classroom_fee_lines
  ADD CONSTRAINT classroom_fee_lines_classroom_id_fkey
  FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE;

COMMENT ON FUNCTION public.trigger_prevent_classroom_delete_if_enrolled IS
  'Empeche la suppression d''une classe (directe ou en cascade depuis level) si des SSYL actifs y sont rattaches.';
