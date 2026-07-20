-- ============================================================
-- Audit trail pour les décisions de passage d'année scolaire.
-- Une ligne par (élève, année source, année cible) — trace la décision
-- (passage / redoublement / départ / attente) et l'auteur.
-- ============================================================

CREATE TABLE IF NOT EXISTS enrollment_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL REFERENCES students(id),
  from_ssyl_id TEXT REFERENCES student_school_year_loggings(id),
  to_ssyl_id TEXT REFERENCES student_school_year_loggings(id),
  decision TEXT NOT NULL CHECK (decision IN ('advance', 'repeat', 'leave', 'pending')),
  from_classroom_id TEXT REFERENCES classrooms(id),
  to_classroom_id TEXT REFERENCES classrooms(id),
  from_year_id TEXT REFERENCES school_years(id),
  to_year_id TEXT REFERENCES school_years(id),
  decided_by UUID REFERENCES auth.users(id),
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_enrollment_transitions_student ON enrollment_transitions(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_transitions_years ON enrollment_transitions(from_year_id, to_year_id);

ALTER TABLE enrollment_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all enrollment_transitions"
  ON enrollment_transitions FOR SELECT USING (is_admin());

CREATE POLICY "School staff view own school enrollment_transitions"
  ON enrollment_transitions FOR SELECT USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = enrollment_transitions.student_id AND s.school_id = get_school_staff_school_id())
  );

-- Écriture réservée aux RPC SECURITY DEFINER
REVOKE INSERT, UPDATE, DELETE ON enrollment_transitions FROM authenticated, anon;
