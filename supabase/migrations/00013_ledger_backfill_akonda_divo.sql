-- ============================================================
-- BACKFILL LEDGER — Collège Akonda Divo · année 2025-2026
--
-- Strategy :
--   1. Créer un compte ledger par catégorie pour l'école (cash/bank/momo/revenue/discount)
--   2. Créer un compte "student_receivable" par SSYL de l'année
--   3. Insérer une opening_balance tx pour chaque SSYL avec school_fees_total > 0
--      (Debit student_receivable / Credit revenue_school_fees)
--   4. Insérer une payment tx pour chaque paiement existant
--      (Debit cash-or-momo / Credit student_receivable)
--
-- Insertions faites en direct (bypass RPC) car migration = superuser.
-- Balance validée par une CHECK sur chaque tx : SUM(debit) = SUM(credit).
-- Idempotent : ref_type/ref_id permettent de détecter des tx déjà backfillées
-- et de skipper. Re-run safe.
-- ============================================================

DO $$
DECLARE
  v_school_id TEXT := '06582bf9-d164-478f-afb1-bbb2d245feab'; -- Akonda Divo
  v_year_id   TEXT := '567a51dd-33d8-4ead-a2b3-f33025dce942'; -- 2025-2026

  v_cash_id           UUID;
  v_bank_id           UUID;
  v_momo_pending_id   UUID;
  v_revenue_id        UUID;
  v_discount_id       UUID;
  v_n_openings        INT;
  v_n_payments        INT;
  v_n_receivables     INT;
