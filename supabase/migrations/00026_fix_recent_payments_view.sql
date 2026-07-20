-- ============================================================
-- Fix v_recent_ledger_payments : trouver le SSYL via l'écriture credit
-- sur le compte student_receivable, plutôt que via paiements.ref_id.
--
-- Rationale : les nouveaux versements via record_student_payment RPC
-- n'ont pas de row dans la table `paiements` (ref_id=NULL). La vue V1
-- joignait via paiements.id = tx.ref_id -> pour ces tx, join vide ->
-- student_name/classroom_name vides dans le cockpit.
--
-- La nouvelle logique cherche l'écriture credit dont le compte est
-- de kind='student_receivable' et remonte au SSYL directement.
-- Compatible AVEC ET SANS row paiements sous-jacent.
--
-- Ajoute aussi is_discount pour distinguer remises vs vrais versements.
-- ============================================================

DROP VIEW IF EXISTS v_recent_ledger_payments;

CREATE VIEW v_recent_ledger_payments AS
SELECT
  tx.id                                          AS tx_id,
  tx.school_id,
  tx.school_year_id,
  tx.occurred_at,
  tx.source,
  tx.memo,
  tx.ref_id                                      AS paiement_id,
  p.paiement_type,
  ssyl.id                                        AS ssyl_id,
  st.id                                          AS student_id,
  NULLIF(TRIM(BOTH ' ' FROM (COALESCE(st.lastname,'') || ' ' || COALESCE(st.firstname,''))), '') AS student_name,
  st.matricule,
  cl.name                                        AS classroom_name,
  debit.amount                                   AS amount,
  debit.debit_kind,
  rec.receivable_balance,
  ssyl.school_fees_total,
  CASE
    WHEN debit.debit_kind = 'discount' THEN true
    ELSE false
  END AS is_discount,
  CASE
    WHEN COALESCE(rec.receivable_balance, 0) <= 0                                                 THEN 'solde'
    WHEN COALESCE(ssyl.school_fees_total, 0) > 0 AND rec.receivable_balance >= ssyl.school_fees_total THEN 'impaye'
    ELSE 'debute'
  END AS status
FROM ledger_transactions tx
-- Ecriture credit sur student_receivable pour identifier l'élève
JOIN LATERAL (
  SELECT a.student_ssyl_id
  FROM ledger_entries e
  JOIN ledger_accounts a ON a.id = e.account_id
  WHERE e.transaction_id = tx.id
    AND e.direction = 'credit'
    AND a.kind = 'student_receivable'
    AND a.student_ssyl_id IS NOT NULL
  LIMIT 1
) credit_target ON TRUE
-- Ecriture debit pour connaître montant + kind (cash/bank/momo/discount)
JOIN LATERAL (
  SELECT e.amount, a.kind AS debit_kind
  FROM ledger_entries e
  JOIN ledger_accounts a ON a.id = e.account_id
  WHERE e.transaction_id = tx.id
    AND e.direction = 'debit'
  ORDER BY e.created_at
  LIMIT 1
) debit ON TRUE
LEFT JOIN paiements p             ON p.id = tx.ref_id AND tx.ref_type = 'paiement'
LEFT JOIN student_school_year_loggings ssyl ON ssyl.id = credit_target.student_ssyl_id
LEFT JOIN students   st ON st.id = ssyl.student_id
LEFT JOIN classrooms cl ON cl.id = ssyl.classroom_id
LEFT JOIN v_student_receivable rec ON rec.student_ssyl_id = ssyl.id
WHERE tx.ref_type IN ('paiement', 'reversal') AND tx.status = 'posted';

GRANT SELECT ON v_recent_ledger_payments TO authenticated;
