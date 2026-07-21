-- =========================================================================
-- Migration 00040 — Templates ivoiriens séedés (S3D fondations)
-- =========================================================================

CREATE TABLE IF NOT EXISTS structure_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL,
  cycle_code TEXT NOT NULL,
  cycle_name TEXT NOT NULL,
  level_code TEXT NOT NULL,
  level_name TEXT NOT NULL,
  level_order INTEGER NOT NULL,
  UNIQUE(template_key, level_code)
);

CREATE TABLE IF NOT EXISTS subject_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_code TEXT NOT NULL,
  name TEXT NOT NULL,
  default_coefficient NUMERIC NOT NULL DEFAULT 1,
  default_group_name TEXT NOT NULL DEFAULT 'Général',
  "order" INTEGER NOT NULL DEFAULT 0,
  is_secondary BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(cycle_code, name)
);

CREATE TABLE IF NOT EXISTS appreciation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  text TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appreciation_templates_school
  ON appreciation_templates(school_id);

COMMENT ON COLUMN appreciation_templates.school_id IS
  'NULL = template global séedé disponible pour toutes les écoles ; non-null = template custom école.';

-- Structure : Ivorien Collège
INSERT INTO structure_templates (template_key, cycle_code, cycle_name, level_code, level_name, level_order) VALUES
  ('ivorien_college', 'college', 'Collège', '6eme', '6ème', 1),
  ('ivorien_college', 'college', 'Collège', '5eme', '5ème', 2),
  ('ivorien_college', 'college', 'Collège', '4eme', '4ème', 3),
  ('ivorien_college', 'college', 'Collège', '3eme', '3ème', 4)
ON CONFLICT DO NOTHING;

-- Structure : Ivorien Primaire
INSERT INTO structure_templates (template_key, cycle_code, cycle_name, level_code, level_name, level_order) VALUES
  ('ivorien_primaire', 'primaire', 'Primaire', 'cp1', 'CP1', 1),
  ('ivorien_primaire', 'primaire', 'Primaire', 'cp2', 'CP2', 2),
  ('ivorien_primaire', 'primaire', 'Primaire', 'ce1', 'CE1', 3),
  ('ivorien_primaire', 'primaire', 'Primaire', 'ce2', 'CE2', 4),
  ('ivorien_primaire', 'primaire', 'Primaire', 'cm1', 'CM1', 5),
  ('ivorien_primaire', 'primaire', 'Primaire', 'cm2', 'CM2', 6)
ON CONFLICT DO NOTHING;

-- Structure : Ivorien Lycée
INSERT INTO structure_templates (template_key, cycle_code, cycle_name, level_code, level_name, level_order) VALUES
  ('ivorien_lycee', 'lycee', 'Lycée', '2nde', '2nde', 1),
  ('ivorien_lycee', 'lycee', 'Lycée', '1ere', '1ère', 2),
  ('ivorien_lycee', 'lycee', 'Lycée', 'terminale', 'Terminale', 3)
ON CONFLICT DO NOTHING;

-- Structure : Ivorien Maternelle
INSERT INTO structure_templates (template_key, cycle_code, cycle_name, level_code, level_name, level_order) VALUES
  ('ivorien_maternelle', 'maternelle', 'Maternelle', 'petite', 'Petite section', 1),
  ('ivorien_maternelle', 'maternelle', 'Maternelle', 'moyenne', 'Moyenne section', 2),
  ('ivorien_maternelle', 'maternelle', 'Maternelle', 'grande', 'Grande section', 3)
ON CONFLICT DO NOTHING;

