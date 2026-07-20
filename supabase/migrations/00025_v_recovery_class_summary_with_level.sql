-- ============================================================
-- v_recovery_class_summary : ajout de level_id + cycle_id
-- pour permettre le filtrage direct côté client (drill-down par niveau).
-- ============================================================

DROP VIEW IF EXISTS v_recovery_class_summary;
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
