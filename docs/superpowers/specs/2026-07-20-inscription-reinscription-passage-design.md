# Module Inscription / Réinscription / Passage d'année — spec V1

**Date**: 2026-07-20
**Statut**: Design validé, en attente d'approbation utilisateur avant plan d'implémentation
**Périmètre**: Sprint 3B — Module d'inscription des élèves (nouveaux, réinscriptions, batch passage d'année N → N+1) pour l'app `school`, opéré par le **Gestionnaire d'établissement** (rôle `manager` dans `school_staff_profiles`).

---

## 1. Contexte et objectifs

Le module Inscription est le second volet critique du positionnement stratégique Edukea. Après le suivi financier (Sprint 3A Recouvrement), il permet au gestionnaire d'un établissement de :

- **Inscrire de nouveaux élèves** en début d'année (wizard 5 étapes fidèle à l'ancien Laravel)
- **Réinscrire des élèves existants** pour la nouvelle année scolaire
- **Passer massivement les élèves de N vers N+1** en fin d'année scolaire

**Objectif** : que le gestionnaire puisse gérer une rentrée scolaire complète (~600 élèves) en quelques jours, sans doublons et avec un enregistrement financier propre (opening balance dans le ledger, dès la création).

**Cible** : le gestionnaire d'établissement (COO). Pas d'accès public parents en V1.

---

## 2. Contraintes & principes

- **Search-first, create-if-absent** — anti-doublons systématique pour élèves ET familles
- **Ledger comme source de vérité financière** — chaque inscription crée un `opening_balance` automatique
- **Remise ≠ Versement** — distinction stricte dès la saisie (deux flags, deux comptes ledger différents)
- **Mobile-first** — le gestionnaire doit pouvoir enregistrer une inscription depuis son téléphone (~60% du trafic)
- **Anti-pattern AI-slop** interdits (voir §7 du design system v1)
- **Rôles** : `manager` a RW ; `founder`/`director` en R ; `teacher` aucun accès (voir `ROLES_ET_FONCTIONNALITES.md`)
- **Réserver de l'espace** pour intégration future du module Notes/Bulletins (colonne "moyenne annuelle" dans le passage, tabs futurs dans la fiche élève)

---

## 3. Décisions produit validées

