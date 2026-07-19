-- ============================================================
-- v_school_treasury_by_year : trésorerie ENCAISSÉE dans une année scolaire.
--
-- Différence avec v_school_treasury :
--   - v_school_treasury = solde des comptes cash/bank/momo (cumulé toutes années)
--   - v_school_treasury_by_year = somme des débits sur cash/bank/momo qui
--     proviennent de transactions dont school_year_id = <année>
--
-- Utilisé par le cockpit pour afficher "encaissé cette année scolaire".
-- Fixe le bug ou changer d'année ne changeait pas la valeur du HeroKPI.
-- ============================================================

CREATE OR REPLACE VIEW v_school_treasury_by_year AS
SELECT
  tx.school_id,
  tx.school_year_id,
  SUM(CASE WHEN a.kind = 'school_cash'  THEN e.amount ELSE 0 END) AS cash_collected,
  SUM(CASE WHEN a.kind = 'school_bank'  THEN e.amount ELSE 0 END) AS bank_collected,
  SUM(CASE WHEN a.kind = 'momo_pending' THEN e.amount ELSE 0 END) AS momo_pending_collected,
  SUM(CASE WHEN a.kind = 'momo_settled' THEN e.amount ELSE 0 END) AS momo_settled_collected,
  SUM(CASE WHEN a.kind IN ('school_cash','school_bank','momo_pending','momo_settled') THEN e.amount ELSE 0 END) AS total_collected,
  COUNT(DISTINCT tx.id) AS tx_count
FROM ledger_transactions tx
JOIN ledger_entries e ON e.transaction_id = tx.id AND e.direction = 'debit'
JOIN ledger_accounts a ON a.id = e.account_id
WHERE tx.status = 'posted'
  AND tx.ref_type IN ('paiement', 'opening_balance')
  AND tx.school_year_id IS NOT NULL
GROUP BY tx.school_id, tx.school_year_id;

GRANT SELECT ON v_school_treasury_by_year TO authenticated;
