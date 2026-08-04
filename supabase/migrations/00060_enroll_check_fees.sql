-- =============================================================================
-- 00060 — enroll_new_student : bloquer si frais non configures
-- =============================================================================
-- Defense en profondeur : le UI bloque deja le bouton Suivant, mais on ajoute
-- aussi le check cote RPC pour eviter tout bypass (ex: script API direct).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_fees_configured(
  p_classroom_id text,
  p_type_student_id text
) RETURNS boolean
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_level_id TEXT;
  v_count INT;
BEGIN
  IF p_classroom_id IS NULL OR p_type_student_id IS NULL THEN RETURN false; END IF;
  SELECT level_id INTO v_level_id FROM classrooms WHERE id = p_classroom_id;
  IF v_level_id IS NULL THEN RETURN false; END IF;
  SELECT COUNT(*) INTO v_count FROM (
    SELECT 1 FROM classroom_fee_installments
      WHERE classroom_id = p_classroom_id AND student_type_id::text = p_type_student_id
    UNION ALL
    SELECT 1 FROM level_fee_installments
      WHERE level_id = v_level_id AND student_type_id::text = p_type_student_id
  ) x LIMIT 1;
  RETURN v_count > 0;
END $function$;

-- Patch enroll_new_student : ajouter le check apres les verifications d'acces.
-- On recupere le corps existant et on injecte un RAISE juste apres v_year_id null check.
-- Approche : redefinir la fonction en entier avec le check en plus (les autres parties
-- restent identiques a la version deployee actuelle).
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

  v_billed_total BIGINT := COALESCE((payload->>'billed_total')::BIGINT, 0);
  v_discount     JSONB  := payload->'discount';
  v_first_pay    JSONB  := payload->'first_payment';

  v_father_id TEXT;
  v_mother_id TEXT;
  v_tutor_id  TEXT;
  v_student_id TEXT;
  v_matricule TEXT;
  v_ssyl_id TEXT;
  v_opening_tx UUID;
  v_discount_tx UUID;
  v_first_pay_tx UUID;
BEGIN
  IF NOT (is_admin() OR get_school_staff_school_id() = v_school_id) THEN
    RAISE EXCEPTION 'enroll_new_student : acces refuse pour school %', v_school_id;
  END IF;

  IF v_school_id IS NULL OR v_year_id IS NULL OR v_classroom_id IS NULL THEN
    RAISE EXCEPTION 'enroll_new_student : school_id + school_year_id + classroom_id requis';
  END IF;

  -- Nouveau check : frais configures pour la combo classe x type d'eleve
  IF v_type_student_id IS NULL THEN
    RAISE EXCEPTION 'enroll_new_student : type_student_id est requis';
  END IF;
  IF NOT check_fees_configured(v_classroom_id, v_type_student_id) THEN
    RAISE EXCEPTION 'Inscription impossible : aucun frais configure pour la classe % (type %). Configurez les frais dans Rentree > Frais scolarite.', v_classroom_id, v_type_student_id;
  END IF;

  -- 2. Upsert families
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

  -- 3. Generer matricule + INSERT student
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
    repeating, school_fees_total
  ) VALUES (
    v_ssyl_id, v_student_id, v_school_id, v_year_id, v_classroom_id, v_fees_id, v_type_student_id,
    CASE WHEN (v_student->>'redoublant')::BOOLEAN THEN 1 ELSE 0 END,
    v_billed_total
  );

  -- 5. Discount (optional)
  IF v_discount IS NOT NULL AND (v_discount->>'amount')::BIGINT > 0 THEN
    v_discount_tx := record_student_discount(
      v_ssyl_id,
      (v_discount->>'amount')::BIGINT,
      COALESCE(v_discount->>'reason', 'reduction'),
      v_discount->>'note'
    );
  END IF;

  -- 6. First payment (optional)
  IF v_first_pay IS NOT NULL AND (v_first_pay->>'amount')::BIGINT > 0 THEN
    v_first_pay_tx := record_student_payment(
      v_ssyl_id,
      (v_first_pay->>'amount')::BIGINT,
      (v_first_pay->>'source')::ledger_source,
      v_first_pay->>'memo',
      NULL
    );
  END IF;

  RETURN jsonb_build_object(
    'student_id', v_student_id,
    'ssyl_id', v_ssyl_id,
    'matricule', v_matricule,
    'opening_tx_id', v_opening_tx,
    'discount_tx_id', v_discount_tx,
    'first_payment_tx_id', v_first_pay_tx
  );
END $function$;
