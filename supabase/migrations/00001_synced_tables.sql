-- Tables synchronized from Edukea v2 MySQL database
-- IDs are TEXT (UUID varchar(36) from MySQL)
-- Soft deletes preserved via deleted_at

CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  bp TEXT,
  adress TEXT,
  slogan TEXT,
  logo_id INTEGER,
  created_by INTEGER,
  cinet_pay_api_key TEXT,
  cinet_pay_site_id TEXT,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS school_years (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date_start TIMESTAMPTZ,
  date_end TIMESTAMPTZ,
  created_by INTEGER,
  school_id TEXT REFERENCES schools(id),
  school_year_id TEXT,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS cycles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  order_by INTEGER DEFAULT 0,
  school_id TEXT,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS levels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  order_by INTEGER DEFAULT 0,
  cycle_id TEXT REFERENCES cycles(id),
  school_id TEXT,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS classroom_types (
  id TEXT PRIMARY KEY,
  name TEXT,
  order_by INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS classrooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  order_by INTEGER DEFAULT 0,
  created_by INTEGER,
  level_id TEXT REFERENCES levels(id),
  school_id TEXT REFERENCES schools(id),
  school_year_id TEXT REFERENCES school_years(id),
  type_id TEXT,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS type_families (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  order_by INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS families (
  id TEXT PRIMARY KEY,
  code TEXT,
  firstname TEXT,
  lastname TEXT,
  address TEXT,
  email TEXT,
  job TEXT,
  phone TEXT,
  residence TEXT,
  level INTEGER,
  created_by INTEGER,
  school_id TEXT REFERENCES schools(id),
  type_id TEXT REFERENCES type_families(id),
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS type_students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_by INTEGER,
  school_id TEXT REFERENCES schools(id),
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  matricule TEXT,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  date_of_birth TIMESTAMPTZ,
  place_of_birth TEXT,
  sex TEXT,
  nationality TEXT,
  email TEXT,
  birth_certificate_number TEXT,
  is_registration SMALLINT DEFAULT 0,
  profil_id TEXT,
  school_id TEXT REFERENCES schools(id),
  father_id TEXT REFERENCES families(id),
  mother_id TEXT REFERENCES families(id),
  tutor_id TEXT REFERENCES families(id),
  type_id TEXT REFERENCES type_students(id),
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS type_paiements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  order_by INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS classroom_school_fees (
  id TEXT PRIMARY KEY,
  name TEXT,
  registration_fees TEXT,
  additionnal_fees TEXT,
  school_fees TEXT,
  school_fees_discount TEXT,
  school_fees_net TEXT,
  total_paiement_part TEXT,
  created_by INTEGER,
  classroom_id TEXT REFERENCES classrooms(id),
  school_id TEXT REFERENCES schools(id),
  school_year_id TEXT REFERENCES school_years(id),
  type_student_id TEXT REFERENCES type_students(id),
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS classroom_school_fees_by_parts (
  id TEXT PRIMARY KEY,
  name TEXT,
  amount INTEGER DEFAULT 0,
  due_date TIMESTAMPTZ,
  "order" INTEGER DEFAULT 0,
  school_fees_id TEXT REFERENCES classroom_school_fees(id),
  type_id TEXT REFERENCES type_paiements(id),
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS student_school_year_loggings (
  id TEXT PRIMARY KEY,
  is_first_register SMALLINT DEFAULT 0,
  repeating SMALLINT DEFAULT 0,
  paiement_status TEXT,
  eps SMALLINT DEFAULT 0,
  discount DOUBLE PRECISION DEFAULT 0,
  school_fees_total DOUBLE PRECISION DEFAULT 0,
  school_fees_paid DOUBLE PRECISION DEFAULT 0,
  registration_fees_pay SMALLINT DEFAULT 0,
  additionnal_fees_pay SMALLINT DEFAULT 0,
  school_fees_pay SMALLINT DEFAULT 0,
  classroom_id TEXT REFERENCES classrooms(id),
  type_student_id TEXT REFERENCES type_students(id),
  school_fees_id TEXT REFERENCES classroom_school_fees(id),
  lv2_id TEXT,
  secondary_subject_id TEXT,
  school_year_id TEXT REFERENCES school_years(id),
  student_id TEXT REFERENCES students(id),
  school_id TEXT REFERENCES schools(id),
  created_by TEXT,
  profil_id TEXT,
  is_not_register SMALLINT DEFAULT 0,
  solde_register SMALLINT DEFAULT 0,
  registration_date DATE,
  is_transfer SMALLINT DEFAULT 0,
  remaining_balance_transfer DOUBLE PRECISION DEFAULT 0,
  permonth_amount_tobe_received DOUBLE PRECISION DEFAULT 0,
  permonth_amount_received DOUBLE PRECISION DEFAULT 0,
  permonth_amount_due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS paiements (
  id TEXT PRIMARY KEY,
  amount INTEGER DEFAULT 0,
  created_by INTEGER,
  school_id TEXT REFERENCES schools(id),
  student_school_year_logging_id TEXT REFERENCES student_school_year_loggings(id),
  is_discount SMALLINT DEFAULT 0,
  paiement_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS student_paiement_by_parts (
  id TEXT PRIMARY KEY,
  pay_state SMALLINT DEFAULT 0,
  amount INTEGER DEFAULT 0,
  part_id TEXT REFERENCES classroom_school_fees_by_parts(id),
  paiement_id TEXT REFERENCES paiements(id),
  student_school_year_logging_id TEXT REFERENCES student_school_year_loggings(id),
  is_discount SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Parent profiles (links Supabase auth to families/students)
CREATE TABLE IF NOT EXISTS parent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id TEXT NOT NULL REFERENCES schools(id),
  student_id TEXT REFERENCES students(id),
  father_id TEXT REFERENCES families(id),
  mother_id TEXT REFERENCES families(id),
  tutor_id TEXT REFERENCES families(id),
  phone TEXT,
  push_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_school_years_school ON school_years(school_id);
CREATE INDEX IF NOT EXISTS idx_levels_cycle ON levels(cycle_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_level ON classrooms(level_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_school_year ON classrooms(school_year_id);
CREATE INDEX IF NOT EXISTS idx_families_school ON families(school_id);
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_father ON students(father_id);
CREATE INDEX IF NOT EXISTS idx_students_mother ON students(mother_id);
CREATE INDEX IF NOT EXISTS idx_students_tutor ON students(tutor_id);
CREATE INDEX IF NOT EXISTS idx_ssyl_student ON student_school_year_loggings(student_id);
CREATE INDEX IF NOT EXISTS idx_ssyl_classroom ON student_school_year_loggings(classroom_id);
CREATE INDEX IF NOT EXISTS idx_ssyl_school_year ON student_school_year_loggings(school_year_id);
CREATE INDEX IF NOT EXISTS idx_ssyl_school ON student_school_year_loggings(school_id);
CREATE INDEX IF NOT EXISTS idx_paiements_school ON paiements(school_id);
CREATE INDEX IF NOT EXISTS idx_paiements_ssyl ON paiements(student_school_year_logging_id);
CREATE INDEX IF NOT EXISTS idx_spbp_part ON student_paiement_by_parts(part_id);
CREATE INDEX IF NOT EXISTS idx_spbp_paiement ON student_paiement_by_parts(paiement_id);
CREATE INDEX IF NOT EXISTS idx_spbp_ssyl ON student_paiement_by_parts(student_school_year_logging_id);
CREATE INDEX IF NOT EXISTS idx_parent_profiles_user ON parent_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_parent_profiles_school ON parent_profiles(school_id);
