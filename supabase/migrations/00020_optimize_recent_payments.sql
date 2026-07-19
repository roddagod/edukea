-- ============================================================
-- Optimize v_recent_ledger_payments
-- Le subquery `amount` par row scannait ledger_entries pour chaque tx.
-- Remplacement par un JOIN direct avec un DISTINCT ON qui prend la
-- première ligne debit par tx.
-- ============================================================

-- Index critique : (transaction_id, direction) pour aller au debit de tx en O(log)
CREATE INDEX IF NOT EXISTS idx_ledger_entries_tx_direction
  ON ledger_entries(transaction_id, direction);

DROP VIEW IF EXISTS v_recent_ledger_payments;

CREATE VIEW v_recent_ledger_payments AS
SELECT
  tx.id                                          AS tx_id,
  tx.school_id,
  tx.school_year_id,
  tx.occurred_at,
  tx.source,
  tx.memo,
  p.id                                           AS paiement_id,
  p.paiement_type,
  ssyl.id                                        AS ssyl_id,
  st.id                                          AS student_id,
  TRIM(BOTH ' ' FROM (COALESCE(st.lastname,'') || ' ' || COALESCE(st.firstname,''))) AS student_name,
  st.matricule,
  cl.name                                        AS classroom_name,
  e.amount                                       AS amount,
  rec.receivable_balance,
  ssyl.school_fees_total,
  CASE
    WHEN COALESCE(rec.receivable_balance, 0) <= 0                                                 THEN 'solde'
    WHEN COALESCE(ssyl.school_fees_total, 0) > 0 AND rec.receivable_balance >= ssyl.school_fees_total THEN 'impaye'
    ELSE 'debute'
  END AS status
FROM ledger_transactions tx
JOIN LATERAL (
  SELECT amount FROM ledger_entries WHERE transaction_id = tx.id AND direction = 'debit' LIMIT 1
) e ON TRUE
LEFT JOIN paiements p             ON p.id = tx.ref_id AND tx.ref_type = 'paiement'
LEFT JOIN student_school_year_loggings ssyl ON ssyl.id = p.student_school_year_logging_id
LEFT JOIN students   st ON st.id = ssyl.student_id
LEFT JOIN classrooms cl ON cl.id = ssyl.classroom_id
LEFT JOIN v_student_receivable rec ON rec.student_ssyl_id = ssyl.id
WHERE tx.ref_type = 'paiement' AND tx.status = 'posted';

GRANT SELECT ON v_recent_ledger_payments TO authenticated;

-- Analyze pour que le planner utilise l'index
ANALYZE ledger_entries;
ANALYZE ledger_transactions;
