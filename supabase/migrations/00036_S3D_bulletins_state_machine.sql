-- =========================================================================
-- Migration 00036 — State machine bulletins + audit trail (S3D fondations)
-- =========================================================================

-- Extension de bulletins avec la state machine + traçabilité
ALTER TABLE bulletins
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'ready_censeur', 'ready_director', 'published')),
  ADD COLUMN IF NOT EXISTS finalized_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS annual_average NUMERIC;

CREATE INDEX IF NOT EXISTS idx_bulletins_status ON bulletins(status);
CREATE INDEX IF NOT EXISTS idx_bulletins_classroom_status
  ON bulletins(classroom_id, status);

-- Historique des publications / re-publications
CREATE TABLE IF NOT EXISTS bulletin_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bulletin_id UUID NOT NULL REFERENCES bulletins(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason_for_edit TEXT,
  UNIQUE(bulletin_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_bulletin_versions_bulletin
  ON bulletin_versions(bulletin_id);

-- Audit modifications de notes (post-publi)
CREATE TABLE IF NOT EXISTS notes_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  old_score NUMERIC,
  new_score NUMERIC,
  old_is_absent BOOLEAN,
  new_is_absent BOOLEAN,
  old_is_exempted BOOLEAN,
  new_is_exempted BOOLEAN,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_notes_audit_note ON notes_audit(note_id);
CREATE INDEX IF NOT EXISTS idx_notes_audit_changed_at ON notes_audit(changed_at DESC);

-- Extensions notes
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS is_exempted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN bulletins.status IS
  'State machine : draft → ready_censeur → ready_director → published. Transition via advance_bulletin_status().';
