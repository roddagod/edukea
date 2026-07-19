-- ============================================================
-- SCHOOL STAFF PROFILES
-- Rattache un user Supabase auth à une école avec un rôle.
-- Étend les policies RLS du ledger pour que les chefs d'établissement
-- puissent voir les écritures de leur école.
-- ============================================================

CREATE TABLE IF NOT EXISTS school_staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  role TEXT NOT NULL DEFAULT 'director' CHECK (role IN ('director', 'accountant', 'staff')),
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, school_id)
);

CREATE INDEX IF NOT EXISTS idx_school_staff_user ON school_staff_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_school_staff_school ON school_staff_profiles(school_id);

ALTER TABLE school_staff_profiles ENABLE ROW LEVEL SECURITY;

-- Helper : renvoie l'ID de l'école du user courant (premier match)
CREATE OR REPLACE FUNCTION get_school_staff_school_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM school_staff_profiles
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- Helper : true si l'user est staff d'une école
CREATE OR REPLACE FUNCTION is_school_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM school_staff_profiles WHERE user_id = auth.uid())
$$;

-- Policies sur la table elle-même
CREATE POLICY "Staff can view own profile"
  ON school_staff_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all staff profiles"
  ON school_staff_profiles FOR SELECT USING (is_admin());

CREATE POLICY "Admins can manage staff profiles"
  ON school_staff_profiles FOR ALL USING (is_admin());

-- ============================================================
-- Étendre RLS ledger : school_staff voit sa propre école
-- ============================================================

CREATE POLICY "School staff can view own school ledger accounts"
  ON ledger_accounts FOR SELECT
  USING (school_id = get_school_staff_school_id());

CREATE POLICY "School staff can view own school ledger entries"
  ON ledger_entries FOR SELECT
  USING (school_id = get_school_staff_school_id());

CREATE POLICY "School staff can view own school ledger transactions"
  ON ledger_transactions FOR SELECT
  USING (school_id = get_school_staff_school_id());

-- ============================================================
-- Étendre RLS domain tables (paiements, students, ssyl, etc.)
-- pour que le cockpit puisse aussi afficher les infos de contexte
-- ============================================================

CREATE POLICY "School staff can view own school"
  ON schools FOR SELECT
  USING (id = get_school_staff_school_id());

CREATE POLICY "School staff can view own school years"
  ON school_years FOR SELECT
  USING (school_id = get_school_staff_school_id());

CREATE POLICY "School staff can view own school cycles"
  ON cycles FOR SELECT
  USING (school_id = get_school_staff_school_id());

CREATE POLICY "School staff can view own school levels"
  ON levels FOR SELECT
  USING (school_id = get_school_staff_school_id());

CREATE POLICY "School staff can view own school classrooms"
  ON classrooms FOR SELECT
  USING (school_id = get_school_staff_school_id());

CREATE POLICY "School staff can view own school students"
  ON students FOR SELECT
  USING (school_id = get_school_staff_school_id());

CREATE POLICY "School staff can view own school ssyl"
  ON student_school_year_loggings FOR SELECT
  USING (school_id = get_school_staff_school_id());

CREATE POLICY "School staff can view own school paiements"
  ON paiements FOR SELECT
  USING (school_id = get_school_staff_school_id());

CREATE POLICY "School staff can view own school families"
  ON families FOR SELECT
  USING (school_id = get_school_staff_school_id());

GRANT EXECUTE ON FUNCTION get_school_staff_school_id TO authenticated;
GRANT EXECUTE ON FUNCTION is_school_staff TO authenticated;
