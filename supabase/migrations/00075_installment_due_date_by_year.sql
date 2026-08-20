-- =============================================================================
-- 00075 — due_date des installments toujours recalculee depuis l'annee cible
-- =============================================================================
-- Bug residuel apres 00072 : les cfi materialisees ont une due_date FIXE
-- (calculee pour l'annee de la 1ere materialisation). Un SSYL cible dans
-- une annee posterieure affichait ces dates figees au lieu de dates alignees
-- sur son annee scolaire.
--
-- Test : CP1 A cfi "Inscription" due_date=2026-09-01 (materialise pour
-- 2026-2027). Un SSYL de la meme classe en 2027-2028 devrait voir due_date
-- 2027-09-01 mais affichait 2026-09-01.
--
-- Fix : dans la RPC ET la vue, ignorer cfi.due_date stockee. Toujours
-- recalculer via year_start + due_month + due_year_offset. La colonne
-- cfi.due_date reste (compat historique + reads externes) mais devient
-- obsolete pour l'affichage. Les payment_allocations continuent de pointer
-- vers cfi.id (identifiant stable), donc pas d'impact sur la ventilation.
-- =============================================================================

-- Helper interne (usage RPC + vue) : recalcule une due_date a partir du year_start
CREATE OR REPLACE FUNCTION public._compute_due_date(
  p_year_start date,
  p_due_month  int,
  p_due_year_offset int
) RETURNS date
  LANGUAGE sql
  IMMUTABLE
AS $$
  SELECT (p_year_start + MAKE_INTERVAL(
    months => COALESCE(p_due_month, 0) - EXTRACT(MONTH FROM p_year_start)::INT,
    years  => COALESCE(p_due_year_offset, 0)
  ))::date;
$$;

COMMENT ON FUNCTION public._compute_due_date IS
  'Helper interne : due_date d''une echeance a partir du year_start + due_month + due_year_offset. Utilise par la RPC calendrier et v_ssyl_installment_status pour garantir cohérence annee scolaire.';

-- 1. get_effective_installments_for_year : recalcule aussi les cfi
CREATE OR REPLACE FUNCTION public.get_effective_installments_for_year(
  p_classroom_id     text,
  p_student_type_id  text,
  p_school_year_id   text
) RETURNS TABLE (
  classroom_id     text,
  student_type_id  uuid,
  "order"          integer,
  label            text,
  category         text,
  due_date         date,
  amount           numeric,
  source           text
)
  LANGUAGE plpgsql
  STABLE
  SECURITY INVOKER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_type_uuid UUID;
  v_year_start DATE;
BEGIN
  BEGIN
    v_type_uuid := p_student_type_id::UUID;
  EXCEPTION WHEN others THEN
    RETURN;
  END;

  SELECT sy.date_start INTO v_year_start
    FROM school_years sy
   WHERE sy.id = p_school_year_id
     AND sy.deleted_at IS NULL;

  IF v_year_start IS NULL THEN
    SELECT sy2.date_start INTO v_year_start
      FROM school_years sy2
      JOIN cycles c ON c.school_id = sy2.school_id
      JOIN levels l ON l.cycle_id = c.id
      JOIN classrooms cr ON cr.level_id = l.id AND cr.id = p_classroom_id
     WHERE sy2.deleted_at IS NULL
     ORDER BY sy2.date_start DESC NULLS LAST
     LIMIT 1;
  END IF;

  RETURN QUERY
    -- Branche cfi (materialise) : due_date recalculee a partir de year_start + due_month + due_year_offset
    SELECT
      cfi.classroom_id,
      cfi.student_type_id,
      cfi."order",
      cfi.label,
      cfi.category,
      _compute_due_date(v_year_start, cfi.due_month, cfi.due_year_offset) AS due_date,
      cfi.amount,
      'classroom_override'::text AS source
      FROM classroom_fee_installments cfi
     WHERE cfi.classroom_id    = p_classroom_id
       AND cfi.student_type_id = v_type_uuid
    UNION ALL
    -- Branche lfi non-materialisee : idem calcul, comportement inchange
    SELECT
      cr.id AS classroom_id,
      lfi.student_type_id,
      lfi."order",
      lfi.label,
      lfi.category,
      _compute_due_date(v_year_start, lfi.due_month, lfi.due_year_offset) AS due_date,
      COALESCE(
        lfi.amount,
        (SELECT (SUM(lfl2.amount) * lfi.amount_percentage) / 100.0
           FROM level_fee_lines lfl2
          WHERE lfl2.level_id        = lfi.level_id
            AND lfl2.student_type_id = lfi.student_type_id
            AND lfl2.category        = lfi.category)
      ) AS amount,
      'level'::text AS source
      FROM classrooms cr
      JOIN level_fee_installments lfi ON lfi.level_id = cr.level_id
     WHERE cr.id                = p_classroom_id
       AND lfi.student_type_id  = v_type_uuid
       AND NOT EXISTS (
         SELECT 1 FROM classroom_fee_installments cfi2
          WHERE cfi2.classroom_id    = cr.id
            AND cfi2.student_type_id = lfi.student_type_id
            AND cfi2.overrides_level_installment_id = lfi.id
       )
    ORDER BY "order";
END $function$;

-- 2. v_ssyl_installment_status : idem, due_date depuis year_start du SSYL
DROP VIEW IF EXISTS v_ssyl_installment_status CASCADE;

CREATE VIEW v_ssyl_installment_status AS
WITH resolved_installments AS (
  SELECT
    ssyl.id AS ssyl_id,
    ssyl.school_year_id,
    ssyl.classroom_id,
    COALESCE(ssyl.type_student_id, (
      SELECT st.id::text FROM student_types st
       WHERE st.school_id = ssyl.school_id AND st.is_default = true
       LIMIT 1
    )) AS effective_type_id,
    COALESCE(cfi.id, lfi.id) AS installment_id,
    COALESCE(cfi.label, lfi.label) AS label,
    COALESCE(cfi.category, lfi.category) AS category,
    COALESCE(cfi.amount, lfi.amount) AS amount_due,
    _compute_due_date(
      sy.date_start::date,
      COALESCE(cfi.due_month, lfi.due_month),
      COALESCE(cfi.due_year_offset, lfi.due_year_offset)
    ) AS due_date
    FROM student_school_year_loggings ssyl
    LEFT JOIN classrooms cr ON cr.id = ssyl.classroom_id
    LEFT JOIN school_years sy ON sy.id = ssyl.school_year_id
    LEFT JOIN classroom_fee_installments cfi
      ON cfi.classroom_id = ssyl.classroom_id
     AND cfi.student_type_id::text = COALESCE(ssyl.type_student_id, (
       SELECT st.id::text FROM student_types st
        WHERE st.school_id = ssyl.school_id AND st.is_default = true
        LIMIT 1
     ))
    LEFT JOIN level_fee_installments lfi
      ON lfi.level_id = cr.level_id
     AND lfi.student_type_id::text = COALESCE(ssyl.type_student_id, (
       SELECT st.id::text FROM student_types st
        WHERE st.school_id = ssyl.school_id AND st.is_default = true
        LIMIT 1
     ))
     AND NOT EXISTS (
       SELECT 1 FROM classroom_fee_installments cfi2
        WHERE cfi2.classroom_id = ssyl.classroom_id
          AND cfi2.student_type_id = lfi.student_type_id
          AND cfi2."order" = lfi."order"
     )
   WHERE ssyl.deleted_at IS NULL
     AND (cfi.id IS NOT NULL OR lfi.id IS NOT NULL)
)
SELECT
  ri.ssyl_id,
  ri.installment_id,
  ri.label,
  ri.category,
  ri.due_date,
  ri.amount_due,
  COALESCE(SUM(pa.allocated_amount), 0::numeric) AS amount_paid,
  CASE
    WHEN COALESCE(SUM(pa.allocated_amount), 0::numeric) >= ri.amount_due THEN 'paid'
    WHEN COALESCE(SUM(pa.allocated_amount), 0::numeric) > 0::numeric      THEN 'partial'
    WHEN ri.due_date < CURRENT_DATE                                       THEN 'overdue'
    WHEN ri.due_date <= (CURRENT_DATE + '7 days'::interval)               THEN 'due'
    ELSE 'future'
  END AS status
  FROM resolved_installments ri
  LEFT JOIN ledger_transactions lt ON lt.ref_id = ri.ssyl_id
  LEFT JOIN payment_allocations pa
    ON pa.fee_installment_id = ri.installment_id
   AND pa.payment_tx_id      = lt.id
 GROUP BY ri.ssyl_id, ri.installment_id, ri.label, ri.category, ri.due_date, ri.amount_due;

COMMENT ON VIEW v_ssyl_installment_status IS
  'Statut par installment pour un SSYL. due_date recalculee a partir de sy.date_start du SSYL + due_month + due_year_offset -> coherent avec l''annee scolaire cible meme pour cfi materialisees dans une autre annee.';

-- =============================================================================
-- Recreate dependent recovery views (dropped by CASCADE de v_ssyl_installment_status)
-- Definitions identiques a la migration 00052.
-- =============================================================================

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

GRANT SELECT ON v_recovery_students TO authenticated;

CREATE VIEW v_recovery_class_summary AS
SELECT
  vs.school_id, vs.school_year_id, vs.classroom_id,
  cl.level_id, lv.cycle_id,
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

CREATE VIEW v_recovery_level_summary AS
SELECT
  vs.school_id, vs.school_year_id, cl.level_id,
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

CREATE VIEW v_recovery_cycle_summary AS
SELECT
  vs.school_id, vs.school_year_id, cy.id AS cycle_id,
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
