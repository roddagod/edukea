-- Row Level Security policies
-- Security relies on helper functions that identify the parent's children and school

-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_school_year_loggings ENABLE ROW LEVEL SECURITY;
ALTER TABLE type_paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE type_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE type_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_school_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_school_fees_by_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_paiement_by_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulletins ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulletin_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper functions

-- Get the parent's school_id
CREATE OR REPLACE FUNCTION get_parent_school_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT school_id FROM parent_profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Get all family IDs linked to the parent
CREATE OR REPLACE FUNCTION get_parent_family_ids()
RETURNS SETOF TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT DISTINCT val FROM (
    SELECT father_id AS val FROM parent_profiles WHERE user_id = auth.uid() AND father_id IS NOT NULL
    UNION
    SELECT mother_id AS val FROM parent_profiles WHERE user_id = auth.uid() AND mother_id IS NOT NULL
    UNION
    SELECT tutor_id AS val FROM parent_profiles WHERE user_id = auth.uid() AND tutor_id IS NOT NULL
  ) sub
$$;

-- Get all student IDs the parent can access
CREATE OR REPLACE FUNCTION get_parent_student_ids()
RETURNS SETOF TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT DISTINCT s.id FROM students s
  JOIN parent_profiles pp ON pp.user_id = auth.uid()
  WHERE
    (pp.student_id IS NOT NULL AND s.id = pp.student_id) OR
    (pp.father_id IS NOT NULL AND s.father_id = pp.father_id) OR
    (pp.mother_id IS NOT NULL AND s.mother_id = pp.mother_id) OR
    (pp.tutor_id IS NOT NULL AND s.tutor_id = pp.tutor_id)
$$;

-- ========== Parent profile policies ==========

CREATE POLICY "Parents can view own profile"
  ON parent_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Parents can update own profile"
  ON parent_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- ========== Synced tables (read-only for parents) ==========

-- Schools: parent's school only
CREATE POLICY "Parents can view their school"
  ON schools FOR SELECT
  USING (id = get_parent_school_id());

-- School years: parent's school
CREATE POLICY "Parents can view school years"
  ON school_years FOR SELECT
  USING (school_id = get_parent_school_id());

-- Cycles: parent's school
CREATE POLICY "Parents can view cycles"
  ON cycles FOR SELECT
  USING (school_id = get_parent_school_id());

-- Levels: parent's school
CREATE POLICY "Parents can view levels"
  ON levels FOR SELECT
  USING (school_id = get_parent_school_id());

-- Classroom types: all (reference table)
CREATE POLICY "Anyone can view classroom types"
  ON classroom_types FOR SELECT
  USING (true);

-- Classrooms: children's classrooms
CREATE POLICY "Parents can view classrooms"
  ON classrooms FOR SELECT
  USING (id IN (
    SELECT classroom_id FROM student_school_year_loggings
    WHERE student_id IN (SELECT get_parent_student_ids())
  ));

-- Families: own family members only
CREATE POLICY "Parents can view own families"
  ON families FOR SELECT
  USING (id IN (SELECT get_parent_family_ids()));

-- Students: own children only
CREATE POLICY "Parents can view own children"
  ON students FOR SELECT
  USING (id IN (SELECT get_parent_student_ids()));

-- Student loggings: own children
CREATE POLICY "Parents can view children loggings"
  ON student_school_year_loggings FOR SELECT
  USING (student_id IN (SELECT get_parent_student_ids()));

-- Payment types: reference table (no school_id)
CREATE POLICY "Anyone can view payment types"
  ON type_paiements FOR SELECT
  USING (true);

-- Student types: parent's school
CREATE POLICY "Parents can view student types"
  ON type_students FOR SELECT
  USING (school_id = get_parent_school_id());

-- Family types: reference table (no school_id)
CREATE POLICY "Anyone can view family types"
  ON type_families FOR SELECT
  USING (true);

-- Fees structure: children's classrooms
CREATE POLICY "Parents can view fees"
  ON classroom_school_fees FOR SELECT
  USING (classroom_id IN (
    SELECT classroom_id FROM student_school_year_loggings
    WHERE student_id IN (SELECT get_parent_student_ids())
  ));

CREATE POLICY "Parents can view fee parts"
  ON classroom_school_fees_by_parts FOR SELECT
  USING (school_fees_id IN (
    SELECT id FROM classroom_school_fees WHERE classroom_id IN (
      SELECT classroom_id FROM student_school_year_loggings
      WHERE student_id IN (SELECT get_parent_student_ids())
    )
  ));

-- Payments: own children (via student_school_year_logging)
CREATE POLICY "Parents can view payments"
  ON paiements FOR SELECT
  USING (student_school_year_logging_id IN (
    SELECT id FROM student_school_year_loggings
    WHERE student_id IN (SELECT get_parent_student_ids())
  ));

CREATE POLICY "Parents can view payment parts"
  ON student_paiement_by_parts FOR SELECT
  USING (student_school_year_logging_id IN (
    SELECT id FROM student_school_year_loggings
    WHERE student_id IN (SELECT get_parent_student_ids())
  ));

-- ========== Grades system ==========

-- Periodes: published only, parent's school
CREATE POLICY "Parents can view published periodes"
  ON periodes FOR SELECT
  USING (school_id = get_parent_school_id() AND is_published = true);

