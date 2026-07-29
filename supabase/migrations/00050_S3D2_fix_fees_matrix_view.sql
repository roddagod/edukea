-- =========================================================================
-- Migration 00050 — Fix v_fees_overview_matrix cartesian join (S3D.2)
--
-- Bug : LEFT JOIN level_fee_installments dupliquait les rows level_fee_lines
-- avant GROUP BY → SUM(amount) sur-comptait (3 lignes × 4 échéances = 12 rows
-- → total × 4). Fix : sous-requêtes indépendantes pour lines et installments.
-- =========================================================================

CREATE OR REPLACE VIEW v_fees_overview_matrix AS
SELECT
  l.id AS level_id,
  l.name AS level_name,
  l."order_by" AS level_order,
  c.school_id,
  st.id AS student_type_id,
  st.code AS student_type_code,
  st.label AS student_type_label,
  st."order" AS student_type_order,
  COALESCE((SELECT SUM(amount) FROM level_fee_lines WHERE level_id = l.id AND student_type_id = st.id AND is_optional = false), 0) AS total_mandatory,
  COALESCE((SELECT SUM(amount) FROM level_fee_lines WHERE level_id = l.id AND student_type_id = st.id), 0) AS total_with_options,
  (SELECT COUNT(*) FROM level_fee_lines WHERE level_id = l.id AND student_type_id = st.id) AS lines_count,
  (SELECT COUNT(*) FROM level_fee_installments WHERE level_id = l.id AND student_type_id = st.id) AS installments_count
FROM levels l
JOIN cycles c ON c.id = l.cycle_id
CROSS JOIN student_types st
WHERE c.school_id = st.school_id;

COMMENT ON VIEW v_fees_overview_matrix IS
  'Overview matrice niveau × type d''élève. Une ligne par combinaison. Utilise des sous-requêtes pour éviter le sur-comptage par produit cartésien JOIN.';
