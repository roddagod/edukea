-- =============================================================================
-- 00054 — Fix RPC seed_structure_for_school + trigger_on_level_created robuste
-- =============================================================================
-- 1) seed_structure_for_school : colonne "order" -> order_by
--    (renommee dans une migration precedente mais RPC pas mis a jour)
--    ==> bouton "Charger template" cassé (mutation silencieuse cote UI).
--
-- 2) trigger_on_level_created : skip les installments sans due_month au lieu
--    de crasher (default_fee_template legacy avec due_date_offset_days peut
--    exister sur ecoles anciennes -> NOT NULL violation).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.seed_structure_for_school(
  p_school_id   text,
  p_template_key text
) RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
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

    INSERT INTO levels (id, school_id, cycle_id, name, order_by)
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
END $function$;

-- =============================================================================
-- Fix trigger_on_level_created : robuste aux templates legacy
-- =============================================================================
CREATE OR REPLACE FUNCTION public.trigger_on_level_created()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_school_id TEXT;
  v_type RECORD;
  v_template JSONB;
  v_line JSONB;
  v_installment JSONB;
BEGIN
  SELECT school_id INTO v_school_id FROM cycles WHERE id = NEW.cycle_id;
  SELECT default_fee_template INTO v_template FROM schools WHERE id = v_school_id;

  -- Rien a faire si l'ecole n'a pas de template
  IF v_template IS NULL THEN
    RETURN NEW;
  END IF;

  FOR v_type IN SELECT id FROM student_types WHERE school_id = v_school_id LOOP
    FOR v_line IN SELECT * FROM jsonb_array_elements(COALESCE(v_template->'lines', '[]'::jsonb)) LOOP
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

    FOR v_installment IN SELECT * FROM jsonb_array_elements(COALESCE(v_template->'installments', '[]'::jsonb)) LOOP
      -- Skip installments legacy sans due_month (schema pre-00049)
      CONTINUE WHEN v_installment->>'due_month' IS NULL;

      INSERT INTO level_fee_installments
        (level_id, student_type_id, "order", label, category, due_month, due_year_offset, amount, amount_percentage)
      VALUES (
        NEW.id, v_type.id,
        (v_installment->>'order')::INT, v_installment->>'label', v_installment->>'category',
        (v_installment->>'due_month')::INT,
        COALESCE((v_installment->>'due_year_offset')::INT, 0),
        (v_installment->>'amount')::NUMERIC,
        (v_installment->>'amount_percentage')::NUMERIC
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  RETURN NEW;
END $function$;