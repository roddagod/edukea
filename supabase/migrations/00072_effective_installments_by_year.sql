-- =============================================================================
-- 00072 — Calendrier de paiement filtre par annee scolaire cible
-- =============================================================================
-- Bug : v_classroom_effective_installments calcule les due_date des lfi non
-- materialisees a partir de la DERNIERE annee scolaire de l'ecole (ORDER BY
-- date_start DESC LIMIT 1). Consequences :
--
--   1. Si l'ecole a plusieurs annees actives (2026-2027 + 2027-2028), le
--      calendrier affiche des dates de 2028 pour un SSYL en 2026-2027.
--   2. Si une classe a des cfi orphelines (sans overrides_level_installment_id,
--      residue d'ancienne config), la vue affiche a la fois les cfi orphelines
--      ET les lfi actuelles -> jusqu'a 3 annees scolaires visibles pour un
--      meme couple (classroom, type).
--
-- Fix :
--
--   1. Fonction get_effective_installments_for_year(classroom, type, year) :
--      calcule les due_date des lfi non-materialisees a partir de l'annee
--      passee en argument. Retourne cfi + lfi non-cfi.
--
--   2. La vue v_classroom_effective_installments est conservee pour compat,
--      mais son comportement est identique (defaut = derniere annee).
--
--   3. Data cleanup one-shot : pour chaque SSYL actif, appeler
--      resync_classroom_fees -> purge cfi orphelines + re-materialise.
-- =============================================================================

-- 1. Fonction paramétrée
CREATE OR REPLACE FUNCTION public.get_effective_installments_for_year(
  p_classroom_id     text,
  p_student_type_id  text,
  p_school_year_id   text
) RETURNS TABLE (
  classroom_id     text,
  student_type_id  uuid,
  "order"          integer,
  label            text,
  category         text,
  due_date         date,
  amount           numeric,
  source           text
)
  LANGUAGE plpgsql
  STABLE
  SECURITY INVOKER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_type_uuid UUID;
  v_year_start DATE;
BEGIN
  BEGIN
    v_type_uuid := p_student_type_id::UUID;
  EXCEPTION WHEN others THEN
    RETURN;
  END;

  -- Annee scolaire cible : date_start
  SELECT sy.date_start INTO v_year_start
    FROM school_years sy
   WHERE sy.id = p_school_year_id
     AND sy.deleted_at IS NULL;

  IF v_year_start IS NULL THEN
    -- Fallback : derniere annee non supprimee de l'ecole du classroom
    SELECT sy2.date_start INTO v_year_start
      FROM school_years sy2
      JOIN cycles c ON c.school_id = sy2.school_id
      JOIN levels l ON l.cycle_id = c.id
      JOIN classrooms cr ON cr.level_id = l.id AND cr.id = p_classroom_id
     WHERE sy2.deleted_at IS NULL
     ORDER BY sy2.date_start DESC NULLS LAST
     LIMIT 1;
  END IF;

  RETURN QUERY
    SELECT
      cfi.classroom_id,
      cfi.student_type_id,
      cfi."order",
      cfi.label,
      cfi.category,
      cfi.due_date,
      cfi.amount,
      'classroom_override'::text AS source
      FROM classroom_fee_installments cfi
     WHERE cfi.classroom_id    = p_classroom_id
       AND cfi.student_type_id = v_type_uuid
    UNION ALL
    SELECT
      cr.id AS classroom_id,
      lfi.student_type_id,
      lfi."order",
      lfi.label,
      lfi.category,
      make_date(EXTRACT(YEAR FROM v_year_start)::INT + lfi.due_year_offset,
                lfi.due_month, 15) AS due_date,
      COALESCE(
        lfi.amount,
        (SELECT (SUM(lfl2.amount) * lfi.amount_percentage) / 100.0
           FROM level_fee_lines lfl2
          WHERE lfl2.level_id        = lfi.level_id
            AND lfl2.student_type_id = lfi.student_type_id
            AND lfl2.category        = lfi.category)
      ) AS amount,
      'level'::text AS source
      FROM classrooms cr
      JOIN level_fee_installments lfi ON lfi.level_id = cr.level_id
     WHERE cr.id                = p_classroom_id
       AND lfi.student_type_id  = v_type_uuid
       AND NOT EXISTS (
         SELECT 1 FROM classroom_fee_installments cfi2
          WHERE cfi2.classroom_id    = cr.id
            AND cfi2.student_type_id = lfi.student_type_id
            AND cfi2.overrides_level_installment_id = lfi.id
       )
    ORDER BY "order";
END $function$;

COMMENT ON FUNCTION public.get_effective_installments_for_year IS
  'Retourne les echeances effectives d''une classe/type pour une annee scolaire donnee. Les cfi (materialisees) sont retournees telles quelles ; les lfi non-materialisees sont calculees avec les dates de p_school_year_id.';

-- 2. Data cleanup : re-sync tous les SSYL actifs pour purger les cfi orphelines
--    Ce cleanup est idempotent : resync_classroom_fees purge + re-materialise
--    depuis les lfi actuels, donc l'appel est safe meme si deja aligne.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT ssyl.classroom_id, ssyl.type_student_id, ssyl.school_year_id
      FROM student_school_year_loggings ssyl
     WHERE ssyl.deleted_at IS NULL
       AND ssyl.type_student_id IS NOT NULL
  LOOP
    BEGIN
      PERFORM resync_classroom_fees(r.classroom_id, r.type_student_id, r.school_year_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'resync failed for classroom=% type=% year=% : %',
        r.classroom_id, r.type_student_id, r.school_year_id, SQLERRM;
    END;
  END LOOP;
END $$;
