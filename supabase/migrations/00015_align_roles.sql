-- ============================================================
-- Aligner les rôles school_staff avec ROLES_ET_FONCTIONNALITES.md
--
-- Ancien CHECK : ('director', 'accountant', 'staff')
-- Nouveau CHECK : ('manager', 'director', 'vice_principal', 'teacher')
--   - manager        = Gestionnaire d'établissement (COO)
--   - director       = Directeur pédagogique
--   - vice_principal = Censeur (sur scope)
--   - teacher        = Enseignant
--
-- Le rôle "Fondateur" est un cas particulier : il est modélisé
-- via founder_scope (multi-écoles, lecture seule) — hors périmètre de
-- cette migration.
--
-- Le compte technique admin@edukea.com est déplacé de school_staff_profiles
-- vers admin_profiles (rôle 'superadmin').
-- ============================================================

-- 1. Déplacer admin@edukea.com vers admin_profiles (superadmin)
INSERT INTO admin_profiles (user_id, role, display_name)
SELECT u.id, 'superadmin', 'Joel Akoun (Lambano)'
FROM auth.users u
WHERE u.email = 'admin@edukea.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'superadmin', display_name = EXCLUDED.display_name;

-- 2. Retirer sa row school_staff_profiles (il n'est plus staff d'une école)
DELETE FROM school_staff_profiles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@edukea.com');

-- 3. Aligner le CHECK constraint sur les rôles du doc
ALTER TABLE school_staff_profiles DROP CONSTRAINT IF EXISTS school_staff_profiles_role_check;
ALTER TABLE school_staff_profiles
  ADD CONSTRAINT school_staff_profiles_role_check
  CHECK (role IN ('manager', 'director', 'vice_principal', 'teacher'));

-- 4. Changer le default à 'manager' (le plus courant en pratique lors de la création d'un compte école)
ALTER TABLE school_staff_profiles ALTER COLUMN role SET DEFAULT 'manager';
