-- ============================================================
-- v_school_recovery : recouvrement par école × année scolaire
--   billed_total       = ce qui a été facturé (opening balances = SUM revenue credits)
--   collected_total    = déjà encaissé
--   remaining_total    = restant dû
--   solde_count        = nb élèves totalement soldés
--   debute_count       = nb élèves ayant commencé à payer
--   impaye_count       = nb élèves n'ayant rien versé
-- ============================================================

CREATE OR REPLACE VIEW v_school_recovery AS
WITH opening_per_student AS (
  -- Ce qui a été facturé initialement par élève (via opening transactions)
  SELECT
    a.school_id,
    a.school_year_id,
    a.student_ssyl_id,
    a.id AS receivable_account_id,
    COALESCE(SUM(CASE WHEN e.direction='debit' THEN e.amount ELSE 0 END), 0) AS billed_initial
  FROM ledger_accounts a
  LEFT JOIN ledger_entries e ON e.account_id = a.id
  LEFT JOIN ledger_transactions t ON t.id = e.transaction_id AND t.ref_type = 'opening'
  WHERE a.kind = 'student_receivable' AND a.student_ssyl_id IS NOT NULL
  GROUP BY a.school_id, a.school_year_id, a.student_ssyl_id, a.id
),
balance_per_student AS (
  -- Solde restant à payer par élève (net des paiements)
  SELECT
    ops.school_id,
    ops.school_year_id,
    ops.student_ssyl_id,
    ops.billed_initial,
    COALESCE(bal.balance, 0) AS remaining
  FROM opening_per_student ops
  LEFT JOIN v_ledger_account_balance bal ON bal.account_id = ops.receivable_account_id
  WHERE ops.billed_initial > 0
)
SELECT
  school_id,
  school_year_id,
  SUM(billed_initial) AS billed_total,
  SUM(billed_initial - remaining) AS collected_total,
  SUM(remaining) AS remaining_total,
  CASE WHEN SUM(billed_initial) = 0 THEN 0
       ELSE ROUND(100.0 * SUM(billed_initial - remaining) / SUM(billed_initial), 1) END AS recovery_pct,
  COUNT(*) FILTER (WHERE remaining <= 0)                                AS solde_count,
  COUNT(*) FILTER (WHERE remaining > 0 AND remaining < billed_initial)  AS debute_count,
  COUNT(*) FILTER (WHERE remaining >= billed_initial)                   AS impaye_count
FROM balance_per_student
GROUP BY school_id, school_year_id;

GRANT SELECT ON v_school_recovery TO authenticated;
