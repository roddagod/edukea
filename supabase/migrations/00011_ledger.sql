-- ============================================================
-- LEDGER SYSTEM — append-only double-entry bookkeeping
-- Canonical financial truth for Edukea (positionnement "trésorerie temps réel").
--   - Cash & MoMo payments tracking
--   - Student receivables per school year
--   - Lambano commissions
--   - Reversal via inverse transaction (never DELETE/UPDATE posted rows)
-- Currency: XOF (Franc CFA BCEAO, no subdivision). BIGINT amount = whole XOF.
-- ============================================================

-- ==================== ENUMS ====================
DO $$ BEGIN
  CREATE TYPE ledger_account_kind AS ENUM (
    'student_receivable',     -- Élève doit à l'école (dû scolarité restant)
    'school_cash',            -- Caisse école espèces
    'school_bank',            -- Compte bancaire école
    'momo_pending',           -- MoMo reçu, non apuré
    'momo_settled',           -- MoMo apuré vers l'école
    'revenue_registration',   -- Produits inscription
    'revenue_school_fees',    -- Produits scolarité
    'revenue_annex',          -- Produits frais annexes
    'discount',               -- Réductions accordées
    'commission_lambano',     -- Commission prélevée par Lambano
    'commission_payable',     -- Commission due à l'agrégateur (PawaPay)
    'writeoff'                -- Créances passées en perte
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ledger_direction AS ENUM ('debit', 'credit');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ledger_source AS ENUM (
    'cash', 'momo', 'bank_transfer', 'internal', 'reversal', 'opening_balance'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Statut de la transaction. Convention comptable append-only :
-- une transaction reversée reste 'posted' ; la contre-écriture est une autre tx 'posted'
-- avec reversal_of pointant sur l'originale. Le drapeau reversed_by permet l'affichage UI.
DO $$ BEGIN
  CREATE TYPE ledger_tx_status AS ENUM ('draft', 'posted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==================== ACCOUNTS ====================
CREATE TABLE IF NOT EXISTS ledger_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind ledger_account_kind NOT NULL,
  school_id TEXT REFERENCES schools(id) ON DELETE RESTRICT,           -- NULL = compte global Lambano
  student_ssyl_id TEXT REFERENCES student_school_year_loggings(id),   -- pour student_receivable uniquement
  school_year_id TEXT REFERENCES school_years(id),
  currency CHAR(3) NOT NULL DEFAULT 'XOF',
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unicité fonctionnelle: un compte par (kind, école, élève, année, devise)
CREATE UNIQUE INDEX IF NOT EXISTS uq_ledger_accounts_school_kind
  ON ledger_accounts(kind, COALESCE(school_id, ''), COALESCE(student_ssyl_id, ''), COALESCE(school_year_id, ''), currency);

CREATE INDEX IF NOT EXISTS idx_ledger_accounts_school
  ON ledger_accounts(school_id) WHERE school_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ledger_accounts_ssyl
  ON ledger_accounts(student_ssyl_id) WHERE student_ssyl_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ledger_accounts_kind
  ON ledger_accounts(kind);

-- ==================== TRANSACTIONS ====================
CREATE TABLE IF NOT EXISTS ledger_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL REFERENCES schools(id),
  school_year_id TEXT REFERENCES school_years(id),
  source ledger_source NOT NULL,
  status ledger_tx_status NOT NULL DEFAULT 'draft',
  ref_type TEXT,             -- ex: 'paiement', 'refund', 'commission', 'opening'
  ref_id TEXT,               -- id du domain object (paiement.id, etc.)
  external_ref TEXT,         -- ex: PawaPay transaction id
  memo TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  posted_at TIMESTAMPTZ,
  reversed_by UUID REFERENCES ledger_transactions(id),
  reversal_of UUID REFERENCES ledger_transactions(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_tx_school ON ledger_transactions(school_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_tx_ref ON ledger_transactions(ref_type, ref_id);
CREATE INDEX IF NOT EXISTS idx_ledger_tx_external ON ledger_transactions(external_ref) WHERE external_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ledger_tx_status ON ledger_transactions(status);

-- ==================== ENTRIES ====================
CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES ledger_transactions(id) ON DELETE RESTRICT,
  account_id UUID NOT NULL REFERENCES ledger_accounts(id) ON DELETE RESTRICT,
  direction ledger_direction NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),                    -- XOF entier
  currency CHAR(3) NOT NULL DEFAULT 'XOF',
  school_id TEXT NOT NULL REFERENCES schools(id),               -- dénormalisé pour RLS/index
  occurred_at TIMESTAMPTZ NOT NULL,                             -- copie de tx.occurred_at
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_tx ON ledger_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_account ON ledger_entries(account_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_school ON ledger_entries(school_id, occurred_at DESC);

-- ==================== IMMUTABILITY ====================
CREATE OR REPLACE FUNCTION ledger_forbid_entry_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'ledger_entries is append-only. Use a reversal transaction (source=reversal) instead.';
END $$;

DROP TRIGGER IF EXISTS ledger_entries_no_update ON ledger_entries;
CREATE TRIGGER ledger_entries_no_update
  BEFORE UPDATE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION ledger_forbid_entry_mutation();

DROP TRIGGER IF EXISTS ledger_entries_no_delete ON ledger_entries;
CREATE TRIGGER ledger_entries_no_delete
  BEFORE DELETE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION ledger_forbid_entry_mutation();

-- Posted transactions are immutable except for the reversed_by marker.
CREATE OR REPLACE FUNCTION ledger_protect_posted_tx()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'posted' THEN
      RAISE EXCEPTION 'Posted transactions cannot be deleted.';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.status = 'posted' THEN
    IF NEW.status <> OLD.status
       OR NEW.occurred_at <> OLD.occurred_at
       OR NEW.school_id <> OLD.school_id
       OR NEW.source <> OLD.source
       OR COALESCE(NEW.memo,'') <> COALESCE(OLD.memo,'')
       OR COALESCE(NEW.ref_type,'') <> COALESCE(OLD.ref_type,'')
       OR COALESCE(NEW.ref_id,'') <> COALESCE(OLD.ref_id,'') THEN
      RAISE EXCEPTION 'Posted transactions cannot be modified. Create a reversal transaction instead.';
    END IF;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS ledger_tx_protect ON ledger_transactions;
CREATE TRIGGER ledger_tx_protect
  BEFORE UPDATE OR DELETE ON ledger_transactions
  FOR EACH ROW EXECUTE FUNCTION ledger_protect_posted_tx();

-- ==================== BALANCED CHECK ====================
CREATE OR REPLACE FUNCTION ledger_is_balanced(p_tx UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT COALESCE(SUM(CASE WHEN direction='debit' THEN amount ELSE -amount END), 0) = 0
  FROM ledger_entries WHERE transaction_id = p_tx;
$$;

-- ==================== RPC — atomic post ====================
-- All writes to ledger_transactions/entries go through this function.
-- p_entries is JSONB array of {account_id, direction, amount} (currency optional, default XOF).
CREATE OR REPLACE FUNCTION ledger_post_transaction(
  p_school_id TEXT,
  p_school_year_id TEXT,
  p_source ledger_source,
  p_ref_type TEXT,
  p_ref_id TEXT,
  p_external_ref TEXT,
  p_memo TEXT,
  p_occurred_at TIMESTAMPTZ,
  p_entries JSONB
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tx_id UUID;
  v_entry JSONB;
  v_occ TIMESTAMPTZ := COALESCE(p_occurred_at, now());
BEGIN
  IF jsonb_typeof(p_entries) <> 'array' OR jsonb_array_length(p_entries) < 2 THEN
    RAISE EXCEPTION 'ledger_post_transaction: at least 2 entries required (double-entry)';
  END IF;

  INSERT INTO ledger_transactions
    (school_id, school_year_id, source, status, ref_type, ref_id, external_ref, memo, occurred_at, created_by)
  VALUES
    (p_school_id, p_school_year_id, p_source, 'draft', p_ref_type, p_ref_id, p_external_ref, p_memo, v_occ, auth.uid())
  RETURNING id INTO v_tx_id;

  FOR v_entry IN SELECT jsonb_array_elements(p_entries) LOOP
    INSERT INTO ledger_entries (transaction_id, account_id, direction, amount, currency, school_id, occurred_at)
    VALUES (
      v_tx_id,
      (v_entry->>'account_id')::UUID,
      (v_entry->>'direction')::ledger_direction,
      (v_entry->>'amount')::BIGINT,
      COALESCE(v_entry->>'currency', 'XOF'),
      p_school_id,
      v_occ
    );
  END LOOP;

  IF NOT ledger_is_balanced(v_tx_id) THEN
    RAISE EXCEPTION 'ledger_post_transaction: transaction % is not balanced (SUM debits <> SUM credits)', v_tx_id;
  END IF;

  UPDATE ledger_transactions SET status = 'posted', posted_at = now() WHERE id = v_tx_id;
  RETURN v_tx_id;
END $$;

-- ==================== RPC — reverse a posted transaction ====================
CREATE OR REPLACE FUNCTION ledger_reverse_transaction(
  p_tx_id UUID,
  p_memo TEXT
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_reversal_id UUID;
  v_original ledger_transactions%ROWTYPE;
  v_entry_row RECORD;
  v_entries JSONB := '[]'::JSONB;
BEGIN
  SELECT * INTO v_original FROM ledger_transactions WHERE id = p_tx_id FOR UPDATE;
  IF v_original.id IS NULL THEN RAISE EXCEPTION 'ledger_reverse_transaction: tx % not found', p_tx_id; END IF;
  IF v_original.status <> 'posted' THEN RAISE EXCEPTION 'ledger_reverse_transaction: only posted transactions can be reversed'; END IF;

  FOR v_entry_row IN SELECT account_id, direction, amount, currency FROM ledger_entries WHERE transaction_id = p_tx_id LOOP
    v_entries := v_entries || jsonb_build_object(
      'account_id', v_entry_row.account_id,
      'direction', CASE WHEN v_entry_row.direction = 'debit' THEN 'credit' ELSE 'debit' END,
      'amount', v_entry_row.amount,
      'currency', v_entry_row.currency
    );
  END LOOP;

  v_reversal_id := ledger_post_transaction(
    v_original.school_id, v_original.school_year_id, 'reversal',
    'reversal', p_tx_id::TEXT, v_original.external_ref,
    COALESCE(p_memo, 'Reversal of ' || p_tx_id::TEXT),
    now(), v_entries
  );

  UPDATE ledger_transactions SET reversal_of = p_tx_id WHERE id = v_reversal_id;
  UPDATE ledger_transactions SET reversed_by = v_reversal_id WHERE id = p_tx_id;

  RETURN v_reversal_id;
END $$;

-- ==================== BALANCE VIEW ====================
CREATE OR REPLACE VIEW v_ledger_account_balance AS
SELECT
  a.id AS account_id,
  a.kind,
  a.school_id,
  a.student_ssyl_id,
  a.school_year_id,
  a.currency,
  COALESCE(SUM(CASE WHEN e.direction='debit' THEN e.amount ELSE -e.amount END) FILTER (WHERE t.status = 'posted'), 0) AS balance
FROM ledger_accounts a
LEFT JOIN ledger_entries e ON e.account_id = a.id
LEFT JOIN ledger_transactions t ON t.id = e.transaction_id
GROUP BY a.id, a.kind, a.school_id, a.student_ssyl_id, a.school_year_id, a.currency;

-- Vue de trésorerie école (cash + bank + momo)
CREATE OR REPLACE VIEW v_school_treasury AS
SELECT
  a.school_id,
  a.currency,
  SUM(CASE WHEN a.kind = 'school_cash'    THEN b.balance ELSE 0 END) AS cash_balance,
  SUM(CASE WHEN a.kind = 'school_bank'    THEN b.balance ELSE 0 END) AS bank_balance,
  SUM(CASE WHEN a.kind = 'momo_pending'   THEN b.balance ELSE 0 END) AS momo_pending_balance,
  SUM(CASE WHEN a.kind = 'momo_settled'   THEN b.balance ELSE 0 END) AS momo_settled_balance,
  SUM(b.balance) FILTER (WHERE a.kind IN ('school_cash','school_bank','momo_pending','momo_settled')) AS total_treasury
FROM ledger_accounts a
JOIN v_ledger_account_balance b ON b.account_id = a.id
WHERE a.school_id IS NOT NULL
GROUP BY a.school_id, a.currency;

-- Vue solde restant à payer par élève × année scolaire
CREATE OR REPLACE VIEW v_student_receivable AS
SELECT
  a.school_id,
  a.student_ssyl_id,
  a.school_year_id,
  a.currency,
  b.balance AS receivable_balance
FROM ledger_accounts a
JOIN v_ledger_account_balance b ON b.account_id = a.id
WHERE a.kind = 'student_receivable' AND a.student_ssyl_id IS NOT NULL;

-- ==================== RLS ====================
ALTER TABLE ledger_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries      ENABLE ROW LEVEL SECURITY;

-- Admin Lambano : accès total
CREATE POLICY "Admins full access on ledger_accounts"
  ON ledger_accounts FOR SELECT USING (is_admin());
CREATE POLICY "Admins full access on ledger_transactions"
  ON ledger_transactions FOR SELECT USING (is_admin());
CREATE POLICY "Admins full access on ledger_entries"
  ON ledger_entries FOR SELECT USING (is_admin());

-- Parents : lecture sur leurs enfants uniquement
CREATE POLICY "Parents can view own children ledger accounts"
  ON ledger_accounts FOR SELECT
  USING (
    school_id = get_parent_school_id() AND
    (student_ssyl_id IS NULL OR EXISTS (
      SELECT 1 FROM student_school_year_loggings ssyl
      WHERE ssyl.id = ledger_accounts.student_ssyl_id
        AND ssyl.student_id IN (SELECT get_parent_student_ids())
    ))
  );

CREATE POLICY "Parents can view own children ledger entries"
  ON ledger_entries FOR SELECT
  USING (
    school_id = get_parent_school_id() AND
    EXISTS (
      SELECT 1 FROM ledger_accounts a
      LEFT JOIN student_school_year_loggings ssyl ON ssyl.id = a.student_ssyl_id
      WHERE a.id = ledger_entries.account_id
        AND (a.student_ssyl_id IS NULL OR ssyl.student_id IN (SELECT get_parent_student_ids()))
    )
  );

CREATE POLICY "Parents can view own children ledger transactions"
  ON ledger_transactions FOR SELECT
  USING (
    school_id = get_parent_school_id() AND
    EXISTS (
      SELECT 1 FROM ledger_entries e
      JOIN ledger_accounts a ON a.id = e.account_id
      LEFT JOIN student_school_year_loggings ssyl ON ssyl.id = a.student_ssyl_id
      WHERE e.transaction_id = ledger_transactions.id
        AND (a.student_ssyl_id IS NULL OR ssyl.student_id IN (SELECT get_parent_student_ids()))
    )
  );

-- Écriture réservée au RPC (SECURITY DEFINER contourne les policies)
REVOKE INSERT, UPDATE, DELETE ON ledger_transactions FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON ledger_entries      FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON ledger_accounts     FROM authenticated, anon;

GRANT SELECT ON v_ledger_account_balance TO authenticated;
GRANT SELECT ON v_school_treasury        TO authenticated;
GRANT SELECT ON v_student_receivable     TO authenticated;

GRANT EXECUTE ON FUNCTION ledger_post_transaction   TO authenticated;
GRANT EXECUTE ON FUNCTION ledger_reverse_transaction TO authenticated;
