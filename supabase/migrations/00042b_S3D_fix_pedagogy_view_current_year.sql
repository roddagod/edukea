-- =========================================================================
-- Migration 00042b — Fix v_pedagogy_setup_status : filtrer sur année courante
--
-- La vue précédente joignait toutes les school_years, produisant N rows par
-- école. Correction : LATERAL JOIN sur l'année la plus récente (même pattern
-- que get_user_school_context : ORDER BY date_start DESC LIMIT 1).
-- =========================================================================

CREATE OR REPLACE VIEW v_pedagogy_setup_status AS
SELECT
  s.id AS school_id,
  sy.id AS school_year_id,
  sy.name AS school_year_name,
  sy.periode_type,
  (sy.date_start IS NOT NULL AND sy.date_end IS NOT NULL) AS step_year_done,
  (s.default_max_score IS NOT NULL) AS step_grading_done,
  (s.logo_url IS NOT NULL OR s.director_signature_url IS NOT NULL) AS step_bulletin_customized,
  (SELECT COUNT(*) FROM student_types st WHERE st.school_id = s.id) AS student_types_count,
  (SELECT COUNT(*) FROM levels l JOIN cycles c ON c.id = l.cycle_id WHERE c.school_id = s.id) AS levels_count,
  (SELECT COUNT(*) FROM classrooms cr JOIN levels l ON l.id = cr.level_id JOIN cycles c ON c.id = l.cycle_id WHERE c.school_id = s.id) AS classrooms_count,
  (SELECT COUNT(*) FROM periodes p WHERE p.school_id = s.id AND p.school_year_id = sy.id) AS periodes_count,
  (SELECT COUNT(*) FROM subjects sub WHERE sub.school_id = s.id) AS subjects_count,
  (SELECT COUNT(*) FROM level_fee_lines lfl JOIN levels l ON l.id = lfl.level_id JOIN cycles c ON c.id = l.cycle_id WHERE c.school_id = s.id) AS fee_lines_count,
  (SELECT COUNT(*) FROM teacher_profiles tp WHERE tp.school_id = s.id) AS teachers_count,
  (SELECT COUNT(*) FROM classroom_subjects cs JOIN classrooms cr ON cr.id = cs.classroom_id JOIN levels l ON l.id = cr.level_id JOIN cycles c ON c.id = l.cycle_id WHERE c.school_id = s.id AND cs.teacher_id IS NOT NULL) AS classroom_subjects_with_teacher_count,
  (SELECT COUNT(*) FROM classrooms cr JOIN levels l ON l.id = cr.level_id JOIN cycles c ON c.id = l.cycle_id WHERE c.school_id = s.id AND cr.principal_teacher_id IS NOT NULL) AS classrooms_with_principal_count
FROM schools s
LEFT JOIN LATERAL (
  SELECT sy2.*
  FROM school_years sy2
  WHERE sy2.school_id = s.id AND sy2.deleted_at IS NULL
  ORDER BY sy2.date_start DESC NULLS LAST
  LIMIT 1
) sy ON TRUE;

COMMENT ON VIEW v_pedagogy_setup_status IS
  'Statut agrégé des 8 étapes de la rentrée pédagogique par école. Une ligne par école : LATERAL sur l''année la plus récente (même pattern que get_user_school_context).';
