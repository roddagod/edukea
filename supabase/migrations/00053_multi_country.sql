-- =============================================================================
-- 00053 — Multi-country support (CI + GA)
-- =============================================================================
-- Ajoute country_code + currency sur schools pour supporter plusieurs pays.
-- CI (Cote d'Ivoire) = XOF (CFA BCEAO, Afrique de l'Ouest)
-- GA (Gabon)         = XAF (CFA BEAC, Afrique Centrale)
-- Meme parite EUR (655.957) mais codes ISO distincts.
-- =============================================================================

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS country_code TEXT NOT NULL DEFAULT 'CI',
  ADD COLUMN IF NOT EXISTS currency     TEXT NOT NULL DEFAULT 'XOF';

-- Contraintes : pour l'instant on autorise CI/GA + XOF/XAF, extensible ensuite.
ALTER TABLE schools
  DROP CONSTRAINT IF EXISTS schools_country_code_check;
ALTER TABLE schools
  ADD  CONSTRAINT schools_country_code_check CHECK (country_code IN ('CI', 'GA'));

ALTER TABLE schools
  DROP CONSTRAINT IF EXISTS schools_currency_check;
ALTER TABLE schools
  ADD  CONSTRAINT schools_currency_check CHECK (currency IN ('XOF', 'XAF'));

-- Backfill defensif : toutes les ecoles existantes sont en CI (car pilote)
UPDATE schools
   SET country_code = 'CI', currency = 'XOF'
 WHERE country_code IS NULL OR currency IS NULL;

COMMENT ON COLUMN schools.country_code IS 'ISO 3166-1 alpha-2 (CI, GA). Determine la devise par defaut, les regles de telephone, et les templates pedagogiques applicables.';
COMMENT ON COLUMN schools.currency     IS 'ISO 4217. CI=XOF (BCEAO Ouest), GA=XAF (BEAC Centre). Peut etre override manuellement.';