-- Subject groups
CREATE POLICY "Parents can view subject groups"
  ON subject_groups FOR SELECT
  USING (school_id = get_parent_school_id());

-- Subjects
CREATE POLICY "Parents can view subjects"
  ON subjects FOR SELECT
  USING (school_id = get_parent_school_id());

-- Teacher profiles (for messaging context)
CREATE POLICY "Parents can view teacher profiles"
  ON teacher_profiles FOR SELECT
  USING (school_id = get_parent_school_id());

-- Classroom subjects
CREATE POLICY "Parents can view classroom subjects"
  ON classroom_subjects FOR SELECT
  USING (classroom_id IN (
    SELECT classroom_id FROM student_school_year_loggings
    WHERE student_id IN (SELECT get_parent_student_ids())
  ));

-- Evaluations: published only
CREATE POLICY "Parents can view published evaluations"
  ON evaluations FOR SELECT
  USING (
    is_published = true AND
    classroom_subject_id IN (
      SELECT id FROM classroom_subjects WHERE classroom_id IN (
        SELECT classroom_id FROM student_school_year_loggings
        WHERE student_id IN (SELECT get_parent_student_ids())
      )
    )
  );

-- Notes: own children, published evaluations
CREATE POLICY "Parents can view children notes"
  ON notes FOR SELECT
  USING (
    student_id IN (SELECT get_parent_student_ids()) AND
    evaluation_id IN (SELECT id FROM evaluations WHERE is_published = true)
  );

-- Bulletins: published, own children
CREATE POLICY "Parents can view published bulletins"
  ON bulletins FOR SELECT
  USING (
    student_id IN (SELECT get_parent_student_ids()) AND
    is_published = true
  );

-- Bulletin subjects: via bulletin
CREATE POLICY "Parents can view bulletin subjects"
  ON bulletin_subjects FOR SELECT
  USING (bulletin_id IN (
    SELECT id FROM bulletins
    WHERE student_id IN (SELECT get_parent_student_ids())
    AND is_published = true
  ));

-- ========== Messaging ==========

CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (id IN (
    SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view conversation participants"
  ON conversation_participants FOR SELECT
  USING (conversation_id IN (
    SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own participant record"
  ON conversation_participants FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (conversation_id IN (
    SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    )
  );

-- ========== Timetable, Attendance, News ==========

CREATE POLICY "Parents can view timetable"
  ON timetable_slots FOR SELECT
  USING (classroom_id IN (
    SELECT classroom_id FROM student_school_year_loggings
    WHERE student_id IN (SELECT get_parent_student_ids())
  ));

CREATE POLICY "Parents can view children attendance"
  ON attendance_records FOR SELECT
  USING (student_id IN (SELECT get_parent_student_ids()));

CREATE POLICY "Parents can view relevant announcements"
  ON announcements FOR SELECT
  USING (
    school_id = get_parent_school_id() AND
    published_at IS NOT NULL AND (
      target_type = 'school' OR
      (target_type = 'classroom' AND target_id IN (
        SELECT classroom_id FROM student_school_year_loggings
        WHERE student_id IN (SELECT get_parent_student_ids())
      )) OR
      (target_type = 'level' AND target_id IN (
        SELECT DISTINCT c.level_id FROM classrooms c
        JOIN student_school_year_loggings ssyl ON ssyl.classroom_id = c.id
        WHERE ssyl.student_id IN (SELECT get_parent_student_ids())
      ))
    )
  );

-- ========== Notifications ==========

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ========== Teacher policies ==========

CREATE POLICY "Teachers can view own profile"
  ON teacher_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Teachers can view their evaluations"
  ON evaluations FOR SELECT
  USING (
    classroom_subject_id IN (
      SELECT id FROM classroom_subjects WHERE teacher_id IN (
        SELECT id FROM teacher_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Teachers can manage evaluations"
  ON evaluations FOR INSERT
  WITH CHECK (
    classroom_subject_id IN (
      SELECT id FROM classroom_subjects WHERE teacher_id IN (
        SELECT id FROM teacher_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Teachers can update evaluations"
  ON evaluations FOR UPDATE
  USING (
    classroom_subject_id IN (
      SELECT id FROM classroom_subjects WHERE teacher_id IN (
        SELECT id FROM teacher_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Teachers can manage notes"
  ON notes FOR INSERT
  WITH CHECK (
    evaluation_id IN (
      SELECT e.id FROM evaluations e
      JOIN classroom_subjects cs ON cs.id = e.classroom_subject_id
      JOIN teacher_profiles tp ON tp.id = cs.teacher_id
      WHERE tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update notes"
  ON notes FOR UPDATE
  USING (
    evaluation_id IN (
      SELECT e.id FROM evaluations e
      JOIN classroom_subjects cs ON cs.id = e.classroom_subject_id
      JOIN teacher_profiles tp ON tp.id = cs.teacher_id
      WHERE tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view notes"
  ON notes FOR SELECT
  USING (
    evaluation_id IN (
      SELECT e.id FROM evaluations e
      JOIN classroom_subjects cs ON cs.id = e.classroom_subject_id
      JOIN teacher_profiles tp ON tp.id = cs.teacher_id
      WHERE tp.user_id = auth.uid()
    )
  );
