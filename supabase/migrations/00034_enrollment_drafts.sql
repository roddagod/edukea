-- ============================================================
-- Table: enrollment_drafts
-- Sauvegarde silencieuse du state du wizard d'inscription pour
-- permettre à un utilisateur (staff / admin) de reprendre plus tard.
-- ============================================================

CREATE TABLE IF NOT EXISTS enrollment_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id TEXT NOT NULL REFERENCES schools(id),
  school_year_id TEXT NOT NULL REFERENCES school_years(id),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enrollment_drafts_user ON enrollment_drafts(user_id, updated_at DESC);

ALTER TABLE enrollment_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own drafts" ON enrollment_drafts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users insert own drafts" ON enrollment_drafts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own drafts" ON enrollment_drafts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users delete own drafts" ON enrollment_drafts FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Admins see all drafts" ON enrollment_drafts FOR SELECT USING (is_admin());
