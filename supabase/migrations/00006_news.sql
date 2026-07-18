-- Announcements / news system

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL REFERENCES schools(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('school', 'level', 'classroom')),
  target_id TEXT,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_school ON announcements(school_id);
CREATE INDEX IF NOT EXISTS idx_announcements_target ON announcements(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(published_at);