BEGIN
  -- ==================== 1. Comptes école ====================
  INSERT INTO ledger_accounts (kind, school_id, school_year_id, name)
  VALUES ('school_cash', v_school_id, NULL, 'Caisse')
  ON CONFLICT DO NOTHING;
  SELECT id INTO v_cash_id FROM ledger_accounts
    WHERE kind='school_cash' AND school_id=v_school_id AND school_year_id IS NULL LIMIT 1;

  INSERT INTO ledger_accounts (kind, school_id, school_year_id, name)
  VALUES ('school_bank', v_school_id, NULL, 'Banque')
  ON CONFLICT DO NOTHING;
  SELECT id INTO v_bank_id FROM ledger_accounts
    WHERE kind='school_bank' AND school_id=v_school_id AND school_year_id IS NULL LIMIT 1;

  INSERT INTO ledger_accounts (kind, school_id, school_year_id, name)
  VALUES ('momo_pending', v_school_id, NULL, 'Mobile Money en attente')
  ON CONFLICT DO NOTHING;
  SELECT id INTO v_momo_pending_id FROM ledger_accounts
    WHERE kind='momo_pending' AND school_id=v_school_id AND school_year_id IS NULL LIMIT 1;

  INSERT INTO ledger_accounts (kind, school_id, school_year_id, name)
  VALUES ('revenue_school_fees', v_school_id, v_year_id, 'Produits scolarité 2025-2026')
  ON CONFLICT DO NOTHING;
  SELECT id INTO v_revenue_id FROM ledger_accounts
    WHERE kind='revenue_school_fees' AND school_id=v_school_id AND school_year_id=v_year_id LIMIT 1;

  INSERT INTO ledger_accounts (kind, school_id, school_year_id, name)
  VALUES ('discount', v_school_id, v_year_id, 'Remises accordées 2025-2026')
  ON CONFLICT DO NOTHING;
  SELECT id INTO v_discount_id FROM ledger_accounts
    WHERE kind='discount' AND school_id=v_school_id AND school_year_id=v_year_id LIMIT 1;

  RAISE NOTICE 'Ecole accounts créés : cash=% bank=% momo=% revenue=% discount=%',
    v_cash_id, v_bank_id, v_momo_pending_id, v_revenue_id, v_discount_id;

  -- ==================== 2. student_receivable par SSYL ====================
  -- Un compte par élève × année scolaire dans cette école
  INSERT INTO ledger_accounts (kind, school_id, student_ssyl_id, school_year_id, name)
  SELECT
    'student_receivable',
    ssyl.school_id,
    ssyl.id,
    ssyl.school_year_id,
    'Créance élève ' || COALESCE(st.firstname || ' ' || st.lastname, ssyl.id)
  FROM student_school_year_loggings ssyl
  LEFT JOIN students st ON st.id = ssyl.student_id
  WHERE ssyl.school_id = v_school_id
    AND ssyl.school_year_id = v_year_id
    AND ssyl.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM ledger_accounts la
      WHERE la.kind = 'student_receivable' AND la.student_ssyl_id = ssyl.id
    );
  GET DIAGNOSTICS v_n_receivables = ROW_COUNT;
  RAISE NOTICE '% comptes student_receivable créés', v_n_receivables;

  -- ==================== 3. Opening balances ====================
  -- Une tx opening_balance par SSYL avec school_fees_total > 0.
  -- Skippe si une opening existe déjà pour ce SSYL (ref_type=opening ref_id=ssyl.id).
  WITH openings AS (
    SELECT
      gen_random_uuid() AS tx_id,
      ssyl.id AS ssyl_id,
      la.id AS receivable_acc,
      COALESCE(ssyl.school_fees_total, 0)::BIGINT AS amount,
      COALESCE(ssyl.registration_date, sy.date_start, ssyl.created_at)::TIMESTAMPTZ AS occurred_at
    FROM student_school_year_loggings ssyl
    JOIN school_years sy ON sy.id = ssyl.school_year_id
    JOIN ledger_accounts la ON la.student_ssyl_id = ssyl.id AND la.kind='student_receivable'
    WHERE ssyl.school_id = v_school_id
      AND ssyl.school_year_id = v_year_id
      AND ssyl.deleted_at IS NULL
      AND COALESCE(ssyl.school_fees_total, 0) > 0
      AND NOT EXISTS (
        SELECT 1 FROM ledger_transactions tx
        WHERE tx.ref_type = 'opening' AND tx.ref_id = ssyl.id
      )
  ),
  ins_tx AS (
    INSERT INTO ledger_transactions
      (id, school_id, school_year_id, source, status, ref_type, ref_id, memo, occurred_at, posted_at)
    SELECT
      o.tx_id, v_school_id, v_year_id, 'opening_balance', 'posted',
      'opening', o.ssyl_id,
      'Opening balance backfill',
      o.occurred_at, now()
    FROM openings o
    RETURNING id, occurred_at
  )
  INSERT INTO ledger_entries
    (transaction_id, account_id, direction, amount, currency, school_id, occurred_at)
  SELECT it.id, o.receivable_acc, 'debit'::ledger_direction,  o.amount, 'XOF', v_school_id, it.occurred_at FROM openings o JOIN ins_tx it ON it.id = o.tx_id
  UNION ALL
  SELECT it.id, v_revenue_id,   'credit'::ledger_direction, o.amount, 'XOF', v_school_id, it.occurred_at FROM openings o JOIN ins_tx it ON it.id = o.tx_id;

  SELECT COUNT(*) INTO v_n_openings FROM ledger_transactions
    WHERE school_id=v_school_id AND ref_type='opening';
  RAISE NOTICE 'Opening balances totales pour ecole : %', v_n_openings;

  -- ==================== 4. Paiements → ledger ====================
  -- Chaque paiement = 1 tx avec 2 écritures.
  -- Mapping paiement_type:
  --   Espece / Autre / NULL           → school_cash
  --   Mobile money                    → momo_pending
  --   (Remise + is_discount)          → discount tx : Debit discount / Credit student_receivable
  -- Skip si tx déjà backfillée (ref_type=paiement ref_id=paiement.id)
  WITH payments AS (
    SELECT
      gen_random_uuid() AS tx_id,
      p.id AS paiement_id,
      ssyl.id AS ssyl_id,
      la.id AS receivable_acc,
      p.amount::BIGINT AS amount,
      p.paiement_type,
      COALESCE(p.is_discount, 0) AS is_discount,
      COALESCE(p.created_at, sy.date_start)::TIMESTAMPTZ AS occurred_at,
      CASE
        WHEN COALESCE(p.is_discount, 0) = 1 OR p.paiement_type = 'Remise' THEN v_discount_id
        WHEN p.paiement_type = 'Mobile money' THEN v_momo_pending_id
        ELSE v_cash_id
      END AS debit_acc,
      CASE
        WHEN COALESCE(p.is_discount, 0) = 1 OR p.paiement_type = 'Remise' THEN 'reversal'  -- discount as internal correction
        WHEN p.paiement_type = 'Mobile money' THEN 'momo'
        ELSE 'cash'
      END::ledger_source AS source
    FROM paiements p
    JOIN student_school_year_loggings ssyl ON ssyl.id = p.student_school_year_logging_id
    JOIN school_years sy ON sy.id = ssyl.school_year_id
    JOIN ledger_accounts la ON la.student_ssyl_id = ssyl.id AND la.kind='student_receivable'
    WHERE ssyl.school_id = v_school_id
      AND ssyl.school_year_id = v_year_id
      AND (p.deleted_at IS NULL OR p.deleted_at = '')
      AND p.amount > 0
      AND NOT EXISTS (
        SELECT 1 FROM ledger_transactions tx
        WHERE tx.ref_type = 'paiement' AND tx.ref_id = p.id
      )
  ),
  ins_tx AS (
    INSERT INTO ledger_transactions
      (id, school_id, school_year_id, source, status, ref_type, ref_id, memo, occurred_at, posted_at)
    SELECT
      p.tx_id, v_school_id, v_year_id, p.source, 'posted',
      'paiement', p.paiement_id,
      'Backfill paiement ' || COALESCE(p.paiement_type, 'Espece'),
      p.occurred_at, now()
    FROM payments p
    RETURNING id, occurred_at
  )
  INSERT INTO ledger_entries
    (transaction_id, account_id, direction, amount, currency, school_id, occurred_at)
  SELECT it.id, p.debit_acc,      'debit'::ledger_direction,  p.amount, 'XOF', v_school_id, it.occurred_at FROM payments p JOIN ins_tx it ON it.id = p.tx_id
  UNION ALL
  SELECT it.id, p.receivable_acc, 'credit'::ledger_direction, p.amount, 'XOF', v_school_id, it.occurred_at FROM payments p JOIN ins_tx it ON it.id = p.tx_id;

  SELECT COUNT(*) INTO v_n_payments FROM ledger_transactions
    WHERE school_id=v_school_id AND ref_type='paiement';
  RAISE NOTICE 'Paiement transactions totales pour ecole : %', v_n_payments;

  -- ==================== 5. Sanity check global ====================
  IF EXISTS (
    SELECT tx.id
    FROM ledger_transactions tx
    JOIN ledger_entries e ON e.transaction_id = tx.id
    WHERE tx.school_id = v_school_id
    GROUP BY tx.id
    HAVING SUM(CASE WHEN e.direction='debit' THEN e.amount ELSE -e.amount END) <> 0
  ) THEN
    RAISE EXCEPTION 'Backfill produced unbalanced transactions !';
  END IF;

  RAISE NOTICE '✓ Backfill Akonda Divo 2025-2026 termine sans erreur';
END $$;
