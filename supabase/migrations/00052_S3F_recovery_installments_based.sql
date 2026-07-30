-- =========================================================================
-- Migration 00052 — v_recovery_students basé sur v_ssyl_installment_status
--
-- Refactor : au lieu de calculer billed/collected via un modèle flat
-- (legacy S3A), on somme les échéances effectives (v_ssyl_installment_status).
-- Ajoute overdue_amount : montant des échéances due_date < today et impayées.
-- =========================================================================

DROP VIEW IF EXISTS v_recovery_students CASCADE;

CREATE VIEW v_recovery_students AS
SELECT
  ssyl.id AS ssyl_id,
  ssyl.school_id,
  ssyl.school_year_id,
  s.id AS student_id,
  COALESCE(NULLIF(TRIM(COALESCE(s.firstname, '') || ' ' || COALESCE(s.lastname, '')), ''), s.matricule, s.id) AS student_name,
  s.matricule,
  ssyl.classroom_id,
  cr.name AS classroom_name,
  l.name AS level_name,
  c.name AS cycle_name,
  COALESCE(billed.total, 0) AS billed_initial,
  COALESCE(paid.total, 0) AS collected,
  GREATEST(0, COALESCE(billed.total, 0) - COALESCE(paid.total, 0)) AS remaining,
  COALESCE(overdue.total, 0) AS overdue_amount,
  CASE
    WHEN COALESCE(billed.total, 0) = 0 THEN 'solde'
    WHEN COALESCE(paid.total, 0) >= COALESCE(billed.total, 0) THEN 'solde'
    WHEN COALESCE(paid.total, 0) > 0 THEN 'debute'
    ELSE 'impaye'
  END AS status
FROM student_school_year_loggings ssyl
JOIN students s ON s.id = ssyl.student_id
LEFT JOIN classrooms cr ON cr.id = ssyl.classroom_id
LEFT JOIN levels l ON l.id = cr.level_id
LEFT JOIN cycles c ON c.id = l.cycle_id
LEFT JOIN LATERAL (
  SELECT SUM(vsi.amount_due) AS total
  FROM v_ssyl_installment_status vsi
  WHERE vsi.ssyl_id = ssyl.id
) billed ON TRUE
LEFT JOIN LATERAL (
  SELECT SUM(vsi.amount_paid) AS total
  FROM v_ssyl_installment_status vsi
  WHERE vsi.ssyl_id = ssyl.id
) paid ON TRUE
LEFT JOIN LATERAL (
  SELECT SUM(vsi.amount_due - vsi.amount_paid) AS total
  FROM v_ssyl_installment_status vsi
  WHERE vsi.ssyl_id = ssyl.id AND vsi.status = 'overdue'
) overdue ON TRUE
WHERE ssyl.deleted_at IS NULL;

COMMENT ON VIEW v_recovery_students IS
  'Recouvrement basé sur v_ssyl_installment_status (S3D). Ajoute overdue_amount pour distinguer les impayés dus des futurs.';

GRANT SELECT ON v_recovery_students TO authenticated;

-- =========================================================================
-- Recreate dependent views dropped by CASCADE above (00023, 00024, 00025)
-- =========================================================================

-- v_recovery_class_summary (shape from 00025 — includes level_id + cycle_id)
CREATE VIEW v_recovery_class_summary AS
SELECT
  vs.school_id,
  vs.school_year_id,
  vs.classroom_id,
  cl.level_id,
  lv.cycle_id,
  MAX(vs.classroom_name) AS classroom_name,
  MAX(vs.level_name)     AS level_name,
  MAX(vs.cycle_name)     AS cycle_name,
  COUNT(*)::INT          AS n_students,
  COUNT(*) FILTER (WHERE vs.status = 'solde')::INT   AS solde_count,
  COUNT(*) FILTER (WHERE vs.status = 'debute')::INT  AS debute_count,
  COUNT(*) FILTER (WHERE vs.status = 'impaye')::INT  AS impaye_count,
  SUM(vs.billed_initial)::BIGINT AS billed_total,
  SUM(vs.collected)::BIGINT      AS collected_total,
  SUM(vs.remaining)::BIGINT      AS remaining_total
FROM v_recovery_students vs
JOIN classrooms cl ON cl.id = vs.classroom_id
LEFT JOIN levels lv ON lv.id = cl.level_id
WHERE vs.classroom_id IS NOT NULL
GROUP BY vs.school_id, vs.school_year_id, vs.classroom_id, cl.level_id, lv.cycle_id;

GRANT SELECT ON v_recovery_class_summary TO authenticated;

-- v_recovery_level_summary
CREATE VIEW v_recovery_level_summary AS
SELECT
  vs.school_id,
  vs.school_year_id,
  cl.level_id,
  MAX(vs.level_name)  AS level_name,
  MAX(vs.cycle_name)  AS cycle_name,
  MAX(lv.order_by)    AS level_order,
  COUNT(*)::INT       AS n_students,
  COUNT(DISTINCT vs.classroom_id)::INT           AS n_classrooms,
  COUNT(*) FILTER (WHERE vs.status = 'solde')::INT   AS solde_count,
  COUNT(*) FILTER (WHERE vs.status = 'debute')::INT  AS debute_count,
  COUNT(*) FILTER (WHERE vs.status = 'impaye')::INT  AS impaye_count,
  SUM(vs.billed_initial)::BIGINT AS billed_total,
  SUM(vs.collected)::BIGINT      AS collected_total,
  SUM(vs.remaining)::BIGINT      AS remaining_total
FROM v_recovery_students vs
JOIN classrooms cl ON cl.id = vs.classroom_id
LEFT JOIN levels lv ON lv.id = cl.level_id
WHERE cl.level_id IS NOT NULL
GROUP BY vs.school_id, vs.school_year_id, cl.level_id;

GRANT SELECT ON v_recovery_level_summary TO authenticated;

-- v_recovery_cycle_summary
CREATE VIEW v_recovery_cycle_summary AS
SELECT
  vs.school_id,
  vs.school_year_id,
  cy.id                AS cycle_id,
  MAX(vs.cycle_name)   AS cycle_name,
  MAX(cy.order_by)     AS cycle_order,
  COUNT(*)::INT        AS n_students,
  COUNT(DISTINCT vs.classroom_id)::INT           AS n_classrooms,
  COUNT(DISTINCT cl.level_id)::INT               AS n_levels,
  COUNT(*) FILTER (WHERE vs.status = 'solde')::INT   AS solde_count,
  COUNT(*) FILTER (WHERE vs.status = 'debute')::INT  AS debute_count,
  COUNT(*) FILTER (WHERE vs.status = 'impaye')::INT  AS impaye_count,
  SUM(vs.billed_initial)::BIGINT AS billed_total,
  SUM(vs.collected)::BIGINT      AS collected_total,
  SUM(vs.remaining)::BIGINT      AS remaining_total
FROM v_recovery_students vs
JOIN classrooms cl ON cl.id = vs.classroom_id
JOIN levels lv     ON lv.id = cl.level_id
LEFT JOIN cycles cy ON cy.id = lv.cycle_id
WHERE cy.id IS NOT NULL
GROUP BY vs.school_id, vs.school_year_id, cy.id;

GRANT SELECT ON v_recovery_cycle_summary TO authenticated;
