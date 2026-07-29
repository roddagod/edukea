-- =========================================================================
-- Migration 00046 — Vue overview matrice frais (S3D.2)
--
-- Une ligne par (niveau, type d'élève) avec totaux et compteurs.
-- Consommée par l'écran /pedagogy/fees pour afficher la matrice.
-- =========================================================================

CREATE OR REPLACE VIEW v_fees_overview_matrix AS
SELECT
  l.id AS level_id,
  l.name AS level_name,
  l.order_by AS level_order,
  c.school_id,
  st.id AS student_type_id,
  st.code AS student_type_code,
  st.label AS student_type_label,
  st."order" AS student_type_order,
  COALESCE(SUM(lfl.amount) FILTER (WHERE lfl.is_optional = false), 0) AS total_mandatory,
  COALESCE(SUM(lfl.amount), 0) AS total_with_options,
  COUNT(DISTINCT lfl.id) AS lines_count,
  COUNT(DISTINCT lfi.id) AS installments_count
FROM levels l
JOIN cycles c ON c.id = l.cycle_id
CROSS JOIN student_types st
LEFT JOIN level_fee_lines lfl ON lfl.level_id = l.id AND lfl.student_type_id = st.id
LEFT JOIN level_fee_installments lfi ON lfi.level_id = l.id AND lfi.student_type_id = st.id
WHERE c.school_id = st.school_id
GROUP BY l.id, l.name, l.order_by, c.school_id, st.id, st.code, st.label, st."order";

COMMENT ON VIEW v_fees_overview_matrix IS
  'Overview matrice niveau × type d''élève. Une ligne par combinaison. lines_count = 0 → cellule vide dans le hub /pedagogy/fees.';
