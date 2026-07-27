-- =========================================================================
-- Migration 00042 — Vues SQL (S3D fondations)
-- =========================================================================

-- 1. Statut de la rentrée pédagogique par école (source du hub checklist)
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
LEFT JOIN school_years sy ON sy.school_id = s.id;

COMMENT ON VIEW v_pedagogy_setup_status IS
  'Statut agrégé des 8 étapes de la rentrée pédagogique par école. Consommé par usePedagogySetupStatus() pour le hub /pedagogy.';

-- 2. Moyennes provisoires
CREATE OR REPLACE VIEW v_provisional_averages AS
SELECT
  ssyl.student_id,
  ssyl.classroom_id,
  e.periode_id,
  cs.subject_id,
  COALESCE(cs.coefficient_override, sub.coefficient) AS coefficient,
  SUM(n.score * e.weight) / NULLIF(SUM(e.weight), 0) AS provisional_subject_avg,
  COUNT(*) AS notes_count,
  MAX(e.date) AS latest_note_date
FROM student_school_year_loggings ssyl
JOIN classroom_subjects cs ON cs.classroom_id = ssyl.classroom_id
JOIN evaluations e ON e.classroom_subject_id = cs.id AND e.is_published = true
JOIN notes n ON n.evaluation_id = e.id AND n.student_id = ssyl.student_id
JOIN subjects sub ON sub.id = cs.subject_id
WHERE n.is_absent = false AND n.is_exempted = false AND n.score IS NOT NULL
GROUP BY ssyl.student_id, ssyl.classroom_id, e.periode_id,
         cs.subject_id, cs.coefficient_override, sub.coefficient;

-- 3. Progrès de saisie
CREATE OR REPLACE VIEW v_note_entry_progress AS
SELECT
  cs.classroom_id,
  cs.subject_id,
  e.periode_id,
  COUNT(DISTINCT e.id) AS total_evaluations,
  COUNT(DISTINCT e.id) FILTER (WHERE e.is_published) AS published_evaluations,
  COUNT(DISTINCT n.student_id) AS students_with_notes,
  (SELECT COUNT(*) FROM student_school_year_loggings ssyl
    WHERE ssyl.classroom_id = cs.classroom_id) AS total_students
FROM classroom_subjects cs
LEFT JOIN evaluations e ON e.classroom_subject_id = cs.id
LEFT JOIN notes n ON n.evaluation_id = e.id
GROUP BY cs.classroom_id, cs.subject_id, e.periode_id;

-- 4. Statistiques classe
CREATE OR REPLACE VIEW v_class_statistics AS
SELECT
  bs.subject_id,
  b.classroom_id,
  b.periode_id,
  AVG(bs.average) AS class_average,
  MIN(bs.average) AS min_average,
  MAX(bs.average) AS max_average,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY bs.average) AS median,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY bs.average) AS q1,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY bs.average) AS q3,
  COUNT(*) AS student_count
FROM bulletin_subjects bs
JOIN bulletins b ON b.id = bs.bulletin_id
WHERE bs.average IS NOT NULL
GROUP BY bs.subject_id, b.classroom_id, b.periode_id;

-- 5. Historique bulletins
CREATE OR REPLACE VIEW v_bulletin_history AS
SELECT
  b.student_id,
  b.classroom_id,
  p.school_year_id,
  p.id AS periode_id,
  p.name AS periode_name,
  p."order" AS periode_order,
  b.average AS general_average,
  b.rank,
  b.total_students,
  b.status,
  b.current_version,
  bs.subject_id,
  bs.average AS subject_average,
  bs.rank AS subject_rank
FROM bulletins b
JOIN periodes p ON p.id = b.periode_id
LEFT JOIN bulletin_subjects bs ON bs.bulletin_id = b.id
WHERE b.status = 'published';

-- 6. Overview clôture période
CREATE OR REPLACE VIEW v_period_closure_overview AS
SELECT
  p.school_id,
  p.id AS periode_id,
  p.name AS periode_name,
  cr.id AS classroom_id,
  cr.name AS classroom_name,
  l.name AS level_name,
  COALESCE(cps.notes_locked, false) AS notes_locked,
  cps.actual_end_date,
  COUNT(b.id) FILTER (WHERE b.status = 'draft') AS bulletins_draft,
  COUNT(b.id) FILTER (WHERE b.status = 'ready_censeur') AS bulletins_ready_censeur,
  COUNT(b.id) FILTER (WHERE b.status = 'ready_director') AS bulletins_ready_director,
  COUNT(b.id) FILTER (WHERE b.status = 'published') AS bulletins_published,
  (SELECT COUNT(*) FROM student_school_year_loggings ssyl WHERE ssyl.classroom_id = cr.id) AS total_students
