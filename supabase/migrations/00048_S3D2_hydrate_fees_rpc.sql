-- =========================================================================
-- Migration 00048 — RPC hydrate_fees_from_school_template (S3D.2)
--
-- Bulk fill : pour chaque (level × student_type) d'une école qui n'a AUCUNE
-- ligne de frais, insert depuis schools.default_fee_template.
-- Idempotent : skippe les combos déjà remplis.
-- =========================================================================

CREATE OR REPLACE FUNCTION hydrate_fees_from_school_template(p_school_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_template JSONB;
  v_line JSONB;
  v_installment JSONB;
  v_level RECORD;
  v_type RECORD;
  v_lines_created INT := 0;
  v_installments_created INT := 0;
  v_combos_hydrated INT := 0;
BEGIN
  SELECT default_fee_template INTO v_template FROM schools WHERE id = p_school_id;

  IF v_template IS NULL THEN
    RAISE EXCEPTION 'hydrate_fees : école % introuvable ou template null', p_school_id;
  END IF;

  FOR v_level IN
    SELECT l.id FROM levels l
    JOIN cycles c ON c.id = l.cycle_id
    WHERE c.school_id = p_school_id AND l.deleted_at IS NULL
  LOOP
    FOR v_type IN
      SELECT st.id FROM student_types st WHERE st.school_id = p_school_id
    LOOP
      IF EXISTS (SELECT 1 FROM level_fee_lines WHERE level_id = v_level.id AND student_type_id = v_type.id) THEN
        CONTINUE;
      END IF;

      FOR v_line IN SELECT * FROM jsonb_array_elements(v_template->'lines') LOOP
        INSERT INTO level_fee_lines (level_id, student_type_id, category, label, amount, "order", is_optional)
        VALUES (
          v_level.id, v_type.id,
          v_line->>'category', v_line->>'label',
          (v_line->>'amount')::NUMERIC,
          (v_line->>'order')::INT,
          COALESCE((v_line->>'is_optional')::BOOLEAN, false)
        )
        ON CONFLICT DO NOTHING;
        v_lines_created := v_lines_created + 1;
      END LOOP;

      FOR v_installment IN SELECT * FROM jsonb_array_elements(v_template->'installments') LOOP
        INSERT INTO level_fee_installments (level_id, student_type_id, "order", label, category, due_date_offset_days, amount, amount_percentage)
        VALUES (
          v_level.id, v_type.id,
          (v_installment->>'order')::INT,
          v_installment->>'label',
          v_installment->>'category',
          (v_installment->>'due_date_offset_days')::INT,
          (v_installment->>'amount')::NUMERIC,
          (v_installment->>'amount_percentage')::NUMERIC
        )
        ON CONFLICT DO NOTHING;
        v_installments_created := v_installments_created + 1;
      END LOOP;

      v_combos_hydrated := v_combos_hydrated + 1;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'combos_hydrated', v_combos_hydrated,
    'lines_created', v_lines_created,
    'installments_created', v_installments_created
  );
END $$;

GRANT EXECUTE ON FUNCTION hydrate_fees_from_school_template(TEXT) TO authenticated;