-- Subject templates Collège
INSERT INTO subject_templates (cycle_code, name, default_coefficient, default_group_name, "order", is_secondary) VALUES
  ('ivorien_college', 'Français', 4, 'Fondamentales', 1, false),
  ('ivorien_college', 'Mathématiques', 4, 'Fondamentales', 2, false),
  ('ivorien_college', 'Anglais LV1', 3, 'Langues', 3, false),
  ('ivorien_college', 'Espagnol LV2', 2, 'Langues', 4, true),
  ('ivorien_college', 'Allemand LV2', 2, 'Langues', 5, true),
  ('ivorien_college', 'Histoire-Géographie', 3, 'Sciences humaines', 6, false),
  ('ivorien_college', 'Physique-Chimie', 3, 'Sciences', 7, false),
  ('ivorien_college', 'Sciences de la Vie et de la Terre', 2, 'Sciences', 8, false),
  ('ivorien_college', 'Éducation Civique et Morale', 1, 'Éveil', 9, false),
  ('ivorien_college', 'EPS', 1, 'Éveil', 10, false),
  ('ivorien_college', 'Arts Plastiques', 1, 'Éveil', 11, true),
  ('ivorien_college', 'Musique', 1, 'Éveil', 12, true)
ON CONFLICT DO NOTHING;

-- Subject templates Primaire
INSERT INTO subject_templates (cycle_code, name, default_coefficient, default_group_name, "order", is_secondary) VALUES
  ('ivorien_primaire', 'Français', 4, 'Fondamentales', 1, false),
  ('ivorien_primaire', 'Mathématiques', 4, 'Fondamentales', 2, false),
  ('ivorien_primaire', 'Éveil scientifique', 2, 'Éveil', 3, false),
  ('ivorien_primaire', 'Éducation Civique et Morale', 1, 'Éveil', 4, false),
  ('ivorien_primaire', 'Anglais', 2, 'Langues', 5, true),
  ('ivorien_primaire', 'EPS', 1, 'Éveil', 6, false),
  ('ivorien_primaire', 'Arts', 1, 'Éveil', 7, true),
  ('ivorien_primaire', 'Écriture', 1, 'Fondamentales', 8, false)
ON CONFLICT DO NOTHING;

-- Subject templates Lycée
INSERT INTO subject_templates (cycle_code, name, default_coefficient, default_group_name, "order", is_secondary) VALUES
  ('ivorien_lycee', 'Français', 4, 'Fondamentales', 1, false),
  ('ivorien_lycee', 'Mathématiques', 5, 'Fondamentales', 2, false),
  ('ivorien_lycee', 'Anglais LV1', 3, 'Langues', 3, false),
  ('ivorien_lycee', 'Espagnol LV2', 2, 'Langues', 4, true),
  ('ivorien_lycee', 'Allemand LV2', 2, 'Langues', 5, true),
  ('ivorien_lycee', 'Histoire-Géographie', 3, 'Sciences humaines', 6, false),
  ('ivorien_lycee', 'Physique-Chimie', 4, 'Sciences', 7, false),
  ('ivorien_lycee', 'Sciences de la Vie et de la Terre', 3, 'Sciences', 8, false),
  ('ivorien_lycee', 'Philosophie', 3, 'Sciences humaines', 9, false),
  ('ivorien_lycee', 'EPS', 1, 'Éveil', 10, false)
ON CONFLICT DO NOTHING;

-- Appreciation templates (globaux)
INSERT INTO appreciation_templates (school_id, label, text, "order") VALUES
  (NULL, 'Excellent trimestre',    'Excellent trimestre, poursuivez ainsi.', 1),
  (NULL, 'Très bon travail',       'Très bon travail, continuez sur cette lancée.', 2),
  (NULL, 'Bon élève',              'Bon élève, sérieux et appliqué.', 3),
  (NULL, 'Bien mais peut mieux',   'Bien mais peut mieux faire.', 4),
  (NULL, 'Doit s''appliquer',      'Doit s''appliquer davantage.', 5),
  (NULL, 'En baisse',              'Résultats en baisse ce trimestre, un ressaisissement est nécessaire.', 6),
  (NULL, 'Élève brillant',         'Élève brillant, félicitations.', 7),
  (NULL, 'Participation active',   'Participation active en classe, félicitations.', 8),
  (NULL, 'Insuffisant',            'Résultats insuffisants, un effort important est attendu.', 9),
  (NULL, 'Absences perturbantes',  'Les absences répétées perturbent la scolarité.', 10)
ON CONFLICT DO NOTHING;