FROM periodes p
CROSS JOIN classrooms cr
JOIN levels l ON l.id = cr.level_id
JOIN cycles c ON c.id = l.cycle_id
LEFT JOIN classroom_periode_status cps ON cps.classroom_id = cr.id AND cps.periode_id = p.id
LEFT JOIN bulletins b ON b.classroom_id = cr.id AND b.periode_id = p.id
WHERE c.school_id = p.school_id
GROUP BY p.school_id, p.id, p.name, cr.id, cr.name, l.name, cps.notes_locked, cps.actual_end_date;

-- 7. Frais effectifs par (classe × type)
CREATE OR REPLACE VIEW v_classroom_effective_fees AS
  SELECT
    cfl.classroom_id,
    cfl.student_type_id,
    cfl.category,
    cfl.label,
    cfl.amount,
    cfl."order",
    'classroom_override'::text AS source
  FROM classroom_fee_lines cfl
  UNION ALL
  SELECT
    cr.id AS classroom_id,
    lfl.student_type_id,
    lfl.category,
    lfl.label,
    lfl.amount,
    lfl."order",
    'level'::text AS source
  FROM classrooms cr
  JOIN level_fee_lines lfl ON lfl.level_id = cr.level_id
  WHERE NOT EXISTS (
    SELECT 1 FROM classroom_fee_lines cfl2
    WHERE cfl2.classroom_id = cr.id
      AND cfl2.student_type_id = lfl.student_type_id
      AND cfl2.overrides_level_line_id = lfl.id
  );

-- 8. Échéances effectives par (classe × type)
CREATE OR REPLACE VIEW v_classroom_effective_installments AS
  SELECT
    cfi.classroom_id,
    cfi.student_type_id,
    cfi."order",
    cfi.label,
    cfi.category,
    cfi.due_date,
    cfi.amount,
    'classroom_override'::text AS source
  FROM classroom_fee_installments cfi
  UNION ALL
  SELECT
    cr.id AS classroom_id,
    lfi.student_type_id,
    lfi."order",
    lfi.label,
    lfi.category,
    (sy.date_start + (lfi.due_date_offset_days || ' days')::interval)::date AS due_date,
    COALESCE(
      lfi.amount,
      (SELECT SUM(lfl2.amount) * lfi.amount_percentage / 100.0
       FROM level_fee_lines lfl2
       WHERE lfl2.level_id = lfi.level_id
         AND lfl2.student_type_id = lfi.student_type_id
         AND lfl2.category = lfi.category)
    ) AS amount,
    'level'::text AS source
  FROM classrooms cr
  JOIN level_fee_installments lfi ON lfi.level_id = cr.level_id
  CROSS JOIN LATERAL (
    SELECT sy2.date_start FROM school_years sy2
    JOIN cycles c ON c.school_id = sy2.school_id
    JOIN levels l ON l.cycle_id = c.id AND l.id = cr.level_id
    LIMIT 1
  ) sy
  WHERE NOT EXISTS (
    SELECT 1 FROM classroom_fee_installments cfi2
    WHERE cfi2.classroom_id = cr.id
      AND cfi2.student_type_id = lfi.student_type_id
      AND cfi2.overrides_level_installment_id = lfi.id
  );

-- 9. Statut par tranche pour un élève
CREATE OR REPLACE VIEW v_ssyl_installment_status AS
SELECT
  ssyl.id AS ssyl_id,
  cfi.id AS installment_id,
  cfi.label,
  cfi.category,
  cfi.due_date,
  cfi.amount AS amount_due,
  COALESCE(SUM(pa.allocated_amount), 0) AS amount_paid,
  CASE
    WHEN COALESCE(SUM(pa.allocated_amount), 0) >= cfi.amount THEN 'paid'
    WHEN COALESCE(SUM(pa.allocated_amount), 0) > 0 THEN 'partial'
    WHEN cfi.due_date < CURRENT_DATE THEN 'overdue'
    WHEN cfi.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due'
    ELSE 'future'
  END AS status
FROM student_school_year_loggings ssyl
JOIN students st ON st.id = ssyl.student_id
JOIN classroom_fee_installments cfi
  ON cfi.classroom_id = ssyl.classroom_id
 AND cfi.student_type_id = st.student_type_id
LEFT JOIN payment_allocations pa ON pa.fee_installment_id = cfi.id
GROUP BY ssyl.id, cfi.id, cfi.label, cfi.category, cfi.due_date, cfi.amount;

COMMENT ON VIEW v_ssyl_installment_status IS
  'Statut de chaque échéance d''un élève : paid / partial / due / overdue / future. Utilisée par wizard inscription, reçu paiement, parent app, recouvrement.';
