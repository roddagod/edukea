-- ============================================================
-- Fix ref_id sur les tx paiement générées par l'app (via RPC).
-- Convention finale :
--   ref_type='paiement' + ref_id=paiement.id  -> backfill Laravel (existant)
--   ref_type='payment'  + ref_id=ssyl_id      -> versement app (nouveau)
--   ref_type='discount' + ref_id=ssyl_id      -> remise app (futur)
--   ref_type='opening'  + ref_id=ssyl_id      -> opening balance (déjà comme ça)
--   ref_type='reversal' + ref_id=original_tx_id (déjà comme ça)
--
-- Bénéfices : traçabilité complète, ref_id jamais NULL, index utilisable.
-- ============================================================

-- 1. Backfill des tx existantes avec ref_id NULL : ABANDONNÉ.
--    Le trigger d'immuabilité du ledger bloque toute modification d'une tx
--    posted (c'est son rôle). La vue v_recent_ledger_payments gère déjà les
--    deux cas via LATERAL join sur ledger_entries → pas de besoin urgent.
--    Les nouvelles tx via record_student_payment utiliseront la nouvelle
--    convention (ref_type='payment', ref_id=ssyl_id). Les anciennes NULL
--    restent NULL — pas de rupture fonctionnelle.

-- 2. Update record_student_payment RPC pour utiliser ref_type='payment' + ref_id=ssyl_id
CREATE OR REPLACE FUNCTION record_student_payment(
  p_ssyl_id TEXT,
  p_amount BIGINT,
  p_source ledger_source,
  p_memo TEXT DEFAULT NULL,
  p_occurred_at TIMESTAMPTZ DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ssyl RECORD;
  v_receivable_id UUID;
  v_debit_account_id UUID;
  v_debit_kind ledger_account_kind;
  v_tx_id UUID;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'record_student_payment : montant doit être > 0';
  END IF;

  SELECT ssyl.id, ssyl.school_id, ssyl.school_year_id, ssyl.student_id
  INTO v_ssyl
  FROM student_school_year_loggings ssyl
  WHERE ssyl.id = p_ssyl_id
    AND ssyl.deleted_at IS NULL
    AND (is_admin() OR ssyl.school_id = get_school_staff_school_id());

  IF v_ssyl.id IS NULL THEN
    RAISE EXCEPTION 'record_student_payment : SSYL % introuvable ou accès refusé', p_ssyl_id;
  END IF;

  SELECT id INTO v_receivable_id FROM ledger_accounts
  WHERE kind = 'student_receivable' AND student_ssyl_id = p_ssyl_id LIMIT 1;

  IF v_receivable_id IS NULL THEN
    INSERT INTO ledger_accounts (kind, school_id, student_ssyl_id, school_year_id, name)
    VALUES ('student_receivable', v_ssyl.school_id, p_ssyl_id, v_ssyl.school_year_id, 'Créance élève ' || p_ssyl_id)
    RETURNING id INTO v_receivable_id;
  END IF;

  v_debit_kind := CASE p_source
    WHEN 'cash'          THEN 'school_cash'::ledger_account_kind
    WHEN 'bank_transfer' THEN 'school_bank'::ledger_account_kind
    WHEN 'momo'          THEN 'momo_pending'::ledger_account_kind
    ELSE                       'school_cash'::ledger_account_kind
  END;

  SELECT id INTO v_debit_account_id FROM ledger_accounts
  WHERE kind = v_debit_kind AND school_id = v_ssyl.school_id AND school_year_id IS NULL LIMIT 1;

  IF v_debit_account_id IS NULL THEN
    INSERT INTO ledger_accounts (kind, school_id, school_year_id, name)
    VALUES (
      v_debit_kind,
      v_ssyl.school_id,
      NULL,
      CASE v_debit_kind
        WHEN 'school_cash'  THEN 'Caisse'
        WHEN 'school_bank'  THEN 'Banque'
        WHEN 'momo_pending' THEN 'Mobile Money en attente'
      END
    )
    RETURNING id INTO v_debit_account_id;
  END IF;

  v_tx_id := ledger_post_transaction(
    v_ssyl.school_id,
    v_ssyl.school_year_id,
    p_source,
    'payment',        -- ref_type NEW : distinguer de 'paiement' (backfill Laravel)
    p_ssyl_id,        -- ref_id = ssyl_id (l'enrollment cible)
    NULL,
    COALESCE(p_memo, 'Versement enregistré via app'),
    COALESCE(p_occurred_at, now()),
    jsonb_build_array(
      jsonb_build_object('account_id', v_debit_account_id, 'direction', 'debit',  'amount', p_amount),
      jsonb_build_object('account_id', v_receivable_id,    'direction', 'credit', 'amount', p_amount)
    )
  );

  RETURN v_tx_id;
END $$;

GRANT EXECUTE ON FUNCTION record_student_payment(TEXT, BIGINT, ledger_source, TEXT, TIMESTAMPTZ) TO authenticated;

-- 3. Update v_recent_ledger_payments pour reconnaître 'payment' en plus de 'paiement'
DROP VIEW IF EXISTS v_recent_ledger_payments;

CREATE VIEW v_recent_ledger_payments AS
SELECT
  tx.id                                          AS tx_id,
  tx.school_id,
  tx.school_year_id,
  tx.occurred_at,
  tx.source,
  tx.memo,
  tx.ref_type,
  tx.ref_id,
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
  CASE WHEN debit.debit_kind = 'discount' THEN true ELSE false END AS is_discount,
  CASE
    WHEN COALESCE(rec.receivable_balance, 0) <= 0                                                 THEN 'solde'
    WHEN COALESCE(ssyl.school_fees_total, 0) > 0 AND rec.receivable_balance >= ssyl.school_fees_total THEN 'impaye'
    ELSE 'debute'
  END AS status
FROM ledger_transactions tx
-- SSYL cible via l'écriture credit sur student_receivable
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
JOIN LATERAL (
  SELECT e.amount, a.kind AS debit_kind
  FROM ledger_entries e
  JOIN ledger_accounts a ON a.id = e.account_id
  WHERE e.transaction_id = tx.id AND e.direction = 'debit'
  ORDER BY e.created_at
  LIMIT 1
) debit ON TRUE
-- p uniquement pour les tx backfill Laravel (paiement_type utile pour l'affichage)
LEFT JOIN paiements p ON p.id = tx.ref_id AND tx.ref_type = 'paiement'
LEFT JOIN student_school_year_loggings ssyl ON ssyl.id = credit_target.student_ssyl_id
LEFT JOIN students   st ON st.id = ssyl.student_id
LEFT JOIN classrooms cl ON cl.id = ssyl.classroom_id
LEFT JOIN v_student_receivable rec ON rec.student_ssyl_id = ssyl.id
WHERE tx.ref_type IN ('paiement', 'payment') AND tx.status = 'posted';

GRANT SELECT ON v_recent_ledger_payments TO authenticated;
