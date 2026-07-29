-- =========================================================================
-- Migration 00047 — RPCs pour Bloc 1 (périodes) et Bloc 2 (frais) (S3D.2)
-- =========================================================================

CREATE OR REPLACE FUNCTION generate_default_periodes(
  p_school_year_id TEXT
) RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_year RECORD;
  v_existing INT;
  v_count INT := 0;
  v_span_days INT;
BEGIN
  SELECT sy.id, sy.school_id, sy.date_start, sy.date_end, sy.periode_type
  INTO v_year
  FROM school_years sy WHERE sy.id = p_school_year_id AND sy.deleted_at IS NULL;

  IF v_year.id IS NULL THEN
    RAISE EXCEPTION 'generate_default_periodes : school_year % introuvable', p_school_year_id;
  END IF;

  IF v_year.periode_type IS NULL THEN
    RAISE EXCEPTION 'generate_default_periodes : periode_type non défini pour cette année';
  END IF;

  IF v_year.date_start IS NULL OR v_year.date_end IS NULL THEN
    RAISE EXCEPTION 'generate_default_periodes : dates non définies pour cette année';
  END IF;

  SELECT COUNT(*) INTO v_existing FROM periodes p WHERE p.school_year_id = v_year.id;
  IF v_existing > 0 THEN
    RAISE NOTICE 'generate_default_periodes : % périodes déjà présentes, skip', v_existing;
    RETURN 0;
  END IF;

  v_span_days := (v_year.date_end::date - v_year.date_start::date);

  IF v_year.periode_type = 'trimestre' THEN
    INSERT INTO periodes (school_id, school_year_id, name, type, "order", start_date, end_date, is_published) VALUES
      (v_year.school_id, v_year.id, 'Trimestre 1', 'trimestre', 1,
        v_year.date_start::date,
        (v_year.date_start::date + (v_span_days / 3)),
        false),
      (v_year.school_id, v_year.id, 'Trimestre 2', 'trimestre', 2,
        (v_year.date_start::date + (v_span_days / 3) + 1),
        (v_year.date_start::date + (2 * v_span_days / 3)),
        false),
      (v_year.school_id, v_year.id, 'Trimestre 3', 'trimestre', 3,
        (v_year.date_start::date + (2 * v_span_days / 3) + 1),
        v_year.date_end::date,
        false);
    v_count := 3;
  ELSIF v_year.periode_type = 'semestre' THEN
    INSERT INTO periodes (school_id, school_year_id, name, type, "order", start_date, end_date, is_published) VALUES
      (v_year.school_id, v_year.id, 'Semestre 1', 'semestre', 1,
        v_year.date_start::date,
        (v_year.date_start::date + (v_span_days / 2)),
        false),
      (v_year.school_id, v_year.id, 'Semestre 2', 'semestre', 2,
        (v_year.date_start::date + (v_span_days / 2) + 1),
        v_year.date_end::date,
        false);
    v_count := 2;
  END IF;

  RETURN v_count;
END $$;

GRANT EXECUTE ON FUNCTION generate_default_periodes(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION copy_fees_between_student_types(
  p_level_id TEXT,
  p_source_type_id UUID,
  p_target_type_id UUID
) RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_lines_copied INT;
  v_installments_copied INT;
BEGIN
  IF p_source_type_id = p_target_type_id THEN
    RAISE EXCEPTION 'copy_fees : source et target types identiques';
  END IF;

  DELETE FROM level_fee_lines
  WHERE level_id = p_level_id AND student_type_id = p_target_type_id;

  DELETE FROM level_fee_installments
  WHERE level_id = p_level_id AND student_type_id = p_target_type_id;

  INSERT INTO level_fee_lines (level_id, student_type_id, category, label, amount, "order", is_optional)
  SELECT level_id, p_target_type_id, category, label, amount, "order", is_optional
  FROM level_fee_lines
  WHERE level_id = p_level_id AND student_type_id = p_source_type_id;
  GET DIAGNOSTICS v_lines_copied = ROW_COUNT;

  INSERT INTO level_fee_installments (level_id, student_type_id, "order", label, category, due_date_offset_days, amount, amount_percentage)
  SELECT level_id, p_target_type_id, "order", label, category, due_date_offset_days, amount, amount_percentage
  FROM level_fee_installments
  WHERE level_id = p_level_id AND student_type_id = p_source_type_id;
  GET DIAGNOSTICS v_installments_copied = ROW_COUNT;

  RETURN v_lines_copied + v_installments_copied;
END $$;

GRANT EXECUTE ON FUNCTION copy_fees_between_student_types(TEXT, UUID, UUID) TO authenticated;
