-- =============================================================================
-- 00058 — Repointer FK SSYL.type_student_id vers student_types (nouveau schema)
-- =============================================================================
-- Bug : student_school_year_loggings.type_student_id avait une FK vers la table
-- legacy `type_students` (v2), alors que le wizard Edukea utilise `student_types`
-- (nouveau schema). Toute inscription native tombait en FK violation silencieuse.
--
-- Fix :
--   1. Drop l'ancienne FK vers type_students
--   2. Nettoyer les type_student_id qui ne pointent PAS vers student_types (data legacy)
--   3. Ajouter FK vers student_types
-- =============================================================================

-- 1. Drop l'ancienne FK legacy
ALTER TABLE student_school_year_loggings
  DROP CONSTRAINT IF EXISTS student_school_year_loggings_type_student_id_fkey;

-- 2. Nettoyer les valeurs orphelines (type_student_id qui n'est ni NULL ni dans student_types)
UPDATE student_school_year_loggings
   SET type_student_id = NULL
 WHERE type_student_id IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM student_types st WHERE st.id::text = student_school_year_loggings.type_student_id
   );

-- 3. Ajouter la nouvelle FK vers student_types (avec cast text -> uuid via trigger de validation)
--    Note : on ne peut pas mettre une FK text -> uuid direct. On la garde declarative
--    via une CHECK sur EXISTS (cout : full scan si beaucoup d'inserts). Alternative :
--    changer le type de la colonne. Pour V1 on cree juste un index + trigger.

CREATE INDEX IF NOT EXISTS idx_ssyl_type_student_id ON student_school_year_loggings(type_student_id);

-- Trigger de validation soft (evite les erreurs SQL cryptiques cote client)
CREATE OR REPLACE FUNCTION public.trigger_validate_ssyl_type_student()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.type_student_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM student_types st WHERE st.id::text = NEW.type_student_id)
  THEN
    RAISE EXCEPTION 'type_student_id % introuvable dans student_types (ecole %)',
      NEW.type_student_id, NEW.school_id;
  END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS validate_ssyl_type_student ON student_school_year_loggings;
CREATE TRIGGER validate_ssyl_type_student
  BEFORE INSERT OR UPDATE OF type_student_id ON student_school_year_loggings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_validate_ssyl_type_student();
