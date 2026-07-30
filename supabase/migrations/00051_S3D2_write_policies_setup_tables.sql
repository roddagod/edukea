-- =========================================================================
-- Migration 00051 — Write policies pour tables setup (S3D.2)
--
-- Bug détecté : cycles/levels/classrooms/school_years/periodes/subjects
-- avaient uniquement des policies SELECT (héritage sync legacy). Les
-- INSERT/UPDATE/DELETE étaient bloqués par RLS même pour superadmin.
--
-- Fix : ajout d'une policy ALL pour admins + school_staff sur toutes les
-- tables du hub Rentrée.
-- =========================================================================

-- cycles
DROP POLICY IF EXISTS cycles_admin_staff_all ON cycles;
CREATE POLICY cycles_admin_staff_all ON cycles
  FOR ALL TO authenticated
  USING (is_admin() OR school_id = get_school_staff_school_id())
  WITH CHECK (is_admin() OR school_id = get_school_staff_school_id());

-- levels
DROP POLICY IF EXISTS levels_admin_staff_all ON levels;
CREATE POLICY levels_admin_staff_all ON levels
  FOR ALL TO authenticated
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM cycles c
      WHERE c.id = levels.cycle_id
        AND c.school_id = get_school_staff_school_id()
    ) OR school_id = get_school_staff_school_id()
  )
  WITH CHECK (
    is_admin() OR EXISTS (
      SELECT 1 FROM cycles c
      WHERE c.id = levels.cycle_id
        AND c.school_id = get_school_staff_school_id()
    ) OR school_id = get_school_staff_school_id()
  );

-- classrooms
DROP POLICY IF EXISTS classrooms_admin_staff_all ON classrooms;
CREATE POLICY classrooms_admin_staff_all ON classrooms
  FOR ALL TO authenticated
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM levels l JOIN cycles c ON c.id = l.cycle_id
      WHERE l.id = classrooms.level_id
        AND c.school_id = get_school_staff_school_id()
    ) OR school_id = get_school_staff_school_id()
  )
  WITH CHECK (
    is_admin() OR EXISTS (
      SELECT 1 FROM levels l JOIN cycles c ON c.id = l.cycle_id
      WHERE l.id = classrooms.level_id
        AND c.school_id = get_school_staff_school_id()
    ) OR school_id = get_school_staff_school_id()
  );

-- school_years
DROP POLICY IF EXISTS school_years_admin_staff_all ON school_years;
CREATE POLICY school_years_admin_staff_all ON school_years
  FOR ALL TO authenticated
  USING (is_admin() OR school_id = get_school_staff_school_id())
  WITH CHECK (is_admin() OR school_id = get_school_staff_school_id());

-- periodes
DROP POLICY IF EXISTS periodes_admin_staff_all ON periodes;
CREATE POLICY periodes_admin_staff_all ON periodes
  FOR ALL TO authenticated
  USING (is_admin() OR school_id = get_school_staff_school_id())
  WITH CHECK (is_admin() OR school_id = get_school_staff_school_id());

-- subjects
DROP POLICY IF EXISTS subjects_admin_staff_all ON subjects;
CREATE POLICY subjects_admin_staff_all ON subjects
  FOR ALL TO authenticated
  USING (is_admin() OR school_id = get_school_staff_school_id())
  WITH CHECK (is_admin() OR school_id = get_school_staff_school_id());

-- subject_groups
DROP POLICY IF EXISTS subject_groups_admin_staff_all ON subject_groups;
CREATE POLICY subject_groups_admin_staff_all ON subject_groups
  FOR ALL TO authenticated
  USING (is_admin() OR school_id = get_school_staff_school_id())
  WITH CHECK (is_admin() OR school_id = get_school_staff_school_id());

-- schools (pour update bareme, branding etc.)
DROP POLICY IF EXISTS schools_admin_staff_update ON schools;
CREATE POLICY schools_admin_staff_update ON schools
  FOR UPDATE TO authenticated
  USING (is_admin() OR id = get_school_staff_school_id())
  WITH CHECK (is_admin() OR id = get_school_staff_school_id());
