-- ============================================================
-- RPC get_user_school_context(school_id, year_id)
-- Retourne tout le contexte multi-école du user courant en 1 roundtrip :
--   - is_superadmin (bool)
--   - schools accessibles (JSON array)
--   - years disponibles pour la school choisie (JSON array)
--   - current_school (JSON object)
--   - current_year (JSON object)
--
-- Remplace 4-5 requêtes waterfall du hook useSchoolContext.
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_school_context(
  p_requested_school_id TEXT DEFAULT NULL,
  p_requested_year_id TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_is_superadmin BOOLEAN := FALSE;
  v_schools JSONB;
  v_years JSONB;
  v_current_school JSONB;
  v_current_year JSONB;
  v_school_id TEXT;
  v_year_id TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;

  -- superadmin ?
  SELECT EXISTS(
    SELECT 1 FROM admin_profiles WHERE user_id = v_uid AND role IN ('superadmin', 'admin')
  ) INTO v_is_superadmin;

  -- Écoles accessibles
  IF v_is_superadmin THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name) ORDER BY s.name), '[]'::jsonb)
    INTO v_schools
    FROM schools s WHERE s.deleted_at IS NULL;
  ELSE
    SELECT COALESCE(jsonb_agg(DISTINCT jsonb_build_object('id', s.id, 'name', s.name)), '[]'::jsonb)
    INTO v_schools
    FROM school_staff_profiles ssp
    JOIN schools s ON s.id = ssp.school_id
    WHERE ssp.user_id = v_uid AND s.deleted_at IS NULL;
  END IF;

  -- Aucun accès → renvoyer un shape vide
  IF jsonb_array_length(v_schools) = 0 THEN
    RETURN jsonb_build_object(
      'is_superadmin', v_is_superadmin,
      'schools', '[]'::jsonb,
      'years', '[]'::jsonb,
      'current_school', null,
      'current_year', null
    );
  END IF;

  -- Choisir la school : requested si accessible, sinon la première
  SELECT v_schools->0->>'id' INTO v_school_id;
  IF p_requested_school_id IS NOT NULL AND EXISTS(
    SELECT 1 FROM jsonb_array_elements(v_schools) e WHERE e->>'id' = p_requested_school_id
  ) THEN
    v_school_id := p_requested_school_id;
  END IF;

  SELECT jsonb_build_object('id', id, 'name', name)
  INTO v_current_school
  FROM schools WHERE id = v_school_id;

  -- Années scolaires de cette école
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object('id', sy.id, 'name', sy.name, 'date_start', sy.date_start, 'date_end', sy.date_end)
      ORDER BY sy.date_start DESC NULLS LAST
    ),
    '[]'::jsonb
  )
  INTO v_years
  FROM school_years sy
  WHERE sy.school_id = v_school_id AND sy.deleted_at IS NULL;

  -- Choisir l'année : requested si dispo, sinon active (today entre start/end), sinon la plus récente
  IF p_requested_year_id IS NOT NULL AND EXISTS(
    SELECT 1 FROM jsonb_array_elements(v_years) e WHERE e->>'id' = p_requested_year_id
  ) THEN
    v_year_id := p_requested_year_id;
  ELSE
    SELECT sy.id INTO v_year_id
    FROM school_years sy
    WHERE sy.school_id = v_school_id
      AND sy.deleted_at IS NULL
      AND sy.date_start <= now()
      AND sy.date_end >= now()
    ORDER BY sy.date_start DESC LIMIT 1;

    IF v_year_id IS NULL THEN
      SELECT (v_years->0->>'id') INTO v_year_id;
    END IF;
  END IF;

  IF v_year_id IS NOT NULL THEN
    SELECT jsonb_build_object('id', sy.id, 'name', sy.name)
    INTO v_current_year
    FROM school_years sy WHERE sy.id = v_year_id;
  END IF;

  RETURN jsonb_build_object(
    'is_superadmin', v_is_superadmin,
    'schools', v_schools,
    'years', v_years,
    'current_school', v_current_school,
    'current_year', v_current_year
  );
END $$;

GRANT EXECUTE ON FUNCTION get_user_school_context(TEXT, TEXT) TO authenticated;
