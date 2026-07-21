-- =========================================================================
-- Migration 00039 — Setup pédagogique (enseignants + classes + année) (S3D fondations)
-- =========================================================================

-- Flag SaaS-native pour les données legacy sync
ALTER TABLE cycles
  ADD COLUMN IF NOT EXISTS created_natively BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE levels
  ADD COLUMN IF NOT EXISTS created_natively BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE classrooms
  ADD COLUMN IF NOT EXISTS created_natively BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS principal_teacher_id UUID REFERENCES teacher_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_classrooms_principal_teacher
  ON classrooms(principal_teacher_id);

-- Type de période au niveau année
ALTER TABLE school_years
  ADD COLUMN IF NOT EXISTS periode_type TEXT
    CHECK (periode_type IN ('trimestre', 'semestre'));

-- Signature scannée du prof (pour PDF bulletin)
ALTER TABLE teacher_profiles
  ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- Invitations enseignants (email + magic link)
CREATE TABLE IF NOT EXISTS teacher_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  token TEXT UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  UNIQUE(school_id, email)
);

CREATE INDEX IF NOT EXISTS idx_teacher_invitations_school
  ON teacher_invitations(school_id);
CREATE INDEX IF NOT EXISTS idx_teacher_invitations_email
  ON teacher_invitations(email);

-- Extensions inscription (impact bulletin)
ALTER TABLE student_school_year_loggings
  ADD COLUMN IF NOT EXISTS is_redoublant BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lv2_subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mat_secondaire_subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS eps_exemption BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_ssyl_lv2 ON student_school_year_loggings(lv2_subject_id);
