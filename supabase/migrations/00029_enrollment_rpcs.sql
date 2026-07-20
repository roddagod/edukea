-- ============================================================
-- RPCs pour le module Inscription / Réinscription / Passage
--   - enroll_new_student(payload) : crée un nouvel élève complet
--   - reenroll_student(payload) : réinscrit un élève existant
--   - bulk_advance_year(payload) : batch passage année N -> N+1
--
-- Toutes SECURITY DEFINER, atomiques (une seule transaction), retournent JSONB.
-- Vérifient l'accès via is_admin() OR get_school_staff_school_id() = school_id.
-- ============================================================

-- ==================== enroll_new_student ====================

CREATE OR REPLACE FUNCTION enroll_new_student(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

  v_billed_total BIGINT := COALESCE((payload->>'billed_total')::BIGINT, 0);
  v_discount     JSONB  := payload->'discount';        -- { amount, reason, note } OU null
  v_first_pay    JSONB  := payload->'first_payment';   -- { amount, source, memo } OU null

  v_father_id TEXT;
  v_mother_id TEXT;
  v_tutor_id  TEXT;
  v_student_id TEXT;
  v_matricule TEXT;
  v_ssyl_id TEXT;
  v_receivable_id UUID;
  v_revenue_id UUID;
  v_discount_id UUID;
  v_opening_tx UUID;
  v_discount_tx UUID;
  v_first_pay_tx UUID;
BEGIN
  -- 1. Vérification d'accès
  IF NOT (is_admin() OR get_school_staff_school_id() = v_school_id) THEN
    RAISE EXCEPTION 'enroll_new_student : accès refusé pour school %', v_school_id;
  END IF;

  IF v_school_id IS NULL OR v_year_id IS NULL OR v_classroom_id IS NULL THEN
    RAISE EXCEPTION 'enroll_new_student : school_id + school_year_id + classroom_id requis';
  END IF;

  -- 2. Upsert families (père / mère / tuteur)
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

  -- 3. Générer matricule + INSERT student
  --    Note : la table utilise date_of_birth / place_of_birth (schéma v2)
  v_matricule := next_matricule(v_school_id, v_year_id);
  v_student_id := gen_random_uuid()::TEXT;
  INSERT INTO students (id, school_id, matricule, firstname, lastname, sex, date_of_birth, place_of_birth, nationality, father_id, mother_id, tutor_id)
  VALUES (
    v_student_id, v_school_id, v_matricule,
    v_student->>'firstname', v_student->>'lastname', v_student->>'sex',
    NULLIF(v_student->>'birthdate','')::TIMESTAMPTZ, v_student->>'birthplace', COALESCE(v_student->>'nationality','Ivoirienne'),
    v_father_id, v_mother_id, v_tutor_id
  );

  -- 4. INSERT SSYL
  v_ssyl_id := gen_random_uuid()::TEXT;
  INSERT INTO student_school_year_loggings (
    id, student_id, school_id, school_year_id, classroom_id, school_fees_id, type_student_id,
    school_fees_total, is_first_register, repeating, registration_date
  ) VALUES (
    v_ssyl_id, v_student_id, v_school_id, v_year_id, v_classroom_id, v_fees_id, v_type_student_id,
    v_billed_total, 1,
    CASE WHEN (v_student->>'redoublant')::BOOLEAN THEN 1 ELSE 0 END,
    CURRENT_DATE
  );

  -- 5. Ledger : opening balance (dette scolarité)
  --    Créer compte student_receivable
  INSERT INTO ledger_accounts (kind, school_id, student_ssyl_id, school_year_id, name)
  VALUES ('student_receivable', v_school_id, v_ssyl_id, v_year_id, 'Créance ' || v_matricule)
  RETURNING id INTO v_receivable_id;

  --    Récupérer/créer compte revenue_school_fees pour l'année
  SELECT id INTO v_revenue_id FROM ledger_accounts
    WHERE kind = 'revenue_school_fees' AND school_id = v_school_id AND school_year_id = v_year_id LIMIT 1;
  IF v_revenue_id IS NULL THEN
    INSERT INTO ledger_accounts (kind, school_id, school_year_id, name)
    VALUES ('revenue_school_fees', v_school_id, v_year_id, 'Produits scolarité')
    RETURNING id INTO v_revenue_id;
  END IF;

  --    Poster la tx opening
  IF v_billed_total > 0 THEN
    v_opening_tx := ledger_post_transaction(
      v_school_id, v_year_id, 'opening_balance', 'opening', v_ssyl_id, NULL,
      'Facturation inscription ' || v_matricule, now(),
      jsonb_build_array(
        jsonb_build_object('account_id', v_receivable_id, 'direction', 'debit',  'amount', v_billed_total),
        jsonb_build_object('account_id', v_revenue_id,    'direction', 'credit', 'amount', v_billed_total)
      )
    );
  END IF;

  -- 6. Remise optionnelle (Debit discount, Credit receivable — annule une partie de la dette)
  IF v_discount IS NOT NULL AND (v_discount->>'amount')::BIGINT > 0 THEN
    SELECT id INTO v_discount_id FROM ledger_accounts
      WHERE kind = 'discount' AND school_id = v_school_id AND school_year_id = v_year_id LIMIT 1;
    IF v_discount_id IS NULL THEN
      INSERT INTO ledger_accounts (kind, school_id, school_year_id, name)
      VALUES ('discount', v_school_id, v_year_id, 'Remises accordées')
      RETURNING id INTO v_discount_id;
    END IF;
    v_discount_tx := ledger_post_transaction(
      v_school_id, v_year_id, 'internal', 'discount', v_ssyl_id, NULL,
      'Remise ' || COALESCE(v_discount->>'reason','') || COALESCE(' — ' || (v_discount->>'note'), ''),
      now(),
      jsonb_build_array(
        jsonb_build_object('account_id', v_discount_id,   'direction', 'debit',  'amount', (v_discount->>'amount')::BIGINT),
        jsonb_build_object('account_id', v_receivable_id, 'direction', 'credit', 'amount', (v_discount->>'amount')::BIGINT)
      )
    );
  END IF;

  -- 7. Premier versement optionnel (via record_student_payment pour cohérence)
  IF v_first_pay IS NOT NULL AND (v_first_pay->>'amount')::BIGINT > 0 THEN
    v_first_pay_tx := record_student_payment(
      v_ssyl_id,
      (v_first_pay->>'amount')::BIGINT,
      COALESCE(v_first_pay->>'source', 'cash')::ledger_source,
      v_first_pay->>'memo',
      now()
    );
  END IF;

  RETURN jsonb_build_object(
    'student_id',      v_student_id,
    'ssyl_id',         v_ssyl_id,
    'matricule',       v_matricule,
    'opening_tx_id',   v_opening_tx,
    'discount_tx_id',  v_discount_tx,
    'first_payment_tx_id', v_first_pay_tx
  );
END $$;

GRANT EXECUTE ON FUNCTION enroll_new_student(JSONB) TO authenticated;

-- ==================== reenroll_student ====================

CREATE OR REPLACE FUNCTION reenroll_student(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_existing_student_id TEXT := payload->>'existing_student_id';
  v_school_id TEXT     := payload->>'school_id';
  v_year_id   TEXT     := payload->>'school_year_id';
  v_classroom_id TEXT  := payload->>'classroom_id';
  v_fees_id   TEXT     := payload->>'school_fees_id';
  v_billed_total BIGINT := COALESCE((payload->>'billed_total')::BIGINT, 0);
  v_discount JSONB := payload->'discount';
  v_first_pay JSONB := payload->'first_payment';
  v_prev_ssyl_id TEXT := payload->>'previous_ssyl_id';   -- Optional : trace la transition

  v_new_ssyl_id TEXT;
  v_receivable_id UUID;
  v_revenue_id UUID;
  v_discount_id UUID;
  v_opening_tx UUID;
  v_discount_tx UUID;
  v_first_pay_tx UUID;
BEGIN
  IF NOT (is_admin() OR get_school_staff_school_id() = v_school_id) THEN
    RAISE EXCEPTION 'reenroll_student : accès refusé';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM students WHERE id = v_existing_student_id AND school_id = v_school_id) THEN
    RAISE EXCEPTION 'reenroll_student : élève % introuvable dans école %', v_existing_student_id, v_school_id;
  END IF;

  v_new_ssyl_id := gen_random_uuid()::TEXT;
  INSERT INTO student_school_year_loggings (
    id, student_id, school_id, school_year_id, classroom_id, school_fees_id,
    school_fees_total, is_first_register, repeating, registration_date
  ) VALUES (
    v_new_ssyl_id, v_existing_student_id, v_school_id, v_year_id, v_classroom_id, v_fees_id,
    v_billed_total, 0, 0, CURRENT_DATE
  );

  -- Ledger opening balance (identique à enroll_new_student)
  INSERT INTO ledger_accounts (kind, school_id, student_ssyl_id, school_year_id, name)
  VALUES ('student_receivable', v_school_id, v_new_ssyl_id, v_year_id, 'Créance réinscription ' || v_existing_student_id)
  RETURNING id INTO v_receivable_id;

  SELECT id INTO v_revenue_id FROM ledger_accounts
    WHERE kind = 'revenue_school_fees' AND school_id = v_school_id AND school_year_id = v_year_id LIMIT 1;
  IF v_revenue_id IS NULL THEN
    INSERT INTO ledger_accounts (kind, school_id, school_year_id, name)
    VALUES ('revenue_school_fees', v_school_id, v_year_id, 'Produits scolarité')
    RETURNING id INTO v_revenue_id;
  END IF;

  IF v_billed_total > 0 THEN
    v_opening_tx := ledger_post_transaction(
      v_school_id, v_year_id, 'opening_balance', 'opening', v_new_ssyl_id, NULL,
      'Facturation réinscription', now(),
      jsonb_build_array(
        jsonb_build_object('account_id', v_receivable_id, 'direction', 'debit',  'amount', v_billed_total),
        jsonb_build_object('account_id', v_revenue_id,    'direction', 'credit', 'amount', v_billed_total)
      )
    );
  END IF;

  -- Remise + premier versement (mêmes patterns qu'enroll_new_student)
  IF v_discount IS NOT NULL AND (v_discount->>'amount')::BIGINT > 0 THEN
    SELECT id INTO v_discount_id FROM ledger_accounts
      WHERE kind = 'discount' AND school_id = v_school_id AND school_year_id = v_year_id LIMIT 1;
    IF v_discount_id IS NULL THEN
      INSERT INTO ledger_accounts (kind, school_id, school_year_id, name)
      VALUES ('discount', v_school_id, v_year_id, 'Remises accordées')
      RETURNING id INTO v_discount_id;
    END IF;
    v_discount_tx := ledger_post_transaction(
      v_school_id, v_year_id, 'internal', 'discount', v_new_ssyl_id, NULL,
      'Remise réinscription', now(),
      jsonb_build_array(
        jsonb_build_object('account_id', v_discount_id,   'direction', 'debit',  'amount', (v_discount->>'amount')::BIGINT),
        jsonb_build_object('account_id', v_receivable_id, 'direction', 'credit', 'amount', (v_discount->>'amount')::BIGINT)
      )
    );
  END IF;

  IF v_first_pay IS NOT NULL AND (v_first_pay->>'amount')::BIGINT > 0 THEN
    v_first_pay_tx := record_student_payment(
      v_new_ssyl_id, (v_first_pay->>'amount')::BIGINT,
      COALESCE(v_first_pay->>'source','cash')::ledger_source,
      v_first_pay->>'memo', now()
    );
  END IF;

  -- Trace la transition (audit) si previous_ssyl_id fourni
  IF v_prev_ssyl_id IS NOT NULL THEN
    INSERT INTO enrollment_transitions (student_id, from_ssyl_id, to_ssyl_id, decision, decided_by, from_year_id, to_year_id)
    SELECT v_existing_student_id, v_prev_ssyl_id, v_new_ssyl_id, 'advance', auth.uid(), pss.school_year_id, v_year_id
    FROM student_school_year_loggings pss WHERE pss.id = v_prev_ssyl_id;
  END IF;

  RETURN jsonb_build_object(
    'ssyl_id', v_new_ssyl_id,
    'opening_tx_id', v_opening_tx,
    'discount_tx_id', v_discount_tx,
    'first_payment_tx_id', v_first_pay_tx
  );
END $$;

GRANT EXECUTE ON FUNCTION reenroll_student(JSONB) TO authenticated;

-- ==================== bulk_advance_year ====================

CREATE OR REPLACE FUNCTION bulk_advance_year(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_school_id TEXT := payload->>'school_id';
  v_from_year_id TEXT := payload->>'from_year_id';
  v_to_year_id TEXT := payload->>'to_year_id';
  v_plan JSONB := payload->'plan';    -- Array of { ssyl_id, decision, target_classroom_id, target_fees_id, billed_total }

  v_row JSONB;
  v_from_ssyl RECORD;
  v_new_ssyl_id TEXT;
  v_n_advance INT := 0;
  v_n_repeat INT := 0;
  v_n_leave INT := 0;
  v_n_pending INT := 0;
BEGIN
  IF NOT (is_admin() OR get_school_staff_school_id() = v_school_id) THEN
    RAISE EXCEPTION 'bulk_advance_year : accès refusé';
  END IF;

  IF v_plan IS NULL OR jsonb_array_length(v_plan) = 0 THEN
    RAISE EXCEPTION 'bulk_advance_year : plan vide';
  END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(v_plan) LOOP
    -- Récupérer le SSYL source
    SELECT id, student_id, classroom_id, school_year_id INTO v_from_ssyl
    FROM student_school_year_loggings
    WHERE id = v_row->>'ssyl_id' AND school_id = v_school_id AND school_year_id = v_from_year_id;

    IF v_from_ssyl.id IS NULL THEN CONTINUE; END IF;

    IF v_row->>'decision' IN ('advance', 'repeat') THEN
      -- Créer nouveau SSYL année cible (utilise reenroll_student mais sans versement/remise en batch)
      SELECT (reenroll_student(jsonb_build_object(
        'existing_student_id', v_from_ssyl.student_id,
        'school_id',           v_school_id,
        'school_year_id',      v_to_year_id,
        'classroom_id',        v_row->>'target_classroom_id',
        'school_fees_id',      v_row->>'target_fees_id',
        'billed_total',        COALESCE((v_row->>'billed_total')::BIGINT, 0),
        'previous_ssyl_id',    v_from_ssyl.id
      ))->>'ssyl_id') INTO v_new_ssyl_id;

      INSERT INTO enrollment_transitions (student_id, from_ssyl_id, to_ssyl_id, decision, from_classroom_id, to_classroom_id, from_year_id, to_year_id, decided_by)
      VALUES (v_from_ssyl.student_id, v_from_ssyl.id, v_new_ssyl_id, v_row->>'decision', v_from_ssyl.classroom_id, v_row->>'target_classroom_id', v_from_year_id, v_to_year_id, auth.uid());

      IF v_row->>'decision' = 'advance' THEN v_n_advance := v_n_advance + 1;
      ELSE v_n_repeat := v_n_repeat + 1; END IF;

    ELSIF v_row->>'decision' = 'leave' THEN
      INSERT INTO enrollment_transitions (student_id, from_ssyl_id, decision, from_classroom_id, from_year_id, to_year_id, decided_by)
      VALUES (v_from_ssyl.student_id, v_from_ssyl.id, 'leave', v_from_ssyl.classroom_id, v_from_year_id, v_to_year_id, auth.uid());
      v_n_leave := v_n_leave + 1;

    ELSE
      -- pending : trace uniquement, pas d'action
      INSERT INTO enrollment_transitions (student_id, from_ssyl_id, decision, from_classroom_id, from_year_id, to_year_id, decided_by)
      VALUES (v_from_ssyl.student_id, v_from_ssyl.id, 'pending', v_from_ssyl.classroom_id, v_from_year_id, v_to_year_id, auth.uid());
      v_n_pending := v_n_pending + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'advance', v_n_advance,
    'repeat',  v_n_repeat,
    'leave',   v_n_leave,
    'pending', v_n_pending
  );
END $$;

GRANT EXECUTE ON FUNCTION bulk_advance_year(JSONB) TO authenticated;
