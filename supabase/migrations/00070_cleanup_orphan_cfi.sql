-- =============================================================================
-- 00070 — Nettoyage cfi orphelines + FK CASCADE overrides_level_installment_id
-- =============================================================================
-- Bug : quand generateInstallments purge/recree les level_fee_installments,
-- les classroom_fee_installments materialisees restent (leur
-- overrides_level_installment_id pointe sur un lfi supprime).
-- La vue v_classroom_effective_installments les inclut via son premier SELECT
-- non filtre, creant des doublons ("Tranche 1" + "Scolarite — Tranche 1").
--
-- Fix :
--   1. Purger les cfi orphelines (overrides_level_installment_id NULL ou
--      pointant sur lfi supprime)
--   2. FK ON DELETE CASCADE : classroom_fee_installments.overrides_level_installment_id
--      -> level_fee_installments.id
--   -> quand un lfi est supprime, les cfi materialisees le sont automatiquement
-- =============================================================================

-- 1. Purge cfi orphelines : overrides_level_installment_id pointe vers un lfi disparu
DELETE FROM classroom_fee_installments cfi
 WHERE cfi.overrides_level_installment_id IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM level_fee_installments lfi
      WHERE lfi.id = cfi.overrides_level_installment_id
   );

-- 2. FK ON DELETE CASCADE
ALTER TABLE classroom_fee_installments
  DROP CONSTRAINT IF EXISTS classroom_fee_installments_overrides_level_installment_id_fkey;

ALTER TABLE classroom_fee_installments
  ADD CONSTRAINT classroom_fee_installments_overrides_level_installment_id_fkey
  FOREIGN KEY (overrides_level_installment_id)
  REFERENCES level_fee_installments(id) ON DELETE CASCADE;

-- 3. Meme logique pour classroom_fee_lines (defensif)
ALTER TABLE classroom_fee_lines
  DROP CONSTRAINT IF EXISTS classroom_fee_lines_overrides_level_line_id_fkey;

ALTER TABLE classroom_fee_lines
  ADD CONSTRAINT classroom_fee_lines_overrides_level_line_id_fkey
  FOREIGN KEY (overrides_level_line_id)
  REFERENCES level_fee_lines(id) ON DELETE CASCADE;
