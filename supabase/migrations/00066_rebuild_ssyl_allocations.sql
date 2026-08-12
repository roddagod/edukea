-- =============================================================================
-- 00066 — RPC rebuild_ssyl_allocations : re-ventiler tous les paiements d'un SSYL
-- =============================================================================
-- Cas d'usage : quand les frais/echeances ont ete configures APRES enregistrement
-- des paiements. Les ledger_transactions existent mais payment_allocations est
-- vide (allocate_payment_to_installments a saute car aucun installment a l'epoque).
--
-- Fonction :
--   1. Purge les payment_allocations existantes du SSYL
--   2. Pour chaque ledger_transaction de source 'payment' du SSYL, ordre chrono,
--      re-appelle la logique FIFO d'allocation via allocate_payment_to_installments
--   3. Retourne un breakdown : nb tx traitees, total ventile, surplus final
--
-- Utilise le trigger de matérialisation existant (assure que les cfi existent).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.rebuild_ssyl_allocations(p_ssyl_id text)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_ssyl RECORD;
  v_tx RECORD;
  v_tx_amount BIGINT;
  v_processed INT := 0;
  v_total_reallocated BIGINT := 0;
  v_installments_count INT;
BEGIN
  -- 1. Verification acces + existence
  SELECT ssyl.id, ssyl.school_id, ssyl.classroom_id, ssyl.type_student_id, ssyl.school_year_id
  INTO v_ssyl
  FROM student_school_year_loggings ssyl
  WHERE ssyl.id = p_ssyl_id
    AND ssyl.deleted_at IS NULL
    AND (is_admin() OR ssyl.school_id = get_school_staff_school_id());

  IF v_ssyl.id IS NULL THEN
    RAISE EXCEPTION 'rebuild_ssyl_allocations : SSYL % introuvable ou acces refuse', p_ssyl_id;
  END IF;

  -- 2. S'assurer que les cfi sont materialises (defensif : le trigger normal
  --    devrait deja l'avoir fait, mais si les frais niveau ont ete crees APRES
  --    l'inscription, il faut declencher la copie maintenant)
  IF v_ssyl.type_student_id IS NOT NULL AND v_ssyl.classroom_id IS NOT NULL AND v_ssyl.school_year_id IS NOT NULL THEN
    BEGIN
      PERFORM materialize_classroom_fees(v_ssyl.classroom_id, v_ssyl.type_student_id, v_ssyl.school_year_id);
    EXCEPTION WHEN others THEN
      NULL; -- silencieux : on continue meme si echec (frais peuvent deja exister)
    END;
  END IF;

  -- 3. Verifier qu'il y a des installments a ventiler
  SELECT COUNT(*) INTO v_installments_count
  FROM v_ssyl_installment_status
  WHERE ssyl_id = p_ssyl_id;

  IF v_installments_count = 0 THEN
    RAISE EXCEPTION 'rebuild_ssyl_allocations : aucun installment configure pour ce SSYL. Configurez les frais dans Rentree > Frais scolarite.';
  END IF;

  -- 4. Purge des allocations existantes (on repart de zero pour re-appliquer FIFO)
  DELETE FROM payment_allocations
   WHERE payment_tx_id IN (
     SELECT id FROM ledger_transactions
      WHERE ref_id = p_ssyl_id AND source::text IN ('cash', 'bank_transfer', 'momo', 'internal')
   );

  -- 5. Iteration chronologique des paiements (source != discount pour ne pas
  --    reventiler les reductions)
  FOR v_tx IN
    SELECT lt.id, lt.occurred_at
      FROM ledger_transactions lt
     WHERE lt.ref_id = p_ssyl_id
       AND lt.status = 'posted'
       AND lt.source::text IN ('cash', 'bank_transfer', 'momo', 'internal')
     ORDER BY lt.occurred_at ASC, lt.created_at ASC
  LOOP
    -- Calcul du montant depuis ledger_entries (side debit sur cash/bank/momo)
    SELECT COALESCE(SUM(le.amount), 0) INTO v_tx_amount
      FROM ledger_entries le
     WHERE le.transaction_id = v_tx.id
       AND le.direction = 'debit';

    IF v_tx_amount > 0 THEN
      PERFORM allocate_payment_to_installments(p_ssyl_id, v_tx.id, v_tx_amount);
      v_processed := v_processed + 1;
      v_total_reallocated := v_total_reallocated + v_tx_amount;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'ssyl_id', p_ssyl_id,
    'transactions_processed', v_processed,
    'total_reallocated', v_total_reallocated,
    'installments_available', v_installments_count
  );
END $function$;

COMMENT ON FUNCTION public.rebuild_ssyl_allocations IS
  'Re-ventile tous les paiements d''un SSYL selon l''etat courant des installments. Utile quand les frais ont ete configures apres les paiements.';
