-- ============================================================
-- Vues pour le hub Inscription + l'écran Passage d'année.
-- ============================================================

-- KPI hub inscription
CREATE OR REPLACE VIEW v_enrollment_stats AS
SELECT
  ssyl.school_id,
  ssyl.school_year_id,
  COUNT(*)::INT                                        AS total_enrolled,
  COUNT(*) FILTER (WHERE ssyl.is_first_register = 1)::INT AS new_enrollments,
  COUNT(*) FILTER (WHERE ssyl.is_first_register = 0)::INT AS reenrollments,
  (
    SELECT COUNT(*)::INT
    FROM student_school_year_loggings prev
    WHERE prev.school_id = ssyl.school_id
      AND prev.school_year_id <> ssyl.school_year_id
      AND prev.deleted_at IS NULL
      AND prev.student_id NOT IN (
        SELECT student_id FROM student_school_year_loggings cur
        WHERE cur.school_id = ssyl.school_id AND cur.school_year_id = ssyl.school_year_id AND cur.deleted_at IS NULL
      )
  ) AS not_reenrolled_previous
FROM student_school_year_loggings ssyl
WHERE ssyl.deleted_at IS NULL
GROUP BY ssyl.school_id, ssyl.school_year_id;

GRANT SELECT ON v_enrollment_stats TO authenticated;

-- Pré-remplissage du passage année N -> N+1
-- Chaque ligne = élève de N, suggestion N+1 (niveau+1 par order_by, même section si possible)
CREATE OR REPLACE VIEW v_year_advancement_preview AS
SELECT
  ssyl.id                    AS from_ssyl_id,
  ssyl.school_id,
  ssyl.student_id,
  st.matricule,
  TRIM(BOTH ' ' FROM (COALESCE(st.lastname,'') || ' ' || COALESCE(st.firstname,''))) AS student_name,
  ssyl.school_year_id        AS from_year_id,
  ssyl.classroom_id          AS from_classroom_id,
  cl_from.name               AS from_classroom_name,
  cl_from.level_id           AS from_level_id,
  lv_from.name               AS from_level_name,
  lv_from.order_by           AS from_level_order,
  -- Suggestion niveau+1 : level order_by + 1 dans le même cycle
  (
    SELECT lv.id FROM levels lv
    WHERE lv.cycle_id = lv_from.cycle_id AND lv.order_by = lv_from.order_by + 1
    LIMIT 1
  )                          AS suggested_level_id,
  NULL::FLOAT                AS avg_yearly_grade   -- Réservé pour futur module Notes/Bulletins
FROM student_school_year_loggings ssyl
JOIN students   st ON st.id = ssyl.student_id
JOIN classrooms cl_from ON cl_from.id = ssyl.classroom_id
LEFT JOIN levels lv_from ON lv_from.id = cl_from.level_id
WHERE ssyl.deleted_at IS NULL;

GRANT SELECT ON v_year_advancement_preview TO authenticated;
