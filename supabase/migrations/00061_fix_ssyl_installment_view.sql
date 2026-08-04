-- =============================================================================
-- 00061 — v_ssyl_installment_status : lire directement level_fee_installments
--          (avec override classroom si defini)
-- =============================================================================
-- Bug precedent (00057) : la vue lisait UNIQUEMENT classroom_fee_installments,
-- table qui reste vide dans la plupart des cas. Resultat : v_ssyl_installment_status
-- retournait 0 rows PARTOUT, meme pour les ecoles avec 84 level_fee_installments
-- et 3971 SSYL.
--
-- Nouvelle logique :
--   Pour chaque SSYL, on considere les installments applicables :
--   1. classroom_fee_installments s'ils existent (override)
--   2. Sinon level_fee_installments (via classroom.level_id)
--   Cast UUID<->TEXT gere en joignant sur student_type_id::text = ssyl.type_student_id
--
-- Bonus : la vue calcule due_date a la volee depuis due_month/due_year_offset
-- + school_year.date_start, sans dependre de la materialisation.
-- =============================================================================

CREATE OR REPLACE VIEW v_ssyl_installment_status AS
WITH resolved_installments AS (
  -- Pour chaque SSYL, on prend les installments applicables (classroom override
  -- si existant, sinon level fallback).
  SELECT
    ssyl.id AS ssyl_id,
    ssyl.school_year_id,
    ssyl.classroom_id,
    ssyl.type_student_id,
    coalesce(cfi.id, lfi.id) AS installment_id,
    coalesce(cfi.label, lfi.label) AS label,
    coalesce(cfi.category, lfi.category) AS category,
    coalesce(cfi.amount, lfi.amount) AS amount_due,
    -- due_date : classroom override sinon calcule depuis level + year
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
    AND cfi.student_type_id::text = ssyl.type_student_id
  LEFT JOIN level_fee_installments lfi
    ON lfi.level_id = cr.level_id
    AND lfi.student_type_id::text = ssyl.type_student_id
    -- Anti-doublon : on prend lfi seulement si aucune override classroom pour le meme order
    AND NOT EXISTS (
      SELECT 1 FROM classroom_fee_installments cfi2
      WHERE cfi2.classroom_id = ssyl.classroom_id
        AND cfi2.student_type_id = lfi.student_type_id
        AND cfi2."order" = lfi."order"
    )
  WHERE ssyl.deleted_at IS NULL
    AND ssyl.type_student_id IS NOT NULL
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
  'Statut par installment pour chaque SSYL. Resout classroom_fee_installments (override) ou level_fee_installments (fallback) sans dependre de materialisation.';
