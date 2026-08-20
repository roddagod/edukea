-- =============================================================================
-- 00074 — Garde-fou serveur : interdit d'enregistrer un versement > restant du
-- =============================================================================
-- Parite v2 (Laravel PaiementController@store) : rejet HTTP 400 "Montant trop
-- eleve. Il ne reste que $reste FCFA a payer" si amount > reste.
--
-- Chez nous : le check existait uniquement cote UI (RecordPaymentDialog).
-- Un appel direct via SDK/script/Postman pouvait creer un surplus non ventile.
--
-- Fix :
--
--   1. Fonction compute_ssyl_remaining(ssyl_id) : SUM(amount_due - amount_paid)
--      via v_ssyl_installment_status. amount_paid inclut deja les allocations
--      paiement + discount.
--
--   2. record_student_payment RAISE si p_amount > remaining. Message user-
--      friendly avec le max autorise.
--
--   3. enroll_new_student valide aussi le first_payment.amount avant de le
--      creer -> aucun surplus possible meme lors d'une inscription atomique.
-- =============================================================================

-- 1. Helper : restant du d'un SSYL
CREATE OR REPLACE FUNCTION public.compute_ssyl_remaining(
  p_ssyl_id text
) RETURNS bigint
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_remaining BIGINT;
BEGIN
  SELECT COALESCE(SUM(amount_due - amount_paid), 0)::BIGINT INTO v_remaining
    FROM v_ssyl_installment_status
   WHERE ssyl_id = p_ssyl_id;
  RETURN GREATEST(v_remaining, 0);
END $function$;

COMMENT ON FUNCTION public.compute_ssyl_remaining IS
  'Restant du d''un SSYL : SUM des installments non soldes (amount_due - amount_paid). Inclut deja discount + paiements dans amount_paid.';

GRANT EXECUTE ON FUNCTION public.compute_ssyl_remaining(text) TO authenticated;

