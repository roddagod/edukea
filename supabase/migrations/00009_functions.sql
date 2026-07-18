-- Database functions for computed data

-- Function to compute bulletin for a classroom + period
CREATE OR REPLACE FUNCTION compute_bulletin(
  p_classroom_id TEXT,
  p_periode_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student RECORD;
  v_subject RECORD;
  v_bulletin_id UUID;
  v_student_avg NUMERIC;
  v_subject_avg NUMERIC;
  v_class_subject_avg NUMERIC;
  v_min_subject_avg NUMERIC;
  v_max_subject_avg NUMERIC;
  v_total_coeff NUMERIC;
  v_weighted_sum NUMERIC;
  v_total_students INTEGER;
BEGIN
  -- Count students in classroom
  SELECT COUNT(*) INTO v_total_students
  FROM student_school_year_loggings
  WHERE classroom_id = p_classroom_id;

  -- For each student in the classroom
  FOR v_student IN
    SELECT student_id FROM student_school_year_loggings
    WHERE classroom_id = p_classroom_id
  LOOP
    v_total_coeff := 0;
    v_weighted_sum := 0;

    -- Create or update bulletin
    INSERT INTO bulletins (student_id, periode_id, classroom_id, total_students, is_published)
    VALUES (v_student.student_id, p_periode_id, p_classroom_id, v_total_students, false)
    ON CONFLICT (student_id, periode_id)
    DO UPDATE SET total_students = v_total_students, updated_at = now()
    RETURNING id INTO v_bulletin_id;

    -- Delete existing bulletin_subjects for recalculation
    DELETE FROM bulletin_subjects WHERE bulletin_id = v_bulletin_id;

    -- For each subject in the classroom
    FOR v_subject IN
      SELECT cs.id as cs_id, cs.subject_id,
             COALESCE(cs.coefficient_override, s.coefficient) as coefficient
      FROM classroom_subjects cs
      JOIN subjects s ON s.id = cs.subject_id
      WHERE cs.classroom_id = p_classroom_id
    LOOP
      -- Calculate student's average for this subject
      SELECT
        CASE WHEN COUNT(*) > 0 THEN
          SUM(n.score * e.weight) / NULLIF(SUM(e.weight), 0)
        ELSE NULL END
      INTO v_subject_avg
      FROM notes n
      JOIN evaluations e ON e.id = n.evaluation_id
      WHERE e.classroom_subject_id = v_subject.cs_id
        AND e.periode_id = p_periode_id
        AND n.student_id = v_student.student_id
        AND n.is_absent = false
        AND n.score IS NOT NULL;

      IF v_subject_avg IS NOT NULL THEN
        v_weighted_sum := v_weighted_sum + (v_subject_avg * v_subject.coefficient);
        v_total_coeff := v_total_coeff + v_subject.coefficient;
      END IF;

      -- Insert bulletin subject
      INSERT INTO bulletin_subjects (bulletin_id, subject_id, average)
      VALUES (v_bulletin_id, v_subject.subject_id, ROUND(v_subject_avg, 2));
    END LOOP;

    -- Calculate overall average
    IF v_total_coeff > 0 THEN
      v_student_avg := ROUND(v_weighted_sum / v_total_coeff, 2);
    ELSE
      v_student_avg := NULL;
    END IF;

    UPDATE bulletins SET average = v_student_avg WHERE id = v_bulletin_id;
  END LOOP;

  -- Compute ranks for overall average
  WITH ranked AS (
    SELECT id, RANK() OVER (ORDER BY average DESC NULLS LAST) as rank
    FROM bulletins
    WHERE classroom_id = p_classroom_id AND periode_id = p_periode_id
  )
  UPDATE bulletins b SET rank = r.rank
  FROM ranked r WHERE b.id = r.id;

  -- Compute subject stats (rank, min, max, class average)
  FOR v_subject IN
    SELECT DISTINCT cs.subject_id
    FROM classroom_subjects cs
    WHERE cs.classroom_id = p_classroom_id
  LOOP
    -- Class average for subject
    SELECT AVG(bs.average), MIN(bs.average), MAX(bs.average)
    INTO v_class_subject_avg, v_min_subject_avg, v_max_subject_avg
    FROM bulletin_subjects bs
    JOIN bulletins b ON b.id = bs.bulletin_id
    WHERE b.classroom_id = p_classroom_id
      AND b.periode_id = p_periode_id
      AND bs.subject_id = v_subject.subject_id
      AND bs.average IS NOT NULL;

    -- Update subject stats and ranks
    WITH ranked_subjects AS (
      SELECT bs.id, RANK() OVER (ORDER BY bs.average DESC NULLS LAST) as rank
      FROM bulletin_subjects bs
      JOIN bulletins b ON b.id = bs.bulletin_id
      WHERE b.classroom_id = p_classroom_id
        AND b.periode_id = p_periode_id
        AND bs.subject_id = v_subject.subject_id
    )
    UPDATE bulletin_subjects bs SET
      rank = rs.rank,
      min_average = ROUND(v_min_subject_avg, 2),
      max_average = ROUND(v_max_subject_avg, 2),
      class_average = ROUND(v_class_subject_avg, 2)
    FROM ranked_subjects rs WHERE bs.id = rs.id;
  END LOOP;
END;
$$;
