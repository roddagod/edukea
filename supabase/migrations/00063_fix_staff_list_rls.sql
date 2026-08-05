-- =============================================================================
-- 00063 — RLS school_staff_profiles : managers voient tous les staff de leur ecole
-- =============================================================================
-- Bug : Un manager creait un user nzi@live.fr, l'user pouvait se connecter,
-- mais n'apparaissait pas dans la liste /dashboard/users.
-- Root cause : RLS SELECT ne permettait qu'a chaque staff de voir son propre
-- profil (user_id = auth.uid()) ou aux superadmins de tout voir.
--
-- Fix : ajouter une policy SELECT permettant aux staff de voir TOUS les
-- profils de leur ecole (partage entre collegues).
-- =============================================================================

DROP POLICY IF EXISTS "Staff can view own school staff" ON school_staff_profiles;
CREATE POLICY "Staff can view own school staff"
  ON school_staff_profiles
  FOR SELECT
  USING (school_id = get_school_staff_school_id());

COMMENT ON POLICY "Staff can view own school staff" ON school_staff_profiles IS
  'Chaque staff peut voir tous les autres staff de son ecole (permet a un manager de gerer son equipe).';
