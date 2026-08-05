-- =============================================================================
-- 00064 — Cascade soft-delete ecole : marquer school_staff_profiles.deleted_at
-- =============================================================================
-- Quand un superadmin soft-delete une ecole, les school_staff_profiles restent
-- intacts. Les managers/directors peuvent encore se connecter et voir un
-- espace "aucune donnee". Pire : le hook useCurrentUserRole les identifie
-- toujours comme staff actif -> ils tournent en rond.
--
-- Fix :
--   1. Ajouter colonne deleted_at sur school_staff_profiles
--   2. Trigger sur schools.deleted_at : propage sur tous les staff profiles
-- =============================================================================

ALTER TABLE school_staff_profiles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_school_staff_deleted_at
  ON school_staff_profiles(deleted_at)
  WHERE deleted_at IS NULL;

-- Backfill : cascader deleted_at des ecoles deja supprimees
UPDATE school_staff_profiles ssp
   SET deleted_at = s.deleted_at
  FROM schools s
 WHERE ssp.school_id = s.id
   AND s.deleted_at IS NOT NULL
   AND ssp.deleted_at IS NULL;

-- Trigger : quand schools.deleted_at passe de NULL a NOT NULL, propager
CREATE OR REPLACE FUNCTION public.trigger_cascade_school_deletion()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  -- Cascade uniquement si on marque nouvellement comme supprime
  IF NEW.deleted_at IS NOT NULL AND (OLD.deleted_at IS NULL OR OLD.deleted_at IS DISTINCT FROM NEW.deleted_at) THEN
    UPDATE school_staff_profiles
       SET deleted_at = NEW.deleted_at
     WHERE school_id = NEW.id
       AND deleted_at IS NULL;
  END IF;
  -- Restauration : si on annule un delete
  IF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
    UPDATE school_staff_profiles
       SET deleted_at = NULL
     WHERE school_id = NEW.id
       AND deleted_at = OLD.deleted_at;
  END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS on_school_soft_delete_cascade ON schools;
CREATE TRIGGER on_school_soft_delete_cascade
  AFTER UPDATE OF deleted_at ON schools
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cascade_school_deletion();

-- Mise a jour de get_school_staff_school_id pour ignorer les profils soft-deleted
CREATE OR REPLACE FUNCTION public.get_school_staff_school_id()
  RETURNS text
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_school_id text;
BEGIN
  SELECT school_id INTO v_school_id
    FROM school_staff_profiles
   WHERE user_id = auth.uid()
     AND deleted_at IS NULL
   LIMIT 1;
  RETURN v_school_id;
END $function$;

COMMENT ON FUNCTION public.get_school_staff_school_id IS
  'Retourne le school_id du staff connecte (NULL si profil supprime ou inexistant).';
