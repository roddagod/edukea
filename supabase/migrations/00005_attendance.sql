-- Attendance tracking

CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL REFERENCES students(id),
  classroom_id TEXT NOT NULL REFERENCES classrooms(id),
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('absence', 'retard')),
  is_justified BOOLEAN NOT NULL DEFAULT false,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_classroom ON attendance_records(classroom_id);