| Décision | Choix | Rationale |
|---|---|---|
| MVP | Wizard interne complet (pas de campagne publique) | Fidèle à l'ancien Laravel, périmètre atteignable |
| Matricule | Auto `SCHOOL-YYYY-NNNN` (ex `AKD-2025-0421`) | Lisible + unique + traçable |
| Anti-doublon élève | Search-first Étape 1 | Évite les doublons entre années |
| Anti-doublon parents | Search-first Étape 2 | Réutilisation famille pour fratrie |
| Passage d'année | Semi-auto avec validation | Contrôle par classe/élève sans lenteur |
| 1er versement | Obligatoire par défaut, checkbox décochable au cas par cas | Reflète la réalité CI, souple pour bourses totales |
| Capacité classes | Hors V1 | Simplification, feature V2 (liste d'attente) |
| MoMo | Hors V1 | Cash / virement / autre uniquement (voir Phase 1 stratégie) |

---

## 4. Architecture — Routes & composants

### 4.1 Routes

```
apps/school/src/app/(dashboard)/dashboard/enrollment/
├── page.tsx                          → Hub inscription
├── loading.tsx                       → Skeleton hub
├── new/
│   ├── page.tsx                      → Wizard 5 étapes nouvel élève
│   └── loading.tsx
├── re/[studentId]/
│   ├── page.tsx                      → Wizard réinscription (3 étapes)
│   └── loading.tsx
├── passage/
│   ├── page.tsx                      → Table batch passage année
│   └── loading.tsx
└── [ssylId]/
    ├── page.tsx                      → Fiche d'inscription (édition post-création)
    └── loading.tsx
```

### 4.2 Composants métier

- `EnrollmentHub` (KPI cards + search + classes grid + latest inscriptions)
- `EnrollmentWizard` — orchestrateur des 5 étapes (état persisté en local pendant la session, pas de DB draft V1)
- `StepStudent` (Étape 1 : identité)
- `StepFamily` (Étape 2 : parents)
- `StepClassroom` (Étape 3 : classe)
- `StepFeesPayment` (Étape 4 : frais + remise + 1er versement)
- `StepSummary` (Étape 5 : récap + valider)
- `ReenrollmentWizard` (3 étapes raccourcies)
- `PassageTable` (table éditable pour le batch)
- `StudentSearchPicker` (SearchInput avec dropdown, réutilisable Étape 1 wizard)
- `FamilySearchPicker` (idem pour parents, Étape 2)

### 4.3 Nouveaux composants `@edukea/ui` à ajouter

- `Wizard` — orchestrateur générique (props : steps[], current, onNext, onBack, onSubmit) + Stepper header + boutons
- `Stepper` — visual de la progression (5 pastilles avec le n° + titre court, current mis en avant)
- `FormField` — wrapper unifié (label + control + hint + error)
- `Select` — native `<select>` stylé (comme les selectors du topbar)
- `DatePicker` — native `input type="date"` stylé
- `Textarea` — primitive
- `RadioCards` — variantes visuelles pour choix multi (sexe, type élève, décision passage)
- `Checkbox` — primitive
- `SegmentedControl` — pour les 2-3 choix (mode paiement)

---

## 5. Wizard « Nouvel élève » — détail des 5 étapes

### 5.1 Étape 1 — Élève

**Objectif** : identifier l'élève, éviter les doublons.

**UI** :
- En haut : `SearchInput` XL "Rechercher un élève existant (matricule, nom)"
- Résultats live : liste sous le SearchInput. Si trouvé : bouton « Ce n'est pas un nouvel élève → Réinscrire pour 2026-2027 » → redirige vers `/enrollment/re/[studentId]`
- Si pas trouvé (`Aucun résultat` OU search vide + user clique "Créer nouveau") : formulaire :
  - Nom * (Input)
  - Prénom(s) * (Input)
  - Sexe * (RadioCards : Masculin / Féminin)
  - Date de naissance * (DatePicker)
  - Lieu de naissance (Input)
  - Nationalité (Input, default "Ivoirienne")
  - Numéro extrait de naissance (Input, optionnel)
  - Redoublant (Checkbox)
  - Photo (upload, optionnel — hors V1 → placeholder)

**Bouton** : « Suivant » désactivé tant que champs obligatoires (*) manquent.

**Validation** : nom + prénom + sexe + date naissance requis.

### 5.2 Étape 2 — Famille

**Objectif** : rattacher l'élève à ses parents/tuteur, réutiliser existants.

**UI** :
- Trois blocs : Père / Mère / Tuteur (chacun peut être vide, **au moins 1 requis**)
- Pour chaque bloc :
  - `SearchInput` "Rechercher (téléphone, nom)"
  - Si trouvé → utilise la famille existante (affiche card avec nom + téléphone + adresse en read-only, bouton « Changer »)
  - Sinon → formulaire :
    - Nom (Input)
    - Prénom (Input)
    - Téléphone * (Input tel)
    - Email (Input email)
    - Profession (Input)
    - Adresse (Input)
    - Résidence (Input, ville)

**Validation** : au moins 1 des 3 blocs (père/mère/tuteur) rempli avec téléphone.

### 5.3 Étape 3 — Classe & niveau

**Objectif** : positionner l'élève dans une classe de l'année scolaire courante.

**UI** :
- Cycle (Select) — filtré à l'école courante
- Niveau (Select) — dépendant du cycle
- Classe (Select) — dépendant du niveau. Affiche `n_élèves déjà inscrits` en meta
- Type d'élève (RadioCards : Nouveau / Redoublant / Transfert)
- Éducation physique (RadioCards : Apte / Non apte / Dispense)
- LV2 optionnelle (Select — depuis `lv2` table si existante, sinon skip)

**Validation** : classe requise.

### 5.4 Étape 4 — Frais & remise & 1er versement

**Objectif** : facturer et enregistrer le premier versement.

**UI** :
- **Barème automatique** : à la sélection de classe (Étape 3), le système résout `classroom_school_fees` matching (classe × année × type_élève). Affiche en read-only :
  - Frais d'inscription (`registration_fees`)
  - Frais annexes (`additionnal_fees`)
  - Scolarité (`school_fees`)
  - **Total à payer** (`school_fees_net`)
  - Tranches (échéancier `classroom_school_fees_by_parts`)
- **Remise** (checkbox « Appliquer une remise ») :
  - Motif (Select : Fratrie / Sociale / Mérite / Personnel / Autre) *
  - Montant OU pourcentage (SegmentedControl + Input avec suffixe FCFA/%)
  - Note (Textarea optionnelle)
- **1er versement** (checkbox « Enregistrer un premier versement », **pré-cochée**) :
  - Montant * (Input avec suffixe FCFA, pré-rempli à `registration_fees`)
  - Mode * (SegmentedControl : Espèces / Virement / Autre)
  - Note (Input optionnelle, ex "Reçu 001/2026")

**Validation** : rien si aucune coche. Si versement coché, montant > 0.

### 5.5 Étape 5 — Récapitulatif & validation

**Objectif** : preview + confirmation atomique.

**UI** :
- Card résumé :
  - Identité : nom + prénoms + matricule *à générer* + classe + année
  - Famille : père/mère/tuteur (chips)
- Card financière :
  - Facturé : X FCFA
  - Remise : Y FCFA (si appliquée) — sur fond accent-soft
  - À payer : Z FCFA
  - Versé aujourd'hui : W FCFA (si 1er versement)
  - Reste à payer : Z - W FCFA
- Bouton « Confirmer l'inscription » (variant primary, taille lg)
- Bouton « Retour » (variant ghost)

**Backend** : appel de la RPC `enroll_new_student(payload)` :
1. Génération matricule `AKD-2025-NNNN` (voir §6.1)
2. Upsert families (père/mère/tuteur) — création si absente
3. INSERT students (identité + refs familles + matricule)
4. INSERT student_school_year_loggings (classe, année, school_fees_id, school_fees_total = facturé - remise)
5. Créer les comptes ledger student_receivable pour ce SSYL
6. POST ledger transaction `opening_balance` (debit receivable, credit revenue_school_fees) — montant = école facturé
7. Si remise : POST ledger transaction `remise` (debit discount, credit receivable) — montant remise
8. Si 1er versement : POST ledger transaction `paiement` (debit cash/bank, credit receivable) — via `record_student_payment`
9. Retourne `{ student_id, ssyl_id, matricule, total_billed, discount_applied, first_payment }`

**Après validation** :
- Redirection vers fiche `/dashboard/enrollment/[ssylId]`
- Toast succès « Inscription enregistrée pour <nom> — matricule <matricule> »
- Bouton « Nouvelle inscription » pour enchaîner
- Bouton « Télécharger le reçu PDF » (hors V1 → placeholder)

---

## 6. Backend — nouvelles migrations, RPC, vues

### 6.1 Migration `00028_matricule_sequence.sql`

- Colonne `schools.matricule_prefix TEXT` (ex `AKD` pour Akonda Divo — dérivé, éditable en paramétrage)
- Séquence `matricule_seq_<school_id>_<year>` créée à la volée (via RPC `next_matricule(school_id, school_year_id)`)
- Format `<prefix>-<YYYY>-<NNNN>` avec NNNN sur 4 digits (padded).

Fonction :

```sql
CREATE OR REPLACE FUNCTION next_matricule(p_school_id TEXT, p_school_year_id TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
  DECLARE
    v_prefix TEXT;
    v_year_short TEXT;
    v_seq INT;
  BEGIN
    SELECT COALESCE(matricule_prefix, LEFT(UPPER(name), 3)) INTO v_prefix FROM schools WHERE id = p_school_id;
    SELECT SUBSTRING(name FROM 1 FOR 4) INTO v_year_short FROM school_years WHERE id = p_school_year_id;
    -- Count existing matricules matching the pattern + 1
    SELECT COUNT(*) + 1 INTO v_seq
    FROM students
    WHERE school_id = p_school_id AND matricule LIKE v_prefix || '-' || v_year_short || '-%';
    RETURN v_prefix || '-' || v_year_short || '-' || LPAD(v_seq::TEXT, 4, '0');
  END $$;
```

### 6.2 Migration `00029_enrollment_rpcs.sql`

RPC `enroll_new_student(payload JSONB) RETURNS JSONB` (voir §5.5 étape 5).
RPC `reenroll_student(existing_student_id TEXT, payload JSONB) RETURNS JSONB` — plus court, réutilise l'identité.
RPC `bulk_advance_year(from_year_id TEXT, to_year_id TEXT, plan JSONB) RETURNS JSONB` — atomique.

Chaque RPC :
- Vérifie que l'user est `manager` ou `is_admin()`
- Utilise `ledger_post_transaction` en interne pour les mouvements financiers
- Retourne un shape JSON explicite (student_id, ssyl_id, etc.) pour le frontend

### 6.3 Migration `00030_enrollment_transitions.sql`

Table `enrollment_transitions` (audit trail du passage) :

```sql
CREATE TABLE enrollment_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL REFERENCES students(id),
  from_ssyl_id TEXT REFERENCES student_school_year_loggings(id),
  to_ssyl_id TEXT REFERENCES student_school_year_loggings(id),
  decision TEXT NOT NULL CHECK (decision IN ('advance', 'repeat', 'leave', 'pending')),
  from_classroom_id TEXT REFERENCES classrooms(id),
  to_classroom_id TEXT REFERENCES classrooms(id),
  decided_by UUID REFERENCES auth.users(id),
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT
);
```

+ RLS `USING (is_admin() OR EXISTS (SELECT 1 FROM students WHERE id = student_id AND school_id = get_school_staff_school_id()))`.

### 6.4 Vue `v_year_advancement_preview`

Une ligne par élève de l'année source, avec suggestion N+1 (niveau+1 basé sur `levels.order_by`) et statut par défaut `pending`. Utilisée par l'écran passage.

**Colonne réservée pour V2 Notes/Bulletins** : `avg_yearly_grade FLOAT` (nullable) — calculée depuis bulletins quand ils existeront, NULL sinon.

---

## 7. Hub — page `/dashboard/enrollment`

### KPI cards (top)
- Nouveaux inscrits année : nb de SSYL créés avec `is_first_register = 1`
- Réinscrits : nb de SSYL créés avec un student déjà inscrit N-1
- Non-réinscrits : nb d'élèves N-1 sans SSYL en N (candidats à réinscription)
- Total inscrits année

### Sections
- Barre de recherche live (SearchInput jump to /enrollment/[ssylId])
- 2 CTA principaux : `[+ Inscrire un nouvel élève]` et `[⇒ Passage d'année]`
- Grille classes (comme /recovery hub) : nb inscrits par classe
- Table dernières inscriptions (10 rows) → date, nom, classe, statut

---

## 8. Réinscription — page `/dashboard/enrollment/re/[studentId]`

Wizard 3 étapes :

1. **Confirmer identité** : preview identité + famille (édition rapide téléphone parents notamment). Bouton « L'élève a des changements → modifier ».
2. **Nouvelle classe** : suggestion auto (niveau+1 par défaut, `levels.order_by`). RadioCards : « Passage niveau+1 » / « Redoublement » / « Autre classe (choisir) ». Le fees_id est mis à jour selon la nouvelle classe.
3. **Frais & 1er versement** (identique à l'étape 4 du nouveau + récap fusionné).

Backend : RPC `reenroll_student`.

---

## 9. Passage d'année — page `/dashboard/enrollment/passage`

### UI

Table éditable :

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Année source : 2025-2026 ▼]  [Année cible : 2026-2027 ▼]  [X élèves]  │
├─────────────────────────────────────────────────────────────────────────┤
│ Filtres : [Classe source ▼]  [Décision ▼]  [Recherche…]                │
├─────────────────────────────────────────────────────────────────────────┤
│ ☐ Élève         Classe N   Moy   Décision       Classe N+1             │
├─────────────────────────────────────────────────────────────────────────┤
│ ☐ SORE Chakira  CM2 A     —    [Passer ▼]      [6ème A ▼]              │
│ ☐ TRAORE Bintou CM2 A     —    [Redoublement ▼] [CM2 A ▼]              │
│ ☐ ASSIN Agoua   MMS       —    [Départ ▼]      —                       │
├─────────────────────────────────────────────────────────────────────────┤
│ [Sélection en masse] [→ Passer niveau+1] [→ Redoublement]              │
│                                                                         │
│                          [Confirmer 47 passages]                        │
└─────────────────────────────────────────────────────────────────────────┘
```

**Interactions** :
- Filtre par classe source → limite le scope aux élèves d'une classe précise (efficace pour "passer toute la CM2 A d'un coup")
- Décisions par défaut : Passer (basé sur suggestion `levels.order_by + 1`)
- Actions bulk : appliquer une décision sur la sélection cochée
- Bouton final : « Confirmer N passages » — génère les SSYL cibles atomiquement (RPC `bulk_advance_year`)
- Toast succès avec bilan (N passés, M redoublements, K départs, L en attente)

**Note V2** : la colonne « Moy » (moyenne annuelle) sera peuplée quand le module Notes/Bulletins existera. En V1, `—`.

---

## 10. Fiche d'inscription — `/dashboard/enrollment/[ssylId]`

Post-création, éditer les infos administratives :
- Header : nom + matricule + classe + année + StatusPill (statut inscription : Complet / Incomplet)
- Sections éditables :
  - Identité (bouton édit)
  - Famille (bouton édit)
  - Classe (bouton édit — attention, changement de classe = refacturer)
  - Historique administratif (mutations, changements de classe intra-année)
- Lien vers **fiche recouvrement** de l'élève (`/dashboard/recovery/[ssylId]`) où on gère les versements

---

## 10.bis Attribution des élèves aux classes

Trois vitesses selon le contexte :

**Nouvel élève (wizard Étape 3)** : sélection manuelle Cycle → Niveau → Classe. `n_élèves inscrits` affiché en meta. Aucune règle auto (le gestionnaire choisit selon sa politique interne).

**Réinscription simple** : suggestion par défaut = **garder la même section** (parse `classrooms.name` pour trouver la section terminale — ex. "A" — puis chercher au niveau+1 une classe finissant par la même section). Si aucun match, prend la première classe du niveau+1 par ordre. Modifiable en 1 clic dans le Select.

**Passage batch** (`/enrollment/passage`) :
- Défaut par row : décision `Passer` + classe cible = même section au niveau+1 (règle ci-dessus)
- Sélection multiple → actions bulk : « Assigner à [Classe ▼] » et « Décision [Passer/Redoublement/Départ ▼] » appliquées à toutes les rows cochées
- Édition individuelle possible dans le Select cible de chaque row
- Filtre par classe source → cocher tous les élèves d'une classe → assigner en masse

**Ré-affectation intra-année** : depuis la fiche `/enrollment/[ssylId]`, bouton « Changer de classe ». Si le nouveau `classroom_school_fees` diffère, la RPC recalcule l'opening balance ledger (reversal de l'ancien + création nouveau) pour éviter les incohérences comptables.

## 11. Migrations récapitulatives

| Fichier | Contenu |
|---|---|
| `00028_matricule_sequence.sql` | Fonction `next_matricule` + colonne `schools.matricule_prefix` |
| `00029_enrollment_rpcs.sql` | RPC `enroll_new_student`, `reenroll_student`, `bulk_advance_year` |
| `00030_enrollment_transitions.sql` | Table `enrollment_transitions` + RLS |
| `00031_v_enrollment_stats.sql` | Views : `v_enrollment_stats` (KPI hub), `v_year_advancement_preview` |

Note : la migration `00026_fix_recent_payments_view.sql` (fix nom élève dans cockpit après nouveau versement) et `00027_ref_id_ssyl.sql` (convention ref_id=ssyl_id + is_discount) ont déjà été appliquées avant le début de ce sprint.

---

## 12. Design system additions

Composants à créer dans `@edukea/ui` :

| Composant | Priorité | Complexité |
|---|---|---|
| `Wizard` | P0 | Moyenne (state machine + Prev/Next + validation par step) |
| `Stepper` | P0 | Simple (visual header) |
| `FormField` | P0 | Simple |
| `Select` | P0 | Simple (native styled) |
| `DatePicker` | P0 | Simple (native `input type="date"` stylé) |
| `Checkbox` | P0 | Simple |
| `RadioCards` | P1 | Moyenne (visual boxes with selected state) |
| `SegmentedControl` | P1 | Simple |
| `Textarea` | P1 | Simple (héritage Input) |

Total ~9 composants — ce qui débloque aussi les modules futurs (paramétrage, notes, communication).

---

## 13. Critères de succès

- Un gestionnaire peut inscrire un nouvel élève complet en **< 3 minutes** (test utilisateur avec chef d'établissement pilote)
- Une réinscription d'un élève existant : **< 90 secondes**
- Un passage d'année complet pour ~600 élèves : **< 20 minutes** (avec ajustements)
- Zéro doublon élève ni famille dans les tests (search-first efficace)
- Chaque inscription crée automatiquement l'opening balance ledger (audit trail complet)
- Remises et versements strictement séparés dans les vues et l'historique

---

## 14. Hors périmètre V1

- Campagne d'inscription publique (formulaire parent + upload dossier + validation)
- Génération PDF du reçu (placeholder V1 avec bouton disabled)
- Génération PDF de l'attestation de scolarité
- Liste d'attente et capacité classes
- Notification WhatsApp/Email au parent après inscription
- Photo de l'élève (upload)
- Intégration MoMo pour 1er versement
- Colonne "Moyenne annuelle" peuplée dans le passage (attente module Notes)
- Impression en lot des reçus après un passage batch

Ces items iront dans un plan V2 quand le MVP sera validé sur le terrain.

---

## 15. Références

- `docs/ROLES_ET_FONCTIONNALITES.md` — matrice Gestionnaire (RW) / Directeur (R) / Fondateur (R)
- `docs/superpowers/specs/2026-07-18-design-system-edukea-design.md` — anti-patterns et tokens
- `apps/school/src/app/(dashboard)/dashboard/recovery/` — patterns existants à réutiliser (hub, search dropdown, drill-down)
- Ancien Laravel : `screens/Inscription 1.png`, `Inscription 2.png`, `reinscription *.png` — références UX à préserver
- `supabase/migrations/00022_record_student_payment.sql` — RPC utilisée pour le 1er versement
