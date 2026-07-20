-- ============================================================
-- v_recovery_level_summary + v_recovery_cycle_summary
-- Agrégats hiérarchiques pour le drill-down du recouvrement.
-- ============================================================

CREATE OR REPLACE VIEW v_recovery_level_summary AS
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

CREATE OR REPLACE VIEW v_recovery_cycle_summary AS
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
