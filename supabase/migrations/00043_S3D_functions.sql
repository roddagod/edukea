-- =========================================================================
-- Migration 00043 — Fonctions SQL (state machine bulletins + ventilation paiements) (S3D fondations)
-- =========================================================================

-- 1. State machine bulletin
CREATE OR REPLACE FUNCTION advance_bulletin_status(
  p_bulletin_id UUID,
  p_target_status TEXT,
  p_actor_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_bulletin RECORD;
  v_missing_appreciations INT;
  v_snapshot JSONB;
  v_new_version INT;
BEGIN
  SELECT * INTO v_bulletin FROM bulletins WHERE id = p_bulletin_id FOR UPDATE;

  IF v_bulletin.id IS NULL THEN
    RAISE EXCEPTION 'advance_bulletin_status : bulletin % introuvable', p_bulletin_id;
  END IF;

  IF NOT (
    (v_bulletin.status = 'draft'          AND p_target_status = 'ready_censeur') OR
    (v_bulletin.status = 'ready_censeur'  AND p_target_status = 'ready_director') OR
    (v_bulletin.status = 'ready_director' AND p_target_status = 'published') OR
    (v_bulletin.status = 'published'      AND p_target_status = 'draft')
  ) THEN
    RAISE EXCEPTION 'Transition non autorisée : % → %', v_bulletin.status, p_target_status;
  END IF;

  IF p_target_status = 'ready_censeur' THEN
    SELECT COUNT(*) INTO v_missing_appreciations
    FROM bulletin_subjects bs
    WHERE bs.bulletin_id = p_bulletin_id
      AND (bs.teacher_appreciation IS NULL OR bs.teacher_appreciation = '');

    IF v_missing_appreciations > 0 AND p_reason IS NULL THEN
      RAISE EXCEPTION 'Appréciations manquantes (% matières). Fournir une raison pour override directeur.', v_missing_appreciations;
    END IF;
  END IF;

  IF p_target_status = 'draft' AND (p_reason IS NULL OR p_reason = '') THEN
    RAISE EXCEPTION 'Ré-ouverture requiert une raison écrite.';
  END IF;

  UPDATE bulletins SET
    status = p_target_status,
    updated_at = now(),
    finalized_by = CASE WHEN p_target_status = 'ready_censeur' THEN p_actor_id ELSE finalized_by END,
    finalized_at = CASE WHEN p_target_status = 'ready_censeur' THEN now() ELSE finalized_at END,
    validated_by = CASE WHEN p_target_status = 'ready_director' THEN p_actor_id ELSE validated_by END,
    validated_at = CASE WHEN p_target_status = 'ready_director' THEN now() ELSE validated_at END,
    published_by = CASE WHEN p_target_status = 'published' THEN p_actor_id ELSE published_by END,
    published_at = CASE WHEN p_target_status = 'published' THEN now() ELSE published_at END
  WHERE id = p_bulletin_id;

  IF p_target_status = 'published' THEN
    v_new_version := v_bulletin.current_version;

    SELECT jsonb_build_object(
      'bulletin', row_to_json(b),
      'subjects', (SELECT jsonb_agg(row_to_json(bs)) FROM bulletin_subjects bs WHERE bs.bulletin_id = b.id)
    ) INTO v_snapshot
    FROM bulletins b WHERE b.id = p_bulletin_id;

    INSERT INTO bulletin_versions (bulletin_id, version_number, snapshot, published_by, reason_for_edit)
    VALUES (p_bulletin_id, v_new_version, v_snapshot, p_actor_id, p_reason);
  END IF;

  IF p_target_status = 'draft' AND v_bulletin.status = 'published' THEN
    UPDATE bulletins SET current_version = current_version + 1 WHERE id = p_bulletin_id;
  END IF;

  RETURN p_bulletin_id;
END $$;

GRANT EXECUTE ON FUNCTION advance_bulletin_status(UUID, TEXT, UUID, TEXT) TO authenticated;

-- 2. Ventilation automatique des paiements (FIFO due_date)
CREATE OR REPLACE FUNCTION allocate_payment_to_installments(
  p_ssyl_id TEXT,
  p_payment_tx_id UUID,
  p_amount BIGINT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_installment RECORD;
  v_payment_left BIGINT := p_amount;
  v_to_allocate BIGINT;
  v_breakdown JSONB := '[]'::jsonb;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'allocate_payment : montant doit être > 0';
  END IF;

  IF EXISTS (SELECT 1 FROM payment_allocations WHERE payment_tx_id = p_payment_tx_id) THEN
    RAISE NOTICE 'Payment tx % déjà ventilé, skip', p_payment_tx_id;
    RETURN v_breakdown;
  END IF;

  FOR v_installment IN
    SELECT
      vsi.installment_id,
      vsi.amount_due,
      vsi.amount_paid,
      vsi.amount_due - vsi.amount_paid AS remaining_due
    FROM v_ssyl_installment_status vsi
    WHERE vsi.ssyl_id = p_ssyl_id
      AND vsi.status IN ('overdue', 'due', 'partial', 'future')
      AND (vsi.amount_due - vsi.amount_paid) > 0
    ORDER BY vsi.due_date ASC
  LOOP
    EXIT WHEN v_payment_left <= 0;

    v_to_allocate := LEAST(v_payment_left, v_installment.remaining_due::BIGINT);

    INSERT INTO payment_allocations (payment_tx_id, fee_installment_id, allocated_amount)
    VALUES (p_payment_tx_id, v_installment.installment_id, v_to_allocate);

    v_breakdown := v_breakdown || jsonb_build_object(
      'installment_id', v_installment.installment_id,
      'allocated', v_to_allocate,
      'remaining_after', v_installment.remaining_due - v_to_allocate
    );

    v_payment_left := v_payment_left - v_to_allocate;
  END LOOP;

  IF v_payment_left > 0 THEN
    INSERT INTO payment_allocations (payment_tx_id, fee_installment_id, allocated_amount)
    VALUES (p_payment_tx_id, NULL, v_payment_left);

    v_breakdown := v_breakdown || jsonb_build_object(
      'installment_id', NULL,
      'allocated', v_payment_left,
      'note', 'surplus'
    );
  END IF;

  RETURN v_breakdown;
END $$;

GRANT EXECUTE ON FUNCTION allocate_payment_to_installments(TEXT, UUID, BIGINT) TO authenticated;

-- 3. Seed pédagogie depuis template
CREATE OR REPLACE FUNCTION seed_pedagogy_for_school(
  p_school_id TEXT,
  p_cycle_code TEXT
) RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_group_id UUID;
  v_template RECORD;
  v_count INT := 0;
BEGIN
  FOR v_template IN
    SELECT * FROM subject_templates WHERE cycle_code = p_cycle_code ORDER BY "order"
  LOOP
    SELECT id INTO v_group_id FROM subject_groups
    WHERE school_id = p_school_id AND name = v_template.default_group_name LIMIT 1;

    IF v_group_id IS NULL THEN
      INSERT INTO subject_groups (school_id, name, "order")
      VALUES (p_school_id, v_template.default_group_name, v_count)
      RETURNING id INTO v_group_id;
    END IF;

    INSERT INTO subjects (school_id, group_id, name, coefficient)
    VALUES (p_school_id, v_group_id, v_template.name, v_template.default_coefficient)
    ON CONFLICT DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END $$;

GRANT EXECUTE ON FUNCTION seed_pedagogy_for_school(TEXT, TEXT) TO authenticated;

-- 4. Seed structure depuis template
CREATE OR REPLACE FUNCTION seed_structure_for_school(
  p_school_id TEXT,
  p_template_key TEXT
) RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cycle_id TEXT;
  v_template RECORD;
  v_count INT := 0;
BEGIN
  FOR v_template IN
    SELECT DISTINCT cycle_code, cycle_name FROM structure_templates WHERE template_key = p_template_key
  LOOP
    SELECT id INTO v_cycle_id FROM cycles
    WHERE school_id = p_school_id AND name = v_template.cycle_name LIMIT 1;

    IF v_cycle_id IS NULL THEN
      v_cycle_id := p_school_id || '-' || v_template.cycle_code;
      INSERT INTO cycles (id, school_id, name)
      VALUES (v_cycle_id, p_school_id, v_template.cycle_name)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  FOR v_template IN
    SELECT * FROM structure_templates WHERE template_key = p_template_key ORDER BY level_order
  LOOP
    SELECT id INTO v_cycle_id FROM cycles
    WHERE school_id = p_school_id AND name = v_template.cycle_name LIMIT 1;

    INSERT INTO levels (id, school_id, cycle_id, name, "order")
    VALUES (
      p_school_id || '-' || v_template.level_code,
      p_school_id,
      v_cycle_id,
      v_template.level_name,
      v_template.level_order
    )
    ON CONFLICT DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  UPDATE schools SET structure_seeded_from = p_template_key WHERE id = p_school_id;

  RETURN v_count;
END $$;

GRANT EXECUTE ON FUNCTION seed_structure_for_school(TEXT, TEXT) TO authenticated;

-- 5. Clôture batch d'une période sur plusieurs classes
CREATE OR REPLACE FUNCTION close_period_for_classrooms(
  p_periode_id UUID,
  p_classroom_ids TEXT[],
  p_actor_id UUID,
  p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_classroom_id TEXT;
  v_wizard_run_id UUID := gen_random_uuid();
  v_count INT := 0;
BEGIN
  FOREACH v_classroom_id IN ARRAY p_classroom_ids LOOP
    INSERT INTO classroom_periode_status
      (classroom_id, periode_id, actual_end_date, notes_locked, locked_at, locked_by, closure_wizard_run_id)
    VALUES
      (v_classroom_id, p_periode_id, p_end_date, true, now(), p_actor_id, v_wizard_run_id)
    ON CONFLICT (classroom_id, periode_id) DO UPDATE SET
      actual_end_date = EXCLUDED.actual_end_date,
      notes_locked = true,
      locked_at = now(),
      locked_by = p_actor_id,
      closure_wizard_run_id = v_wizard_run_id;

    PERFORM compute_bulletin(v_classroom_id, p_periode_id);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END $$;

GRANT EXECUTE ON FUNCTION close_period_for_classrooms(UUID, TEXT[], UUID, DATE) TO authenticated;

-- 6. Calcul moyenne annuelle
CREATE OR REPLACE FUNCTION compute_annual_average(p_bulletin_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_bulletin RECORD;
  v_annual NUMERIC;
BEGIN
  SELECT b.*, p.school_year_id
  INTO v_bulletin
  FROM bulletins b
  JOIN periodes p ON p.id = b.periode_id
  WHERE b.id = p_bulletin_id;

  SELECT AVG(b2.average)
  INTO v_annual
  FROM bulletins b2
  JOIN periodes p2 ON p2.id = b2.periode_id
  WHERE b2.student_id = v_bulletin.student_id
    AND p2.school_year_id = v_bulletin.school_year_id
    AND b2.status = 'published'
    AND b2.average IS NOT NULL;

  UPDATE bulletins SET annual_average = ROUND(v_annual, 2)
  WHERE id = p_bulletin_id;

  RETURN v_annual;
END $$;

GRANT EXECUTE ON FUNCTION compute_annual_average(UUID) TO authenticated;

-- 7. Propagation frais niveau → classes
CREATE OR REPLACE FUNCTION apply_level_fees_to_classrooms(
  p_level_id TEXT,
  p_student_type_id UUID DEFAULT NULL
) RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count INT;
BEGIN
  WITH deleted AS (
    DELETE FROM classroom_fee_lines cfl
    WHERE cfl.classroom_id IN (SELECT id FROM classrooms WHERE level_id = p_level_id)
      AND cfl.overrides_level_line_id IS NOT NULL
      AND (p_student_type_id IS NULL OR cfl.student_type_id = p_student_type_id)
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM deleted;

  RETURN v_count;
END $$;

GRANT EXECUTE ON FUNCTION apply_level_fees_to_classrooms(TEXT, UUID) TO authenticated;

-- 8. Trigger : à la création d'un niveau, hydrater fee_lines + installments pour chaque student_type de l'école
CREATE OR REPLACE FUNCTION trigger_on_level_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_school_id TEXT;
  v_type RECORD;
  v_template JSONB;
  v_line JSONB;
  v_installment JSONB;
BEGIN
  SELECT school_id INTO v_school_id FROM cycles WHERE id = NEW.cycle_id;

  SELECT default_fee_template INTO v_template FROM schools WHERE id = v_school_id;

  FOR v_type IN SELECT id FROM student_types WHERE school_id = v_school_id LOOP
    FOR v_line IN SELECT * FROM jsonb_array_elements(v_template->'lines') LOOP
      INSERT INTO level_fee_lines
        (level_id, student_type_id, category, label, amount, "order", is_optional)
      VALUES (
        NEW.id, v_type.id,
        v_line->>'category', v_line->>'label',
        (v_line->>'amount')::NUMERIC,
        (v_line->>'order')::INT,
        COALESCE((v_line->>'is_optional')::BOOLEAN, false)
      )
      ON CONFLICT DO NOTHING;
    END LOOP;

    FOR v_installment IN SELECT * FROM jsonb_array_elements(v_template->'installments') LOOP
      INSERT INTO level_fee_installments
        (level_id, student_type_id, "order", label, category, due_date_offset_days, amount, amount_percentage)
      VALUES (
        NEW.id, v_type.id,
        (v_installment->>'order')::INT, v_installment->>'label', v_installment->>'category',
        (v_installment->>'due_date_offset_days')::INT,
        (v_installment->>'amount')::NUMERIC,
        (v_installment->>'amount_percentage')::NUMERIC
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_level_created ON levels;
CREATE TRIGGER on_level_created
  AFTER INSERT ON levels
  FOR EACH ROW
  EXECUTE FUNCTION trigger_on_level_created();
