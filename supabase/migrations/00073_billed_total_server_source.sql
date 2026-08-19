-- =============================================================================
-- 00073 — school_fees_total recalcule serveur (fin de la dependance au payload client)
-- =============================================================================
-- Bug : student_school_year_loggings.school_fees_total etait renseigne
-- exclusivement par la wizard client (payload.billed_total dans
-- enroll_new_student). Consequences :
--
--   1. Si l'utilisateur triche/oublie une categorie de frais, le total est
--      faux -> le recouvrement (v_ssyl_installment_status) l'est aussi.
--   2. Apres un resync des cfi (00071/00072) suite a une modif de config,
--      le school_fees_total reste fige sur l'ancienne config.
--
-- Verifie sur groupe TEST : 4 SSYL / 7 avaient un total desync (jusqu'a
-- 35 000 XOF d'ecart).
--
-- Fix :
--
--   1. Fonction compute_ssyl_billed_total(classroom, type, year) : SUM des
--      installments effectifs, exclut categories optionnelles (canteen /
--      transport). Utilise get_effective_installments_for_year -> couvre le
--      cas ou les cfi ne sont pas encore materialisees.
--
--   2. enroll_new_student ignore desormais payload.billed_total : le total
--      est calcule serveur avant l'INSERT SSYL.
--
--   3. resync_classroom_fees synchronise en cascade school_fees_total des
--      SSYL du couple (classroom, type) apres purge+rematerialisation.
--
--   4. Data cleanup one-shot : UPDATE tous les SSYL actifs avec la valeur
--      serveur (fixe les 4 SSYL desync de TEST + tout equivalent en prod).
-- =============================================================================

-- 1. Helper : total des installments obligatoires
CREATE OR REPLACE FUNCTION public.compute_ssyl_billed_total(
  p_classroom_id     text,
  p_student_type_id  text,
  p_school_year_id   text
) RETURNS bigint
  LANGUAGE plpgsql
  STABLE
  SECURITY INVOKER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_total BIGINT;
BEGIN
  SELECT COALESCE(SUM(amount), 0)::BIGINT INTO v_total
    FROM get_effective_installments_for_year(p_classroom_id, p_student_type_id, p_school_year_id)
   WHERE category NOT IN ('canteen', 'transport');
  RETURN v_total;
END $function$;

COMMENT ON FUNCTION public.compute_ssyl_billed_total IS
  'Total facture d''un SSYL (SUM des installments obligatoires). Source de verite serveur, evite de trust le payload client dans enroll_new_student.';

-- 2. enroll_new_student : recompute server-side du total
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

  -- Matricule : saisi manuellement, unique par ecole, requis
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

  -- Recompute serveur du total facture (parite avec v2 : ne pas trust le client)
  v_billed_total_server := compute_ssyl_billed_total(v_classroom_id, v_type_student_id, v_year_id);
  IF v_billed_total_server = 0 THEN
    RAISE EXCEPTION 'Frais total calcule = 0 pour classe % / type % / annee %. Verifiez la configuration.',
      v_classroom_id, v_type_student_id, v_year_id;
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

  -- 3. INSERT student avec matricule manuel
  v_student_id := gen_random_uuid()::TEXT;
  INSERT INTO students (id, school_id, matricule, firstname, lastname, sex, date_of_birth, place_of_birth, nationality, father_id, mother_id, tutor_id)
  VALUES (
    v_student_id, v_school_id, v_matricule,
    v_student->>'firstname', v_student->>'lastname', v_student->>'sex',
    NULLIF(v_student->>'birthdate','')::TIMESTAMPTZ, v_student->>'birthplace', COALESCE(v_student->>'nationality','Ivoirienne'),
    v_father_id, v_mother_id, v_tutor_id
  );

  -- 4. INSERT SSYL avec le total serveur (ignore v_billed_total_client)
  v_ssyl_id := gen_random_uuid()::TEXT;
  INSERT INTO student_school_year_loggings (
    id, student_id, school_id, school_year_id, classroom_id, school_fees_id, type_student_id,
    repeating, school_fees_total
  ) VALUES (
    v_ssyl_id, v_student_id, v_school_id, v_year_id, v_classroom_id, v_fees_id, v_type_student_id,
    CASE WHEN (v_student->>'redoublant')::BOOLEAN THEN 1 ELSE 0 END,
    v_billed_total_server
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
    'billed_total_server', v_billed_total_server,
    'billed_total_client', v_billed_total_client,
    'discount_tx_id', v_discount_tx,
    'first_payment_tx_id', v_first_pay_tx
  );
END $function$;

-- 3. resync_classroom_fees : synchronise school_fees_total des SSYL impactes
CREATE OR REPLACE FUNCTION public.resync_classroom_fees(
  p_classroom_id text,
  p_student_type_id text,
  p_school_year_id text
) RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_type_uuid UUID;
  v_created INT;
  v_new_total BIGINT;
BEGIN
  BEGIN
    v_type_uuid := p_student_type_id::UUID;
  EXCEPTION WHEN others THEN
    RETURN 0;
  END;

  -- 1. Purge TOUTES les cfi de ce couple (avec ou sans overrides)
  DELETE FROM classroom_fee_installments
   WHERE classroom_id = p_classroom_id
     AND student_type_id = v_type_uuid;

  -- 2. Re-materialise depuis les lfi actuels
  v_created := materialize_classroom_fees(p_classroom_id, p_student_type_id, p_school_year_id);

  -- 3. Recompute school_fees_total des SSYL affectes (annee cible uniquement)
  v_new_total := compute_ssyl_billed_total(p_classroom_id, p_student_type_id, p_school_year_id);

  UPDATE student_school_year_loggings
     SET school_fees_total = v_new_total
   WHERE classroom_id     = p_classroom_id
     AND type_student_id  = p_student_type_id
     AND school_year_id   = p_school_year_id
     AND deleted_at IS NULL;

  RETURN v_created;
END $function$;

COMMENT ON FUNCTION public.resync_classroom_fees IS
  'Purge + re-materialise classroom_fee_installments d''un couple classroom/type. Source de verite = level_fee_installments. Synchronise aussi school_fees_total des SSYL actifs impactes.';

-- 4. Data cleanup : realigner school_fees_total sur la valeur serveur
--    Pour chaque SSYL actif, recompute et UPDATE si divergence.
DO $$
DECLARE
  r RECORD;
  v_expected BIGINT;
  v_fixed INT := 0;
BEGIN
  FOR r IN
    SELECT ssyl.id, ssyl.classroom_id, ssyl.type_student_id, ssyl.school_year_id,
           ssyl.school_fees_total AS current_total
      FROM student_school_year_loggings ssyl
     WHERE ssyl.deleted_at IS NULL
       AND ssyl.type_student_id IS NOT NULL
  LOOP
    BEGIN
      v_expected := compute_ssyl_billed_total(r.classroom_id, r.type_student_id, r.school_year_id);
      IF v_expected IS NOT NULL AND v_expected > 0 AND v_expected <> r.current_total THEN
        UPDATE student_school_year_loggings
           SET school_fees_total = v_expected
         WHERE id = r.id;
        v_fixed := v_fixed + 1;
      END IF;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'compute failed ssyl=% : %', r.id, SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE '00073 data cleanup : % SSYL realignes', v_fixed;
END $$;
