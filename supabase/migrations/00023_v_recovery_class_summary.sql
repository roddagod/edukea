-- ============================================================
-- v_recovery_class_summary : agrégat par classe pour le hub recouvrement.
-- Une ligne par (école, année, classe) avec effectifs et statuts.
-- ============================================================

CREATE OR REPLACE VIEW v_recovery_class_summary AS
SELECT
  vs.school_id,
  vs.school_year_id,
  vs.classroom_id,
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
WHERE vs.classroom_id IS NOT NULL
GROUP BY vs.school_id, vs.school_year_id, vs.classroom_id;

GRANT SELECT ON v_recovery_class_summary TO authenticated;