-- 2. record_student_payment : guard overpayment
CREATE OR REPLACE FUNCTION public.record_student_payment(
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
  v_remaining BIGINT;
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

  -- Guard overpayment : parite v2 PaiementController@store
  v_remaining := compute_ssyl_remaining(p_ssyl_id);
  IF v_remaining <= 0 THEN
    RAISE EXCEPTION 'Aucun montant restant du pour cet eleve. Le solde est deja a jour.';
  END IF;
  IF p_amount > v_remaining THEN
    RAISE EXCEPTION 'Montant trop eleve. Restant du : % FCFA. Vous avez saisi : % FCFA.',
      v_remaining, p_amount;
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
    'payment',
    p_ssyl_id,
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

-- 3. enroll_new_student : re-declaree pour valider le first_payment
--    (le SSYL vient d'etre cree -> remaining = school_fees_total - discount
--     -> on refuse si first_payment > remaining)
CREATE OR REPLACE FUNCTION public.enroll_new_student(payload jsonb)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_school_id TEXT     := payload->>'school_id';
  v_year_id   TEXT     := payload->>'school_year_id';
  v_classroom_id TEXT  := payload->>'classroom_id';
  v_fees_id   TEXT     := payload->>'school_fees_id';
  v_type_student_id TEXT := payload->>'type_student_id';

  v_student  JSONB := payload->'student';
  v_father   JSONB := payload->'father';
  v_mother   JSONB := payload->'mother';
  v_tutor    JSONB := payload->'tutor';

  v_billed_total_client BIGINT := COALESCE((payload->>'billed_total')::BIGINT, 0);
  v_billed_total_server BIGINT;
  v_discount     JSONB  := payload->'discount';
  v_first_pay    JSONB  := payload->'first_payment';
  v_first_pay_amt BIGINT;
  v_remaining_after_discount BIGINT;

  v_matricule TEXT := payload->'student'->>'matricule';
  v_father_id TEXT;
  v_mother_id TEXT;
  v_tutor_id  TEXT;
  v_student_id TEXT;
  v_ssyl_id TEXT;
  v_discount_tx UUID;
  v_first_pay_tx UUID;
BEGIN
  IF NOT (is_admin() OR get_school_staff_school_id() = v_school_id) THEN
    RAISE EXCEPTION 'enroll_new_student : acces refuse pour school %', v_school_id;
  END IF;

  IF v_school_id IS NULL OR v_year_id IS NULL OR v_classroom_id IS NULL THEN
    RAISE EXCEPTION 'enroll_new_student : school_id + school_year_id + classroom_id requis';
  END IF;

  IF v_type_student_id IS NULL THEN
    RAISE EXCEPTION 'enroll_new_student : type_student_id est requis';
  END IF;
  IF NOT check_fees_configured(v_classroom_id, v_type_student_id) THEN
    RAISE EXCEPTION 'Inscription impossible : aucun frais configure pour la classe % (type %). Configurez les frais dans Rentree > Frais scolarite.', v_classroom_id, v_type_student_id;
  END IF;

  IF v_matricule IS NULL OR trim(v_matricule) = '' THEN
    RAISE EXCEPTION 'Le matricule est requis (etabli par le Ministere de l''Education).';
  END IF;
  v_matricule := trim(v_matricule);
  IF EXISTS (
    SELECT 1 FROM students
     WHERE school_id = v_school_id
       AND matricule = v_matricule
       AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Le matricule "%" est deja utilise dans cette ecole.', v_matricule;
  END IF;

  v_billed_total_server := compute_ssyl_billed_total(v_classroom_id, v_type_student_id, v_year_id);
  IF v_billed_total_server = 0 THEN
    RAISE EXCEPTION 'Frais total calcule = 0 pour classe % / type % / annee %. Verifiez la configuration.',
      v_classroom_id, v_type_student_id, v_year_id;
  END IF;

  -- Guard overpayment sur le first_payment (pre-check avant tx)
  --   remaining apres discount = billed - discount
  --   first_pay ne peut pas depasser
  v_first_pay_amt := COALESCE((v_first_pay->>'amount')::BIGINT, 0);
  IF v_first_pay_amt > 0 THEN
    v_remaining_after_discount := v_billed_total_server
      - COALESCE((v_discount->>'amount')::BIGINT, 0);
    IF v_first_pay_amt > v_remaining_after_discount THEN
      RAISE EXCEPTION 'Premier versement trop eleve. Total facture : % FCFA, remise : % FCFA, restant du : % FCFA. Saisi : % FCFA.',
        v_billed_total_server,
        COALESCE((v_discount->>'amount')::BIGINT, 0),
        v_remaining_after_discount,
        v_first_pay_amt;
    END IF;
  END IF;

  -- Upsert families
  IF v_father IS NOT NULL THEN
    v_father_id := COALESCE(v_father->>'id', gen_random_uuid()::TEXT);
    INSERT INTO families (id, school_id, firstname, lastname, phone, email, job, address, residence)
    VALUES (v_father_id, v_school_id, v_father->>'firstname', v_father->>'lastname', v_father->>'phone', v_father->>'email', v_father->>'job', v_father->>'address', v_father->>'residence')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  IF v_mother IS NOT NULL THEN
    v_mother_id := COALESCE(v_mother->>'id', gen_random_uuid()::TEXT);
    INSERT INTO families (id, school_id, firstname, lastname, phone, email, job, address, residence)
    VALUES (v_mother_id, v_school_id, v_mother->>'firstname', v_mother->>'lastname', v_mother->>'phone', v_mother->>'email', v_mother->>'job', v_mother->>'address', v_mother->>'residence')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  IF v_tutor IS NOT NULL THEN
    v_tutor_id := COALESCE(v_tutor->>'id', gen_random_uuid()::TEXT);
    INSERT INTO families (id, school_id, firstname, lastname, phone, email, job, address, residence)
    VALUES (v_tutor_id, v_school_id, v_tutor->>'firstname', v_tutor->>'lastname', v_tutor->>'phone', v_tutor->>'email', v_tutor->>'job', v_tutor->>'address', v_tutor->>'residence')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  v_student_id := gen_random_uuid()::TEXT;
  INSERT INTO students (id, school_id, matricule, firstname, lastname, sex, date_of_birth, place_of_birth, nationality, father_id, mother_id, tutor_id)
  VALUES (
    v_student_id, v_school_id, v_matricule,
    v_student->>'firstname', v_student->>'lastname', v_student->>'sex',
    NULLIF(v_student->>'birthdate','')::TIMESTAMPTZ, v_student->>'birthplace', COALESCE(v_student->>'nationality','Ivoirienne'),
    v_father_id, v_mother_id, v_tutor_id
  );

  v_ssyl_id := gen_random_uuid()::TEXT;
  INSERT INTO student_school_year_loggings (
    id, student_id, school_id, school_year_id, classroom_id, school_fees_id, type_student_id,
    repeating, school_fees_total
  ) VALUES (
    v_ssyl_id, v_student_id, v_school_id, v_year_id, v_classroom_id, v_fees_id, v_type_student_id,
    CASE WHEN (v_student->>'redoublant')::BOOLEAN THEN 1 ELSE 0 END,
    v_billed_total_server
  );

  IF v_discount IS NOT NULL AND (v_discount->>'amount')::BIGINT > 0 THEN
    v_discount_tx := record_student_discount(
      v_ssyl_id,
      (v_discount->>'amount')::BIGINT,
      COALESCE(v_discount->>'reason', 'reduction'),
      v_discount->>'note'
    );
  END IF;

  IF v_first_pay_amt > 0 THEN
    v_first_pay_tx := record_student_payment(
      v_ssyl_id,
      v_first_pay_amt,
      (v_first_pay->>'source')::ledger_source,
      v_first_pay->>'memo',
      NULL
    );
  END IF;

  RETURN jsonb_build_object(
    'student_id', v_student_id,
    'ssyl_id', v_ssyl_id,
    'matricule', v_matricule,
    'billed_total_server', v_billed_total_server,
    'billed_total_client', v_billed_total_client,
    'discount_tx_id', v_discount_tx,
    'first_payment_tx_id', v_first_pay_tx
  );
END $function$;
