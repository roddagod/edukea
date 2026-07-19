-- ============================================================
-- v_recent_ledger_payments : dernières transactions de paiement
-- enrichies (élève, matricule, classe, statut R/J/V, montant, canal).
--
-- Remplace le waterfall de 6 requêtes du hook useRecentPayments par
-- une seule SELECT sur cette vue.
-- ============================================================

CREATE OR REPLACE VIEW v_recent_ledger_payments AS
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
  -- amount depuis la première écriture debit de la tx (montant reçu par l'école)
  (SELECT e.amount FROM ledger_entries e WHERE e.transaction_id = tx.id AND e.direction = 'debit' LIMIT 1) AS amount,
  -- solde restant sur le compte élève (déjà calculé)
  rec.receivable_balance,
  ssyl.school_fees_total,
  CASE
    WHEN COALESCE(rec.receivable_balance, 0) <= 0                                                 THEN 'solde'
    WHEN COALESCE(ssyl.school_fees_total, 0) > 0 AND rec.receivable_balance >= ssyl.school_fees_total THEN 'impaye'
    ELSE 'debute'
  END AS status
FROM ledger_transactions tx
LEFT JOIN paiements p             ON p.id = tx.ref_id AND tx.ref_type = 'paiement'
LEFT JOIN student_school_year_loggings ssyl ON ssyl.id = p.student_school_year_logging_id
LEFT JOIN students   st ON st.id = ssyl.student_id
LEFT JOIN classrooms cl ON cl.id = ssyl.classroom_id
LEFT JOIN v_student_receivable rec ON rec.student_ssyl_id = ssyl.id
WHERE tx.ref_type = 'paiement' AND tx.status = 'posted';

GRANT SELECT ON v_recent_ledger_payments TO authenticated;
