-- =========================================================================
-- Migration 00038 — Branding école + bulletin_config (S3D fondations)
-- =========================================================================

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS motto TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS postal_address TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS accreditation_number TEXT,
  ADD COLUMN IF NOT EXISTS accent_color TEXT NOT NULL DEFAULT '#E97423',
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS stamp_url TEXT,
  ADD COLUMN IF NOT EXISTS director_signature_url TEXT,
  ADD COLUMN IF NOT EXISTS structure_seeded_from TEXT,
  ADD COLUMN IF NOT EXISTS default_max_score NUMERIC NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS bulletin_config JSONB NOT NULL DEFAULT '{
    "show_class_stats": true,
    "show_rank": true,
    "show_absences": false,
    "show_student_type": false,
    "mention_thresholds": {
      "excellent": 16,
      "bien": 14,
      "assez_bien": 12,
      "passable": 10
    },
    "mention_labels": {
      "excellent": "Excellent",
      "bien": "Bien",
      "assez_bien": "Assez bien",
      "passable": "Passable",
      "insuffisant": "Insuffisant"
    },
    "legal_footer": ""
  }'::jsonb;

COMMENT ON COLUMN schools.bulletin_config IS
  'Config bulletin JSONB : toggles show_*, seuils mention, libellés, footer légal. Les libellés types d''élèves viennent de student_types.label (pas ici).';
