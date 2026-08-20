-- =============================================================================
-- 00076 — Discount visible dans historique paiements + calendrier echeances
-- =============================================================================
-- Bug (signale par user en beta) : la remise appliquee lors de l'inscription
-- (ou post-inscription) n'apparaissait ni dans l'historique de paiement ni
-- dans le calendrier des echeances.
--
-- Causes :
--
--   1. record_student_discount INSERT dans ledger_transactions SANS creer
--      d'entries -> le tx est "vide", pas visible dans useStudentPaymentHistory
--      (qui lit ledger_entries CREDIT sur student_receivable).
--
--   2. Aucune allocation vers cfi n'est creee -> v_ssyl_installment_status
--      ne voit pas le discount dans amount_paid, donc calendrier n'affiche
--      pas le paiement partiel/complet des echeances.
--
--   3. UPDATE ssyl.school_fees_total en direct = double comptage depuis 00073
--      (compute_ssyl_billed_total recompute serveur depuis les cfi).
--
-- Fix :
--
--   * Utilise ledger_post_transaction pour poser tx + entries atomiquement
--     (parite avec record_student_payment).
--   * Cree les allocations FIFO via allocate_payment_to_installments (comme
--     un versement).
--   * Ne modifie plus ssyl.school_fees_total (recompute serveur = source de
--     verite). Garde le champ ssyl.discount pour audit / retrocompat.
--   * Le compte 'discount' (revenu inverse) est debite, student_receivable
--     credite -> equilibre comptable respecte.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.record_student_discount(
  p_ssyl_id TEXT,
  p_amount  BIGINT,
  p_reason  TEXT DEFAULT 'reduction',
  p_note    TEXT DEFAULT NULL
) RETURNS UUID
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_ssyl RECORD;
  v_receivable_id UUID;
  v_discount_account_id UUID;
  v_tx_id UUID;
  v_remaining BIGINT;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'record_student_discount : montant doit etre > 0';
  END IF;

  SELECT ssyl.id, ssyl.school_id, ssyl.school_year_id, ssyl.student_id
    INTO v_ssyl
    FROM student_school_year_loggings ssyl
   WHERE ssyl.id = p_ssyl_id
     AND ssyl.deleted_at IS NULL
     AND (is_admin() OR ssyl.school_id = get_school_staff_school_id());

  IF v_ssyl.id IS NULL THEN
    RAISE EXCEPTION 'record_student_discount : SSYL % introuvable ou acces refuse', p_ssyl_id;
  END IF;

  -- Guard : discount ne peut pas depasser le restant du (parite payment)
  v_remaining := compute_ssyl_remaining(p_ssyl_id);
  IF p_amount > v_remaining THEN
    RAISE EXCEPTION 'Remise trop elevee. Restant du : % FCFA. Vous avez saisi : % FCFA.',
      v_remaining, p_amount;
  END IF;

  -- Recuperer / creer le compte student_receivable de ce SSYL
  SELECT id INTO v_receivable_id FROM ledger_accounts
   WHERE kind = 'student_receivable' AND student_ssyl_id = p_ssyl_id LIMIT 1;

  IF v_receivable_id IS NULL THEN
    INSERT INTO ledger_accounts (kind, school_id, student_ssyl_id, school_year_id, name)
    VALUES ('student_receivable', v_ssyl.school_id, p_ssyl_id, v_ssyl.school_year_id, 'Créance élève ' || p_ssyl_id)
    RETURNING id INTO v_receivable_id;
  END IF;

  -- Compte discount (par ecole, non lie a un SSYL)
  SELECT id INTO v_discount_account_id FROM ledger_accounts
   WHERE kind = 'discount' AND school_id = v_ssyl.school_id AND school_year_id IS NULL LIMIT 1;

  IF v_discount_account_id IS NULL THEN
    INSERT INTO ledger_accounts (kind, school_id, school_year_id, name)
    VALUES ('discount', v_ssyl.school_id, NULL, 'Remises accordées')
    RETURNING id INTO v_discount_account_id;
  END IF;

  -- Pose tx + entries atomiquement via helper
  v_tx_id := ledger_post_transaction(
    v_ssyl.school_id,
    v_ssyl.school_year_id,
    'internal'::ledger_source,
    'discount',       -- ref_type distinct de 'payment'
    p_ssyl_id,
    NULL,
    'Remise : ' || COALESCE(p_reason, 'reduction') || COALESCE(' — ' || p_note, ''),
    now(),
    jsonb_build_array(
      jsonb_build_object('account_id', v_discount_account_id, 'direction', 'debit',  'amount', p_amount),
      jsonb_build_object('account_id', v_receivable_id,       'direction', 'credit', 'amount', p_amount)
    )
  );

  -- Ventile FIFO sur les cfi (comme un paiement) -> discount visible dans
  -- v_ssyl_installment_status.amount_paid, calendrier affiche le paiement.
  PERFORM allocate_payment_to_installments(p_ssyl_id, v_tx_id, p_amount);

  -- Audit : garde ssyl.discount pour tracabilite. Ne touche PAS a
  -- school_fees_total (recompute serveur = source de verite depuis 00073).
  UPDATE student_school_year_loggings
     SET discount = COALESCE(discount, 0) + p_amount
   WHERE id = p_ssyl_id;

  RETURN v_tx_id;
END $function$;

GRANT EXECUTE ON FUNCTION record_student_discount(TEXT, BIGINT, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.record_student_discount IS
  'Enregistre une remise : tx ledger internal source, entries debit(discount)+credit(receivable), allocation FIFO cfi. Visible dans historique + calendrier au meme titre qu''un versement. ssyl.discount incremente pour audit.';

-- =============================================================================
-- Backfill : re-ventiler les discounts anciens pour visibilite retroactive
-- =============================================================================
DO $$
DECLARE
  r RECORD;
  v_amount BIGINT;
  v_alloc_exists BOOLEAN;
BEGIN
  FOR r IN
    SELECT lt.id AS tx_id, lt.ref_id AS ssyl_id
      FROM ledger_transactions lt
     WHERE lt.ref_type = 'discount'
       AND lt.status = 'posted'
  LOOP
    -- Deja alloue ? On skip
    SELECT EXISTS (
      SELECT 1 FROM payment_allocations pa WHERE pa.payment_tx_id = r.tx_id
    ) INTO v_alloc_exists;
    IF v_alloc_exists THEN CONTINUE; END IF;

    -- Recuperer le montant depuis les entries (debit side)
    SELECT COALESCE(SUM(le.amount), 0)::BIGINT INTO v_amount
      FROM ledger_entries le
     WHERE le.transaction_id = r.tx_id AND le.direction = 'debit';

    IF v_amount > 0 THEN
      BEGIN
        PERFORM allocate_payment_to_installments(r.ssyl_id, r.tx_id, v_amount);
      EXCEPTION WHEN others THEN
        RAISE NOTICE 'backfill discount tx=% ssyl=% skip : %', r.tx_id, r.ssyl_id, SQLERRM;
      END;
    END IF;
  END LOOP;
END $$;
