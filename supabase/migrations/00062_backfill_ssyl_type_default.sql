-- =============================================================================
-- 00062 — Backfill type_student_id NULL avec le default de l'ecole
--          + fix vue avec fallback sur student_types.is_default
-- =============================================================================
-- Bug 00058 : j'ai nullifie tous les type_student_id qui ne matchaient pas
-- student_types (car FK pointait vers legacy type_students). Impact : 6661
-- SSYL Akonda Divo + 387 Prim'Elite orphelins de type -> ventilation impossible.
--
-- Fix :
--   1. Backfill : SSYL.type_student_id = default student_type de l'ecole
--   2. Vue : fallback additionnel si type_student_id encore NULL apres backfill
-- =============================================================================

-- 1. Backfill : pour chaque SSYL avec type NULL, mettre le default de l'ecole
UPDATE student_school_year_loggings ssyl
   SET type_student_id = st.id::text
  FROM student_types st
 WHERE ssyl.type_student_id IS NULL
   AND ssyl.school_id = st.school_id
   AND st.is_default = true
   AND ssyl.deleted_at IS NULL;

-- 2. Vue : fallback sur is_default de l'ecole si type_student_id est encore NULL
--    (ecoles sans type par defaut)
CREATE OR REPLACE VIEW v_ssyl_installment_status AS
WITH resolved_installments AS (
  SELECT
    ssyl.id AS ssyl_id,
    ssyl.school_year_id,
    ssyl.classroom_id,
    -- Type effectif : SSYL.type sinon default de l'ecole
    coalesce(
      ssyl.type_student_id,
      (SELECT st.id::text FROM student_types st WHERE st.school_id = ssyl.school_id AND st.is_default = true LIMIT 1)
    ) AS effective_type_id,
    coalesce(cfi.id, lfi.id) AS installment_id,
    coalesce(cfi.label, lfi.label) AS label,
    coalesce(cfi.category, lfi.category) AS category,
    coalesce(cfi.amount, lfi.amount) AS amount_due,
    coalesce(
      cfi.due_date,
      (sy.date_start::date + make_interval(
        months => coalesce(lfi.due_month, 0) - EXTRACT(MONTH FROM sy.date_start::date)::int,
        years  => coalesce(lfi.due_year_offset, 0)
      ))::date
    ) AS due_date
  FROM student_school_year_loggings ssyl
  LEFT JOIN classrooms cr ON cr.id = ssyl.classroom_id
  LEFT JOIN school_years sy ON sy.id = ssyl.school_year_id
  LEFT JOIN classroom_fee_installments cfi
    ON cfi.classroom_id = ssyl.classroom_id
    AND cfi.student_type_id::text = coalesce(
      ssyl.type_student_id,
      (SELECT st.id::text FROM student_types st WHERE st.school_id = ssyl.school_id AND st.is_default = true LIMIT 1)
    )
  LEFT JOIN level_fee_installments lfi
    ON lfi.level_id = cr.level_id
    AND lfi.student_type_id::text = coalesce(
      ssyl.type_student_id,
      (SELECT st.id::text FROM student_types st WHERE st.school_id = ssyl.school_id AND st.is_default = true LIMIT 1)
    )
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
    WHEN COALESCE(SUM(pa.allocated_amount), 0::numeric) > 0::numeric THEN 'partial'
    WHEN ri.due_date < CURRENT_DATE THEN 'overdue'
    WHEN ri.due_date <= (CURRENT_DATE + INTERVAL '7 days') THEN 'due'
    ELSE 'future'
  END AS status
FROM resolved_installments ri
LEFT JOIN ledger_transactions lt ON lt.ref_id = ri.ssyl_id
LEFT JOIN payment_allocations pa
  ON pa.fee_installment_id = ri.installment_id
  AND pa.payment_tx_id = lt.id
GROUP BY ri.ssyl_id, ri.installment_id, ri.label, ri.category, ri.due_date, ri.amount_due;

COMMENT ON VIEW v_ssyl_installment_status IS
  'Statut installments par SSYL. Fallback sur default student_type si SSYL.type NULL. Lit classroom_fee (override) ou level_fee (fallback).';
