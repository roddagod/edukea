-- =========================================================================
-- Migration 00041 — Disponibilité matières par année + statut clôture période (S3D fondations)
-- =========================================================================

-- Toggle par année pour les matières optionnelles (LV2, musique, arts)
CREATE TABLE IF NOT EXISTS subject_school_year_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  school_year_id TEXT NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(subject_id, school_year_id)
);

CREATE INDEX IF NOT EXISTS idx_ssya_year
  ON subject_school_year_availability(school_year_id);

-- Override calendrier + verrou notes par (classe × période)
CREATE TABLE IF NOT EXISTS classroom_periode_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  periode_id UUID NOT NULL REFERENCES periodes(id) ON DELETE CASCADE,
  actual_end_date DATE,
  notes_locked BOOLEAN NOT NULL DEFAULT false,
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  closure_wizard_run_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(classroom_id, periode_id)
);

CREATE INDEX IF NOT EXISTS idx_cps_classroom ON classroom_periode_status(classroom_id);
CREATE INDEX IF NOT EXISTS idx_cps_periode ON classroom_periode_status(periode_id);
