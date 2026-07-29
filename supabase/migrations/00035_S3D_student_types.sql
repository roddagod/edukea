-- =========================================================================
-- Migration 00035 — Types d'élèves (S3D fondations)
--
-- Introduit une table `student_types` définie librement par école (au lieu
-- d'un enum figé). Séed 3 types standards ivoiriens à la création d'école
-- via trigger. Ajoute FK sur `students.student_type_id`.
-- =========================================================================

CREATE TABLE IF NOT EXISTS student_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id, code)
);

-- Un seul is_default par école (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_types_one_default_per_school
  ON student_types(school_id) WHERE is_default = true;

-- FK sur students (nullable jusqu'à la première inscription)
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS student_type_id UUID REFERENCES student_types(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_students_student_type_id ON students(student_type_id);

-- Trigger seed automatique à la création d'école
CREATE OR REPLACE FUNCTION seed_default_student_types()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO student_types (school_id, code, label, "order", is_default) VALUES
    (NEW.id, 'not_affected', 'Élève non-affecté', 1, true),
    (NEW.id, 'affected',     'Élève affecté d''État', 2, false),
    (NEW.id, 'social_case',  'Cas social', 3, false)
  ON CONFLICT (school_id, code) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_school_created_seed_student_types ON schools;
CREATE TRIGGER on_school_created_seed_student_types
  AFTER INSERT ON schools
  FOR EACH ROW
  EXECUTE FUNCTION seed_default_student_types();

COMMENT ON TABLE student_types IS
  'Types d''élèves définis librement par école (ex: affecté / non-affecté / cas social pour CI). Impacte la grille tarifaire (level_fee_lines) et l''affichage bulletin.';
