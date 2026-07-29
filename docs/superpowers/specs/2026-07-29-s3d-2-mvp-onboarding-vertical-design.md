# Sprint S3D.2 — MVP onboarding vertical (config année + frais + inscription) — spec V1

**Date** : 2026-07-29
**Statut** : Design validé, en attente d'approbation utilisateur avant plan d'implémentation
**Périmètre** : Livrer un chemin utilisable **bout-en-bout** — une école (nouvelle ou pilote post-import) peut être configurée entièrement par le manager depuis l'UI et **inscrire un premier élève** avec paiement ventilé sur les échéances définies.

---

## 1. Contexte et objectifs

Après **S3D.1** (fondations DB + squelette hub Rentrée, mergé sur main le 2026-07-29, tag `s3d.1`), le hub `/dashboard/pedagogy` est visible mais **toutes ses cartes sont non-fonctionnelles** — cliquer dessus mène à un 404. Le manager voit sa checklist de 9 étapes mais ne peut rien configurer.

**S3D.2** débloque le premier verrou métier : rendre fonctionnelles les 5 premières étapes du hub (année, périodes, barème, types d'élèves, structure) + ajouter l'écran de gestion des frais matriciels, puis **brancher le wizard S3B d'inscription existant** sur ce nouveau modèle pour livrer un parcours end-to-end.

**Objectifs concrets** :
- Une école pilote post-import ou une école nouvellement onboardée peut configurer son année scolaire complète en < 20 min via l'UI, sans intervention SQL
- Un élève peut être inscrit dans cette école avec paiement ventilé automatiquement sur les échéances du type d'élève × niveau
- Une réinscription N → N+1 fonctionne avec le nouveau modèle de frais matriciels

**Cibles** :
- **Manager** d'établissement — configure toute l'année via les écrans du hub
- **Directeur / Censeur** — lecture des écrans de config (pas d'édition V1)
- **Toute école** (nouvelle ou pilote) — le sprint est neutre à l'origine de la data

---

## 2. Contraintes & principes

- **SaaS-first robuste** — les écrans doivent fonctionner que la data soit populée par script SQL (import ops) ou saisie UI. Aucun assumption sur "d'où vient l'école"
- **Model matriciel des frais** — chaque combinaison (niveau × type d'élève) a ses propres lignes et échéances. "6ème affecté" ≠ "6ème non-affecté". Pas de fallback flat V1
- **Le wizard S3B existant est modifié, pas réécrit** — on préserve le shape général (5 étapes, orchestrator inchangé), on refond seulement l'étape frais/paiement
- **Auto-save partout** (500ms debounce sur les mutations éditables) pour éviter les pertes de saisie
- **Master-detail pour la structure** — cohérent avec un contexte d'école ~50 items (cycles + niveaux + classes)
- **Pas de wizard héritage année N+1** — reporté V1.5 (rotation future 2026-27 → 2027-28 pas urgente)
- **Design system existant** — cohérence visuelle avec S3A/S3B/S3D.1 : couleurs Edukea (`#E97423`), Inter, `@edukea/ui` (Sidebar, Card, Button, Input, etc.)

---

## 3. Décisions produit validées (matrix)

| Décision | Choix | Rationale |
|---|---|---|
| Cible produit V1 | Onboarding SaaS fonctionnel + parcours inscription branché sur nouveau modèle fees | Priorité utilisateur : chemin bout-en-bout utilisable |
| Migration data pilotes | Hors scope produit — scripts SQL en ops | Décidé en réunion 2026-07-29 : le produit doit être neutre à l'origine data |
| Wizard héritage année N+1 | Reporté V1.5 | Rotation future non urgente ; migration data des pilotes ne passe pas par lui |
| Modèle frais | Matrice complète (niveau × type d'élève) dès V1 | Fidèle au spec S3D (2026-07-20) et au contexte ivoirien (affecté ≠ non-affecté) |
| Overrides frais par classe | Reporté V2 | Cas rare ; complexifie l'UI. Config au niveau suffit V1 |
| Structure école UI | Master-detail (panel gauche arbre, panel droit édition) | Confirmé en brainstorm — meilleur pour édition ciblée |
| Personnalisation bulletin (2b) | Reporté S3D.5 | Le wizard inscription n'en a pas besoin |
| Enseignants + affectations | Reporté S3D.3 | Le wizard inscription n'en a pas besoin non plus |
| Saisie notes + workflow bulletin | Reporté S3D.4/S3D.6 | Hors périmètre |
| Découpage sprint | 3 blocs séquentiels (config année → frais → patch inscription) | Chaque bloc = milestone shippable et testable indépendamment |
| Backfill ventilation paiements historiques | Reporté V1.5 (option (a) V1 : ne s'applique qu'aux nouveaux paiements) | Migration data via ops rend probablement redondant |

---

## 4. Architecture — Bloc 1 : Config année standalone (5 écrans)

### 4.1 Ordre de dépendance

```
[Année scolaire]  ← étape 1
   │
   ▼
[Périodes]        ← dépend d'année active
[Structure]       ← indépendante
[Types d'élèves]  ← séedés par défaut, éditable
[Barème école]    ← config unique
```

Les états de chaque étape sont exposés via `v_pedagogy_setup_status` (livrée S3D.1). Cliquer une carte "verrouillée" du hub redirige vers l'écran de dépendance manquante.

### 4.2 Routes ajoutées

```
apps/school/src/app/(dashboard)/dashboard/pedagogy/
├── school-year/
│   └── page.tsx              → form créer/éditer + liste années existantes
├── periods/
│   └── page.tsx              → CRUD périodes de l'année active
├── grading/
│   └── page.tsx              → radio /10, /20, /100 (auto-save)
├── student-types/
│   └── page.tsx              → CRUD list + inline edit
└── structure/
    ├── page.tsx              → master-detail arborescence + template loader
    └── _components/
        ├── StructureLayout.tsx     → grille 2 colonnes responsive
        ├── StructureTree.tsx       → panel gauche
        ├── StructureDetail.tsx     → panel droit (dispatch selon type)
        ├── CycleDetail.tsx / LevelDetail.tsx / ClassroomDetail.tsx
        └── LoadTemplateDialog.tsx
```

### 4.3 Composants clés

**Année scolaire** (`school-year/page.tsx`) :
- Liste des années existantes (récentes en haut) avec badge "Active" sur celle qui couvre aujourd'hui
- Bouton "Nouvelle année" → modal form : nom auto-suggéré (`2026-2027`), `date_start`, `date_end`, `periode_type` (radio trimestre/semestre)
- Édition inline sur ligne existante
- Validation client : `date_end > date_start`, `periode_type IN ('trimestre','semestre')`

**Périodes** (`periods/page.tsx`) :
- Détecte automatiquement l'année active
- Liste 3 (trimestre) ou 2 (semestre) périodes attendues selon `periode_type`
- Chaque période : `name` (auto : "Trimestre 1"), `start_date`, `end_date`, `is_published`
- Bouton "Générer par défaut" (RPC calcule dates depuis année) + édition manuelle possible
- Warning si périodes se chevauchent ou débordent année

**Barème école** (`grading/page.tsx`) :
- Radio group : /10, /20, /100
- Auto-save au clic
- Note : "Modifier le barème n'impacte pas les évaluations déjà saisies"

**Types d'élèves** (`student-types/page.tsx`) :
- Liste des `student_types` de l'école (3 séedés par défaut)
- Chaque ligne : `code`, `label`, `is_default` (radio unique par école), actions (éditer, supprimer)
- Bouton "Ajouter type" (boursiers, cas spéciaux)
- Guards : suppression bloquée si type utilisé par ≥ 1 `students.student_type_id`
- Un seul `is_default` à la fois (contrainte partielle unique déjà en DB — index `idx_student_types_one_default_per_school`)

**Structure école** (`structure/page.tsx`) — master-detail :
- **Panel gauche** (arborescence collapsible, ~300px) : cycles → niveaux → classes, sélection surlignée. Icônes distinctes (`Building2` cycle, `Layers` niveau, `DoorOpen` classe)
- **Panel droit** (form contextuel) : formulaire du nœud sélectionné. Actions "Ajouter enfant" (contextuel), "Supprimer" avec confirmation cascade
- **Header commun** : bouton "Charger template" (modal) + breadcrumb du nœud sélectionné
- **État vide** : panel droit invite "Sélectionne un élément à gauche ou charge un template"
- Guards suppression cascade : avertit `supprimer cycle = tous ses niveaux + classes + fee_lines + fee_installments`

### 4.4 Hooks & mutations (Bloc 1)

**Lecture** :
```
useSchoolYears(schoolId)
useCurrentSchoolYear(schoolId)               → wrapper sur v_pedagogy_setup_status
usePeriodes(schoolYearId)
useStudentTypes(schoolId)
useSchoolStructure(schoolId)                 → arborescence complète en un fetch (join cycles + levels + classrooms)
useStructureTemplates()                      → templates dispo (lecture publique)
```

**Mutations** :
```
useUpsertSchoolYear(patch)
useDeleteSchoolYear(id)                      → guard cascade (bloqué si student_school_year_loggings existent)
useUpsertPeriode(patch)
useGenerateDefaultPeriodes(schoolYearId)     → RPC generate_default_periodes
useUpdateSchoolBareme(schoolId, maxScore)
useUpsertStudentType(patch)
useDeleteStudentType(id)                     → guard : bloqué si utilisé
useUpsertCycle(patch) / useDeleteCycle(id)
useUpsertLevel(patch) / useDeleteLevel(id)
useUpsertClassroom(patch) / useDeleteClassroom(id)
useSeedStructureFromTemplate(schoolId, templateKey)  → appelle seed_structure_for_school (existante)
```

### 4.5 Comportements transverses

- Chaque écran affiche un **badge d'aide contextuel** en haut listant les dépendances aval : "Cette étape débloque : Périodes, Structure, Frais"
- Après chaque mutation réussie → toast + invalidation de `v_pedagogy_setup_status` (queryKey `['pedagogy-setup-status', schoolId]`) pour que le hub reflète le progrès à la prochaine navigation
- Bouton "Retour au Hub" persistant en haut à gauche
- Skeleton loading + optimistic updates sur mutations légères

---

## 5. Architecture — Bloc 2 : Frais matriciels

### 5.1 Routes

```
apps/school/src/app/(dashboard)/dashboard/pedagogy/fees/
├── page.tsx                          → overview matrice niveau × type
└── [levelId]/
    └── page.tsx                      → édition d'un niveau (avec sélecteur type)
```

Pas de route par classroom en V1 (overrides `classroom_fee_lines` reportés V2).

### 5.2 Écran overview `/pedagogy/fees` (page.tsx)

Tableau matrice avec une ligne par niveau, une colonne par `student_type` :

```
┌─────────────────────────────────────────────────────────────┐
│ Frais scolarité                          [Charger template] │
│ Configurez les frais pour chaque combinaison niveau × type  │
├─────────────────────────────────────────────────────────────┤
│  Niveau    │ Non-affecté │ Affecté État │ Cas social       │
├────────────┼─────────────┼──────────────┼──────────────────┤
│  6ème      │ 180 000 [✓] │  90 000 [✓]  │      —    [!]    │
│  5ème      │ 180 000 [✓] │  90 000 [✓]  │      —    [!]    │
│  4ème      │      —  [!] │      —   [!] │      —    [!]    │
└─────────────────────────────────────────────────────────────┘
```

Cellule = **total obligatoire** (somme `level_fee_lines.amount` where `is_optional=false`) + icône statut (`✓` configuré / `⚠` vide). Clic cellule → édition de cette combinaison. Clic nom de niveau → édition de tous les types de ce niveau.

Bouton "Charger template" ouvre un modal : "Appliquer template Ivorien Collège à tous les niveaux qui matchent (via `seed_pedagogy_for_school`)".

### 5.3 Écran édition niveau `/pedagogy/fees/[levelId]/page.tsx`

Layout : sélecteur de type d'élève en haut (tabs ou dropdown), formulaire lignes + échéances en dessous.

```
┌──────────────────────────────────────────────────────────┐
│ 6ème  ← [Retour]      Type d'élève : [Non-affecté ▼]     │
├──────────────────────────────────────────────────────────┤
│ LIGNES DE FRAIS                          [+ Ajouter]     │
│  Ordre │ Libellé          │ Catégorie   │ Montant  │ Opt│
│  ──────┼──────────────────┼─────────────┼──────────┼────┤
│  1     │ Inscription      │ inscription │  25 000  │ ☐  │
│  2     │ Scolarité annuel │ tuition     │ 150 000  │ ☐  │
│  3     │ Assurance        │ insurance   │   5 000  │ ☐  │
│  4     │ Cantine          │ canteen     │  45 000  │ ☑  │
│                                                          │
│  Total obligatoire : 180 000 XAF                         │
│  Total avec options : 225 000 XAF                        │
├──────────────────────────────────────────────────────────┤
│ ÉCHÉANCES                                [+ Ajouter]     │
│  # │ Libellé              │ +Jrs │ Montant  │ %  │       │
│  ──┼──────────────────────┼──────┼──────────┼────┼───────┤
│  1 │ Inscription          │  0   │  25 000  │    │       │
│  2 │ 1re tranche scol.    │ 30   │  60 000  │ 40 │       │
│  3 │ 2e tranche scol.     │ 120  │  45 000  │ 30 │       │
│  4 │ 3e tranche scol.     │ 210  │  45 000  │ 30 │       │
└──────────────────────────────────────────────────────────┘
```

- Switch de type recharge le formulaire (confirmation si modif non sauvée)
- Bouton "Copier depuis autre type" (dropdown) → clone lignes + échéances via RPC `copy_fees_between_student_types`
- Lignes libres autorisées (Cotisation APE, Manuels...) avec catégorie `other`
- Échéances : montant fixe **OU** pourcentage (colonne % affiche le pourcentage effectif)
- Auto-save par ligne (500ms debounce)
- Validation : somme des % par catégorie ≤ 100 (warning si <100, error si >100)

### 5.4 Composants

```
fees/
├── page.tsx
├── _components/
│   ├── FeesOverviewMatrix.tsx        → tableau matrice cellules cliquables
│   ├── LoadFeesTemplateDialog.tsx    → application template
│   └── FeeStatusCell.tsx             → cellule avec total + statut
├── [levelId]/
│   ├── page.tsx
│   └── _components/
│       ├── FeeLevelEditor.tsx        → conteneur principal
│       ├── StudentTypeSelector.tsx   → tabs ou dropdown
│       ├── FeeLinesTable.tsx / FeeLineRow.tsx / AddFeeLineButton.tsx
│       ├── InstallmentsTable.tsx / InstallmentRow.tsx / AddInstallmentButton.tsx
│       ├── FeesTotals.tsx            → affichage totaux calculés
│       └── CopyFromOtherTypeButton.tsx
```

### 5.5 Hooks & mutations (Bloc 2)

**Lecture** :
```
useLevelFeeLines(levelId, studentTypeId?)         → studentTypeId opt = toutes combinaisons
useLevelFeeInstallments(levelId, studentTypeId?)
useFeesOverviewMatrix(schoolId)                   → alimente le tableau overview
useClassroomEffectiveFees(classroomId, studentTypeId)         → réutilisé par Bloc 3
useClassroomEffectiveInstallments(classroomId, studentTypeId)
```

**Mutations** :
```
useUpsertLevelFeeLine(patch)
useDeleteLevelFeeLine(id)
useUpsertLevelFeeInstallment(patch)
useDeleteLevelFeeInstallment(id)
useCopyFeesFromType(levelId, sourceTypeId, targetTypeId)  → RPC copy_fees_between_student_types
useApplyTemplateToLevel(levelId, templateKey, studentTypeId)
```

---

## 6. Architecture — Bloc 3 : Patch S3B inscription + retest réinscription

### 6.1 État actuel du wizard S3B (livré)

Le wizard `apps/school/src/app/(dashboard)/dashboard/enrollment/` a 4-5 étapes :
1. Élève (identité)
2. Famille + parents
3. Choix classe
4. Frais + paiement
5. Récap + validation

Aujourd'hui l'étape 4 lit un total flat de scolarité et enregistre un versement global sans imputation sur des tranches.

### 6.2 Modifications précises

**Étape 1 (Élève)** :
- Ajouter dropdown "Type d'élève" (obligatoire), pré-rempli avec le `is_default=true` de l'école
- Data lié : `students.student_type_id` (colonne existe depuis 00035)
- Zod val : `student_type_id` requis, doit exister dans `student_types` de l'école

**Étape 3 (Choix classe)** :
- Après sélection classe, précalculer le montant via `useClassroomEffectiveFees(classroomId, studentTypeId)` pour affichage récap
- Warning si combinaison (niveau × type) n'a pas de `level_fee_lines` → bloquer avec message "Config frais manquante pour {type} en {niveau}, contacter le manager"

**Étape 4 (Frais + paiement)** — refonte principale :
- Remplacer la ligne unique "Scolarité : X XAF" par un tableau des lignes lu via `useClassroomEffectiveFees`
- Ajouter en dessous le calendrier d'échéances via `useClassroomEffectiveInstallments`
- Section paiement inchangée dans son shape (montant + méthode + reçu) — l'appel `record_student_payment` reste, la ventilation est faite automatiquement en aval par `allocate_payment_to_installments` (déjà écrit en 00043)
- Écran de récap montre la ventilation : "Sur les 30 000 XAF payés : 25 000 sur Inscription (soldée), 5 000 sur 1re tranche (reste 20 000 à payer)"

### 6.3 Fichiers modifiés dans le wizard S3B

```
apps/school/src/app/(dashboard)/dashboard/enrollment/
├── _components/
│   ├── StudentStep.tsx             → +dropdown student_type
│   ├── ClassroomStep.tsx           → +fetch effective fees, +warning si vide
│   ├── FeesPaymentStep.tsx         → REFONTE
│   ├── FeesLinesTable.tsx          → nouveau composant
│   ├── InstallmentsSchedule.tsx    → nouveau composant
│   ├── PaymentAllocationSummary.tsx → nouveau
│   └── EnrollmentRecap.tsx         → montre ventilation post-paiement
└── page.tsx                        → orchestrator (state machine inchangée)
```

Zod schema : `student_type_id` requis dans StudentStep schema.

### 6.4 Retest réinscription (déjà shippée S3B)

**Points à vérifier** :
1. Le `student_type_id` de l'élève est **conservé** au passage (pas remis à null)
2. Les frais de la nouvelle classe sont **présentés** dans l'écran de réinscription
3. Le paiement enregistré au réinscription passe bien par `record_student_payment` + ventilation
4. Cas particulier élève change de niveau → grille tarifaire différente, ventilation démarre from-scratch sur la nouvelle année

**Tâches** :
- Test manuel scripté (checklist SQL avant/après) sur 1 élève pilote
- Correction hooks/RPCs de passage si nécessaire (patches probables mais localisés)
- Patch UI si l'écran ne montre pas les nouveaux frais

### 6.5 Migration data des inscriptions existantes

- 3124 élèves ont maintenant `student_type_id` populé (backfill 00045 → `not_affected`)
- Anciens `enrollment_transitions` restent valides
- Paiements historiques : **pas de `payment_allocations`** (fonction inexistante à l'époque). Choix retenu **V1 : laisser tel quel**, la ventilation ne s'applique qu'aux nouveaux paiements. Backfill V1.5 si besoin

---

## 7. Delta modèle de données

### 7.1 Nouvelle migration `00046_S3D2_fees_overview.sql`

**Nouvelle vue SQL** :

```sql
CREATE OR REPLACE VIEW v_fees_overview_matrix AS
SELECT
  l.id AS level_id,
  l.name AS level_name,
  st.id AS student_type_id,
  st.code AS student_type_code,
  st.label AS student_type_label,
  COALESCE(SUM(lfl.amount) FILTER (WHERE lfl.is_optional = false), 0) AS total_mandatory,
  COALESCE(SUM(lfl.amount), 0) AS total_with_options,
  COUNT(DISTINCT lfl.id) AS lines_count,
  COUNT(DISTINCT lfi.id) AS installments_count
FROM levels l
JOIN cycles c ON c.id = l.cycle_id
CROSS JOIN student_types st
LEFT JOIN level_fee_lines lfl ON lfl.level_id = l.id AND lfl.student_type_id = st.id
LEFT JOIN level_fee_installments lfi ON lfi.level_id = l.id AND lfi.student_type_id = st.id
WHERE c.school_id = st.school_id
GROUP BY l.id, l.name, st.id, st.code, st.label;
```

Une ligne par (niveau, type). `lines_count = 0` → cellule vide (statut ⚠).

### 7.2 Nouvelle migration `00047_S3D2_fees_rpcs.sql`

**RPC `generate_default_periodes(p_school_year_id UUID) RETURNS INT`** :
Crée automatiquement 2 (semestre) ou 3 (trimestre) périodes calculées depuis les dates de l'année. Idempotent (SKIP si périodes déjà présentes).

**RPC `copy_fees_between_student_types(p_level_id TEXT, p_source_type_id UUID, p_target_type_id UUID) RETURNS INT`** :
Clone toutes les lignes et échéances d'un `(level_id, source_type_id)` vers `(level_id, target_type_id)`. Overwrite si existant.

### 7.3 Aucun changement

**Aucune nouvelle table**, **aucune colonne ajoutée**. Le schéma S3D.1 couvre tout.

### 7.4 Total delta chiffré

| Élément | Compte |
|---|---|
| Nouvelles migrations SQL | 2 (00046 vue + 00047 RPCs) |
| Nouvelles tables | 0 |
| Nouvelles colonnes | 0 |
| Nouvelles vues | 1 (`v_fees_overview_matrix`) |
| Nouvelles fonctions SQL | 2 (`generate_default_periodes`, `copy_fees_between_student_types`) |
| Nouveaux hooks partagés | ~18 |
| Composants app | ~25 (5 pages Bloc 1 + 2 pages Bloc 2 + patches Bloc 3) |
| Fichiers touchés wizard S3B | ~4-6 |

Sprint sensiblement plus léger côté DB que S3D.1 (11 migrations), plus large côté UI.

---

## 8. Découpage de livraison

Chaque bloc = milestone shippable et testable indépendamment.

| # | Phase | Contenu | Valeur au ship | Taille |
|---|---|---|---|---|
| **3D.2.1** | **Fondations DB + Bloc 1** | Migrations 00046-00047. 6 hooks lecture + 8 hooks mutations. 5 pages : `/school-year`, `/periods`, `/grading`, `/student-types`, `/structure` (master-detail). Template loader structure. Hub reflète progression en live | Manager peut créer l'année scolaire, périodes, structure, types, barème. Hub étapes done | L |
| **3D.2.2** | **Bloc 2 (Frais matriciels)** | Écran overview matrice niveau × type. Écran édition par niveau avec sélecteur type. Auto-save + copy from type + template application | Manager peut définir tous les frais + échéances. Hub étape "Frais" done | M |
| **3D.2.3** | **Bloc 3 (Patch inscription + retest réinscription)** | Étape Élève enrichie (dropdown type). Étape Frais wizard refonte (tableau lignes + calendrier + récap ventilation). Retest réinscription + patch éventuel | Un élève peut être inscrit end-to-end avec ventilation auto sur échéances. Réinscription fonctionne | M |

**Effort relatif** : L ≈ 3×, M ≈ 2×. Total ≈ 7× (vs S3D.1 = 16×). Calendrier estimé : 1 à 1.5 semaine à un dev.

**Dépendances** :
```
3D.2.1 (Bloc 1) → 3D.2.2 (Bloc 2) → 3D.2.3 (Bloc 3)
```
Séquentiel obligatoire.

---

## 9. Non-goals V1 (explicites)

| Item | Motif | Cible |
|---|---|---|
| **Wizard héritage année N+1** | Rotation future pas urgente. Migration data via ops | V1.5 |
| **Overrides frais par classe** (`classroom_fee_lines`) | Cas rare. Config au niveau suffit V1 | V2 |
| **Personnalisation bulletin** (`/pedagogy/bulletin-template`) | Le wizard inscription n'en a pas besoin | S3D.5 |
| **Enseignants + invitations + affectations** | Idem | S3D.3 |
| **Saisie notes + workflow bulletin** | Hors sprint complet | S3D.4/S3D.6 |
| **Backfill ventilation paiements historiques** | Nouveaux paiements OK, anciens sans allocation | V1.5 si besoin |
| **Structure master-detail responsive mobile poussé** | Version desktop clean V1, mobile stack simplifiée | V2 |
| **Édition en batch sur la matrice frais** (mass-apply) | Pattern ligne-à-ligne + copy from type suffit V1 | V1.5 |
| **Historique/audit des modifications frais** | Pas de trace changements tarifs | V2 |
| **Gestion multi-devise** | XAF partout | V3 |

---

## 10. Risques identifiés

- **Wizard S3B fragile aux changements** : le code existant repose sur des hooks retournant un shape flat. La refonte de l'étape 4 doit être testée soigneusement sur un cas end-to-end sur staging avant merge. Test manuel scripté à documenter dans le plan
- **Types d'élèves supprimables** : garde-fou nécessaire — impossible de supprimer un `student_type` si utilisé par ≥ 1 student. Bien câbler la mutation avec check + message clair
- **RLS sur nouvelles vues** : `v_fees_overview_matrix` doit hériter des policies de `level_fee_lines` et `student_types`. Vérifier au smoke test — les vues Postgres n'héritent pas systématiquement des RLS des tables sous-jacentes
- **Confusion year "active" vs "any"** : le hub montre uniquement l'année active. L'écran `/pedagogy/school-year` doit lister TOUTES les années pour permettre édition de future ou passée
- **Écran structure master-detail sur école massive** : si > 200 classes, arborescence single-fetch lente. Virtualisation V2 si besoin

---

## 11. Invariants attendus post-import ops

Le sprint fait aucune hypothèse sur d'où vient la data. Les scripts d'import ops doivent respecter :

- Chaque `school` a **exactement 1** `student_types.is_default = true`
- Chaque `school_year` a soit un `periode_type` défini soit `NULL` (l'UI demande alors de le fixer)
- Chaque `level_fee_lines` a un `student_type_id` valide pour la même école
- Les `classroom_fee_installments.due_date` sont cohérentes avec `school_years.date_start/end`
- Chaque `students` a un `student_type_id` non-null (backfill sur `is_default` si migration data manquait la donnée)

En cas d'import incomplet, l'UI reste utilisable : le hub `v_pedagogy_setup_status` montre précisément ce qui manque et guide le manager.

---

## 12. Références

- Spec S3D complet : `docs/superpowers/specs/2026-07-20-notes-bulletins-design.md`
- Plan S3D.1 (livré) : `docs/superpowers/plans/2026-07-21-s3d-1-fondations-db-hub.md`
- Rôles et fonctionnalités : `docs/ROLES_ET_FONCTIONNALITES.md`
- Migrations S3D.1 : `supabase/migrations/00035_*` → `00045_*`
- Hook usePedagogySetupStatus : `packages/shared/src/hooks/usePedagogySetupStatus.ts`
- Wizard S3B : `apps/school/src/app/(dashboard)/dashboard/enrollment/`

---

*Design validé le 2026-07-29. Prochaine étape : plan d'implémentation détaillé (writing-plans).*
