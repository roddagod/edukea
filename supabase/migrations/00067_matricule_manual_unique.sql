-- =============================================================================
-- 00067 — Matricule saisi manuellement + unicité par école
-- =============================================================================
-- Le matricule est etabli par le Ministere de l'Education, saisi manuellement.
-- Il faut :
--   1. Contrainte UNIQUE (school_id, matricule) — deux ecoles peuvent avoir le
--      meme matricule (leurs propres numerotations), mais pas au sein d'une ecole
--   2. enroll_new_student : accepter le matricule en payload (obligatoire pour
--      les nouvelles inscriptions natives). Fallback next_matricule() retire.
--   3. Verification cote RPC : matricule non vide + unique dans l'ecole
-- =============================================================================

-- 1a. Deduplication defensive : legacy imports peuvent avoir des doublons.
--     On garde le plus ancien avec le matricule original, on suffixe les autres
--     avec '-D2', '-D3', etc. L'ecole pourra corriger via edit fiche eleve.
WITH ranked AS (
  SELECT id,
         school_id,
         matricule,
         ROW_NUMBER() OVER (
           PARTITION BY school_id, matricule
           ORDER BY created_at ASC NULLS LAST, id ASC
         ) AS rn
    FROM students
   WHERE matricule IS NOT NULL AND deleted_at IS NULL
)
UPDATE students s
   SET matricule = ranked.matricule || '-D' || ranked.rn
  FROM ranked
 WHERE s.id = ranked.id
   AND ranked.rn > 1;

-- 1b. Index unique partiel
CREATE UNIQUE INDEX IF NOT EXISTS students_school_matricule_unique
  ON students(school_id, matricule)
  WHERE matricule IS NOT NULL AND deleted_at IS NULL;

-- 2. enroll_new_student : accepter le matricule en payload
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
    'discount_tx_id', v_discount_tx,
    'first_payment_tx_id', v_first_pay_tx
  );
END $function$;

-- 3. Helper RPC : verification cote client pour feedback pre-submit
CREATE OR REPLACE FUNCTION public.check_matricule_available(
  p_school_id text,
  p_matricule text,
  p_exclude_student_id text DEFAULT NULL
) RETURNS boolean
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  IF p_matricule IS NULL OR trim(p_matricule) = '' THEN RETURN false; END IF;
  RETURN NOT EXISTS (
    SELECT 1 FROM students
     WHERE school_id = p_school_id
       AND matricule = trim(p_matricule)
       AND deleted_at IS NULL
       AND (p_exclude_student_id IS NULL OR id <> p_exclude_student_id)
  );
END $function$;

COMMENT ON FUNCTION public.check_matricule_available IS
  'Retourne true si le matricule est disponible dans l''ecole. Excluant optionnel du student en cours d''edition.';
