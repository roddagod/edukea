-- ============================================================
-- Backfill Collège Akonda Divo · toutes années disponibles
--
-- Généralise 00013 (qui ne traitait que 2025-2026) : boucle sur
-- toutes les années de l'école qui ont des paiements dans la table
-- historique `paiements`. Idempotent (ref_type/ref_id skip si déjà vu).
-- ============================================================

DO $$
DECLARE
  v_school_id TEXT := '06582bf9-d164-478f-afb1-bbb2d245feab'; -- Akonda Divo
  v_year_rec RECORD;
  v_cash_id UUID;
  v_bank_id UUID;
  v_momo_pending_id UUID;
  v_revenue_id UUID;
  v_discount_id UUID;
  v_year_id TEXT;
  v_n_openings INT;
  v_n_payments INT;
BEGIN
  -- Comptes école (déjà créés par 00013 pour cash/bank/momo, réutilisés)
  SELECT id INTO v_cash_id FROM ledger_accounts
    WHERE kind='school_cash' AND school_id=v_school_id AND school_year_id IS NULL LIMIT 1;
  SELECT id INTO v_bank_id FROM ledger_accounts
    WHERE kind='school_bank' AND school_id=v_school_id AND school_year_id IS NULL LIMIT 1;
  SELECT id INTO v_momo_pending_id FROM ledger_accounts
    WHERE kind='momo_pending' AND school_id=v_school_id AND school_year_id IS NULL LIMIT 1;

  -- Pour chaque année scolaire de l'école qui a au moins un paiement dans paiements
  FOR v_year_rec IN
    SELECT ssyl.school_year_id, MAX(sy.name) AS year_name, MAX(sy.date_start::text) AS start_date
    FROM student_school_year_loggings ssyl
    JOIN school_years sy ON sy.id = ssyl.school_year_id
    JOIN paiements p ON p.student_school_year_logging_id = ssyl.id
    WHERE ssyl.school_id = v_school_id
      AND (p.deleted_at IS NULL OR p.deleted_at = '')
    GROUP BY ssyl.school_year_id
    ORDER BY start_date
  LOOP
    v_year_id := v_year_rec.school_year_id;

    -- revenue et discount pour cette année (si pas encore créés)
    INSERT INTO ledger_accounts (kind, school_id, school_year_id, name)
    VALUES ('revenue_school_fees', v_school_id, v_year_id, 'Produits scolarité ' || v_year_rec.year_name)
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_revenue_id FROM ledger_accounts
      WHERE kind='revenue_school_fees' AND school_id=v_school_id AND school_year_id=v_year_id LIMIT 1;

    INSERT INTO ledger_accounts (kind, school_id, school_year_id, name)
    VALUES ('discount', v_school_id, v_year_id, 'Remises accordées ' || v_year_rec.year_name)
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_discount_id FROM ledger_accounts
      WHERE kind='discount' AND school_id=v_school_id AND school_year_id=v_year_id LIMIT 1;

    -- Comptes student_receivable
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

    -- Opening balances
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
        'opening', o.ssyl_id, 'Opening balance backfill', o.occurred_at, now()
      FROM openings o
      RETURNING id, occurred_at
    )
    INSERT INTO ledger_entries
      (transaction_id, account_id, direction, amount, currency, school_id, occurred_at)
    SELECT it.id, o.receivable_acc, 'debit'::ledger_direction,  o.amount, 'XOF', v_school_id, it.occurred_at FROM openings o JOIN ins_tx it ON it.id = o.tx_id
    UNION ALL
    SELECT it.id, v_revenue_id,   'credit'::ledger_direction, o.amount, 'XOF', v_school_id, it.occurred_at FROM openings o JOIN ins_tx it ON it.id = o.tx_id;

    -- Paiements → ledger
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
          WHEN COALESCE(p.is_discount, 0) = 1 OR p.paiement_type = 'Remise' THEN 'reversal'
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

    RAISE NOTICE 'Annee % : backfill applique', v_year_rec.year_name;
  END LOOP;

  -- Sanity check global
  IF EXISTS (
    SELECT tx.id
    FROM ledger_transactions tx
    JOIN ledger_entries e ON e.transaction_id = tx.id
    WHERE tx.school_id = v_school_id
    GROUP BY tx.id
    HAVING SUM(CASE WHEN e.direction='debit' THEN e.amount ELSE -e.amount END) <> 0
  ) THEN
    RAISE EXCEPTION 'Unbalanced transactions detected in backfill !';
  END IF;

  RAISE NOTICE '✓ Backfill 4 années Akonda Divo termine sans erreur';
END $$;
