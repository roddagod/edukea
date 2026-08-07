-- =============================================================================
-- 00065 — Empeche la suppression d'une annee scolaire si des SSYL actifs existent
-- =============================================================================
-- Sinon on aurait des inscriptions orphelines pointant vers une annee soft-deleted,
-- avec des paiements deja enregistres. C'est irrattrapable pour la comptabilite.
--
-- Fix : trigger BEFORE UPDATE qui verifie qu'aucun SSYL actif ne pointe sur l'annee.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.trigger_prevent_year_delete_if_enrolled()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
DECLARE
  v_count INT;
BEGIN
  -- On agit seulement si on passe de NULL a NOT NULL sur deleted_at
  IF NEW.deleted_at IS NOT NULL AND (OLD.deleted_at IS NULL) THEN
    SELECT COUNT(*) INTO v_count
      FROM student_school_year_loggings
     WHERE school_year_id = NEW.id
       AND deleted_at IS NULL;
    IF v_count > 0 THEN
      RAISE EXCEPTION
        'Impossible de supprimer cette annee : % eleve(s) inscrit(s). Archivez ou transferez d''abord les inscriptions.',
        v_count;
    END IF;
  END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS on_school_year_delete_check_enrollments ON school_years;
CREATE TRIGGER on_school_year_delete_check_enrollments
  BEFORE UPDATE OF deleted_at ON school_years
  FOR EACH ROW
  EXECUTE FUNCTION trigger_prevent_year_delete_if_enrolled();

COMMENT ON FUNCTION public.trigger_prevent_year_delete_if_enrolled IS
  'Empeche le soft-delete d''une annee scolaire si des SSYL actifs y sont rattaches.';
