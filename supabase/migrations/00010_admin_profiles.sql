-- Admin profiles and admin-level RLS policies

CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_profiles_user ON admin_profiles(user_id);

ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_profiles WHERE user_id = auth.uid()
  )
$$;

-- Admin can view/update own profile
CREATE POLICY "Admins can view own profile"
  ON admin_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can update own profile"
  ON admin_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- ========== Admin read access to all tables ==========

CREATE POLICY "Admins can view all schools"
  ON schools FOR SELECT USING (is_admin());

CREATE POLICY "Admins can manage schools"
  ON schools FOR ALL USING (is_admin());

CREATE POLICY "Admins can view all school_years"
  ON school_years FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all cycles"
  ON cycles FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all levels"
  ON levels FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all classrooms"
  ON classrooms FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all families"
  ON families FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all students"
  ON students FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all student_school_year_loggings"
  ON student_school_year_loggings FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all type_paiements"
  ON type_paiements FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all type_students"
  ON type_students FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all type_families"
  ON type_families FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all classroom_school_fees"
  ON classroom_school_fees FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all classroom_school_fees_by_parts"
  ON classroom_school_fees_by_parts FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all paiements"
  ON paiements FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all student_paiement_by_parts"
  ON student_paiement_by_parts FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all parent_profiles"
  ON parent_profiles FOR SELECT USING (is_admin());

CREATE POLICY "Admins can manage parent_profiles"
  ON parent_profiles FOR ALL USING (is_admin());

CREATE POLICY "Admins can view all periodes"
  ON periodes FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all subject_groups"
  ON subject_groups FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all subjects"
  ON subjects FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all teacher_profiles"
  ON teacher_profiles FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all classroom_subjects"
  ON classroom_subjects FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all evaluations"
  ON evaluations FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all notes"
  ON notes FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all bulletins"
  ON bulletins FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all bulletin_subjects"
  ON bulletin_subjects FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all conversations"
  ON conversations FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all conversation_participants"
  ON conversation_participants FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all timetable_slots"
  ON timetable_slots FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all attendance_records"
  ON attendance_records FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all announcements"
  ON announcements FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all notifications"
  ON notifications FOR SELECT USING (is_admin());
