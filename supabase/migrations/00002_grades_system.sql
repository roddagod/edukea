-- Grades and bulletin system (created natively in Supabase)

CREATE TABLE IF NOT EXISTS periodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL REFERENCES schools(id),
  school_year_id TEXT NOT NULL REFERENCES school_years(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('trimestre', 'semestre')),
  "order" INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subject_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL REFERENCES schools(id),
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL REFERENCES schools(id),
  group_id UUID NOT NULL REFERENCES subject_groups(id),
  name TEXT NOT NULL,
  coefficient NUMERIC NOT NULL DEFAULT 1,
  max_score NUMERIC NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teacher_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  personel_id TEXT,
  school_id TEXT NOT NULL REFERENCES schools(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS classroom_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id TEXT NOT NULL REFERENCES classrooms(id),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  teacher_id UUID REFERENCES teacher_profiles(id),
  coefficient_override NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(classroom_id, subject_id)
);

CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_subject_id UUID NOT NULL REFERENCES classroom_subjects(id),
  periode_id UUID NOT NULL REFERENCES periodes(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('devoir', 'composition', 'examen')),
  max_score NUMERIC NOT NULL DEFAULT 20,
  weight NUMERIC NOT NULL DEFAULT 1,
  date DATE NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id),
  student_id TEXT NOT NULL REFERENCES students(id),
  score NUMERIC,
  is_absent BOOLEAN NOT NULL DEFAULT false,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(evaluation_id, student_id)
);

CREATE TABLE IF NOT EXISTS bulletins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL REFERENCES students(id),
  periode_id UUID NOT NULL REFERENCES periodes(id),
  classroom_id TEXT NOT NULL REFERENCES classrooms(id),
  average NUMERIC,
  rank INTEGER,
  total_students INTEGER,
  general_appreciation TEXT,
  principal_appreciation TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, periode_id)
);

CREATE TABLE IF NOT EXISTS bulletin_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bulletin_id UUID NOT NULL REFERENCES bulletins(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id),
  average NUMERIC,
  rank INTEGER,
  min_average NUMERIC,
  max_average NUMERIC,
  class_average NUMERIC,
  teacher_appreciation TEXT,
  UNIQUE(bulletin_id, subject_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_periodes_school_year ON periodes(school_year_id);
CREATE INDEX IF NOT EXISTS idx_subjects_group ON subjects(group_id);
CREATE INDEX IF NOT EXISTS idx_classroom_subjects_classroom ON classroom_subjects(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_subjects_teacher ON classroom_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_classroom_subject ON evaluations(classroom_subject_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_periode ON evaluations(periode_id);
CREATE INDEX IF NOT EXISTS idx_notes_evaluation ON notes(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_notes_student ON notes(student_id);
CREATE INDEX IF NOT EXISTS idx_bulletins_student ON bulletins(student_id);
CREATE INDEX IF NOT EXISTS idx_bulletins_periode ON bulletins(periode_id);
CREATE INDEX IF NOT EXISTS idx_bulletin_subjects_bulletin ON bulletin_subjects(bulletin_id);
