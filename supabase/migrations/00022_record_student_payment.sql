-- ============================================================
-- RPC record_student_payment(ssyl_id, amount, source, memo, occurred_at)
--
-- Wrapper high-level autour de ledger_post_transaction. Le frontend n'a
-- pas à connaître les IDs des comptes ledger — il passe juste :
--   - ssyl_id : student × year (identifie le compte receivable)
--   - amount  : montant XOF
--   - source  : 'cash' | 'bank_transfer' | 'internal' (pas 'momo' phase 1)
--   - memo    : optionnel
--
-- Résout les comptes de l'école (cash/bank) automatiquement.
-- Crée le compte student_receivable s'il n'existe pas.
-- Retourne l'ID de la transaction créée.
-- ============================================================

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

  -- 1. Résoudre le SSYL et vérifier l'accès du user
  SELECT ssyl.id, ssyl.school_id, ssyl.school_year_id, ssyl.student_id
  INTO v_ssyl
  FROM student_school_year_loggings ssyl
  WHERE ssyl.id = p_ssyl_id
    AND ssyl.deleted_at IS NULL
    -- RLS check : superadmin OU staff de cette école
    AND (
      is_admin() OR
      ssyl.school_id = get_school_staff_school_id()
    );

  IF v_ssyl.id IS NULL THEN
    RAISE EXCEPTION 'record_student_payment : SSYL % introuvable ou accès refusé', p_ssyl_id;
  END IF;

  -- 2. Récupérer (ou créer) le compte student_receivable pour ce SSYL
  SELECT id INTO v_receivable_id FROM ledger_accounts
  WHERE kind = 'student_receivable' AND student_ssyl_id = p_ssyl_id LIMIT 1;

  IF v_receivable_id IS NULL THEN
    INSERT INTO ledger_accounts (kind, school_id, student_ssyl_id, school_year_id, name)
    VALUES (
      'student_receivable',
      v_ssyl.school_id,
      p_ssyl_id,
      v_ssyl.school_year_id,
      'Créance élève ' || p_ssyl_id
    )
    RETURNING id INTO v_receivable_id;
  END IF;

  -- 3. Résoudre le compte débit selon la source
  v_debit_kind := CASE p_source
    WHEN 'cash'          THEN 'school_cash'::ledger_account_kind
    WHEN 'bank_transfer' THEN 'school_bank'::ledger_account_kind
    WHEN 'momo'          THEN 'momo_pending'::ledger_account_kind
    ELSE                       'school_cash'::ledger_account_kind
  END;

  SELECT id INTO v_debit_account_id FROM ledger_accounts
  WHERE kind = v_debit_kind AND school_id = v_ssyl.school_id AND school_year_id IS NULL LIMIT 1;

  IF v_debit_account_id IS NULL THEN
    -- Créer le compte manquant à la volée
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

  -- 4. Poster la transaction ledger équilibrée
  v_tx_id := ledger_post_transaction(
    v_ssyl.school_id,
    v_ssyl.school_year_id,
    p_source,
    'paiement',       -- ref_type (pour rester compatible avec les backfills)
    NULL,             -- ref_id : NULL car pas de row paiements sous-jacent
    NULL,             -- external_ref
    COALESCE(p_memo, 'Versement enregistré via app'),
    COALESCE(p_occurred_at, now()),
    jsonb_build_array(
      jsonb_build_object(
        'account_id', v_debit_account_id,
        'direction',  'debit',
        'amount',     p_amount
      ),
      jsonb_build_object(
        'account_id', v_receivable_id,
        'direction',  'credit',
        'amount',     p_amount
      )
    )
  );

  RETURN v_tx_id;
END $$;

GRANT EXECUTE ON FUNCTION record_student_payment(TEXT, BIGINT, ledger_source, TEXT, TIMESTAMPTZ) TO authenticated;
