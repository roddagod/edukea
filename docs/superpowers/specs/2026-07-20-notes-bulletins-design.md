# Module Notes & Bulletins — spec V1

**Date** : 2026-07-20
**Statut** : Design validé, en attente d'approbation utilisateur avant plan d'implémentation
**Périmètre** : Sprint 3D — Module pédagogique complet (paramétrage, saisie enseignant, bulletins) pour l'app `school`, opéré par **manager / directeur / censeur / enseignant / prof principal** selon les cas. Sortie du module marque la fin du positionnement pédagogique de la V1.

---

## 1. Contexte et objectifs

Après le suivi financier (S3A Recouvrement) et l'inscription (S3B), le Sprint 3D livre le **module pédagogique central** — de la saisie prof jusqu'à la publication du bulletin aux parents. Il élargit l'app `school` de son périmètre initial "manager" à un espace multi-rôles accueillant enseignants, prof principaux, censeurs et directeurs.

**Positionnement stratégique** : Edukea pivote vers un modèle **SaaS-first**. Une école qui s'onboarde part d'un environnement vide et configure sa structure entière depuis Edukea. Le sync MySQL legacy reste disponible pour les 3 écoles pilotes existantes mais n'est plus le chemin par défaut.

**Objectifs** :
- Le manager peut configurer une année scolaire complète (structure école + pédagogique + profs) en < 30 min pour une école standard
- Un prof peut saisir les notes de sa classe en < 5 min pour une évaluation (grille clavier desktop) ou < 10 min en mobile
- Le cycle de vie du bulletin (clôture → appréciations → validation → publication) est gouverné par une state machine explicite avec workflow multi-acteurs
- Chaque école peut personnaliser son bulletin (logo, couleurs, mentions, signatures) sans intervention Edukea
- Les parents reçoivent chaque publication en push et téléchargent le PDF en 1 clic

**Cibles** :
- Manager d'établissement (onboarding + config)
- Enseignant (saisie notes + appréciations)
- Prof principal (finalisation bulletin de sa classe)
- Censeur (validation sur scope)
- Directeur (publication + ré-ouverture)
- Parent (lecture + téléchargement PDF)

---

## 2. Contraintes & principes

- **SaaS-first** — aucun assumption sur les données synchronisées MySQL. Tout est créable nativement, avec templates séedés pour accélérer l'onboarding
- **Mobile-first** — la saisie prof doit tourner correctement en salle des profs (PC) et à domicile (mobile). UI adaptative (grille tableur ≥ md, carte swipeable sur mobile)
- **Contrôle par workflow explicite** — le bulletin est une state machine, chaque transition est auditée et attribuée à un acteur nommé
- **Historique et audit** — modifications de notes post-publi et ré-ouvertures de bulletins sont tracées de manière granulaire (`notes_audit`, `bulletin_versions`)
- **Templates ivoiriens en défaut** — structure (Prim/Coll/Lyc), matières + coefficients, appréciations types, mentions
- **Rôles** — matrice définie dans `docs/ROLES_ET_FONCTIONNALITES.md`, appliquée via RLS Supabase + guards `<RoleGate>` en front
- **Anti-pattern AI-slop interdits** — voir design system §7
- **Un seul design system** — cohérence avec S3A/S3B (couleurs, typographies, patterns Card/Badge/Table/Wizard)

---

## 3. Décisions produit validées (matrix)

| Décision | Choix | Rationale |
|---|---|---|
| Découpage | Une seule spec globale couvrant les 4 sous-modules (paramétrage / saisie / bulletins / enrichissement parent) | Cohérence, choix explicite du user |
| App d'accueil enseignant | `apps/school` avec routing par rôle (sidebar dynamique) | Une seule app à déployer, un seul auth flow, un seul DS |
| Paradigme saisie notes | Hybride adaptatif : grille tableur ≥ md, carte élève-par-élève sur mobile | Meilleur des deux mondes, cohérent mobile-first |
| Publication note → parent | Le prof publie une éval → les notes deviennent visibles parents immédiatement (temps réel) | Modèle event-driven simple, `evaluations.is_published` déjà en DB |
| Workflow bulletin | Prof principal (finalise + appréciation générale) → Censeur (valide sur scope) → Directeur (publie) | Reflet des organisations pédagogiques réelles |
| Prof principal | `classrooms.principal_teacher_id UUID` FK → `teacher_profiles(id)`, nullable | Une source de vérité, un prof par classe |
| Sans censeur | Le gate "censeur" est sauté automatiquement, `ready_censeur` transite direct en `ready_director` | Petits établissements sans directeur adjoint |
| Ré-ouverture bulletin | Autorisée par directeur uniquement + raison obligatoire + historisée via `bulletin_versions` | Conforme aux exigences audit (v-1 conservée jusqu'à re-publi) |
| Setup pédagogique | Templates séedés par cycle + CRUD ajustement | Onboarding rapide, flexibilité conservée |
| Trigger compute bulletin | Manuel + moyennes provisoires visibles en continu via vue SQL `v_provisional_averages` | Contrôle explicite du prof principal + visibilité live pour tous |
| Absence sur éval | `is_absent = true` → ignorée dans le calcul (+ nouveau flag `is_exempted` pour dispense médicale, même comportement mais tag distinct) | Non punitif, distingue médical/sport de vraie absence |
| Édit note post-publi | Autorisé + audité dans nouvelle table `notes_audit` | Erreurs de saisie sont fréquentes, la transparence est le contrepoids |
| Barème école | Configurable via `schools.default_max_score` (défaut /20) | CI = /20 typique, contexte ouvert /10 et /100 |
| Notifications push | À chaque publi d'éval + clôture période + publi bulletin + ré-ouverture bulletin | Edge `send-push-notification` déjà en place |
| Appréciations profs | Obligatoires avant finalisation bulletin (guard sur `advance_bulletin_status → ready_censeur`) + override directeur possible | Enforce la discipline pédagogique, override pragmatique |
| Modèle appreciation | 1 classeur = 1 classe × 1 matière (par prof), grille avec colonnes contextuelles (moyennes historiques + tendance + templates + suggestion auto) | Découpage cognitif naturel du prof |
| Historique multi-période | Bulletin affiche T1, T2, T(courant) en colonnes cumulées. Moyenne annuelle sur bulletin de la dernière période | Standard francophone "bulletin cumulé" |
| Calcul moyenne annuelle | Moyenne simple des périodes publiées : (T1+T2+T3)/3 | Standard, notation "sur N périodes disponibles" si incomplet |
| Déclenchement clôture période | Multi-rôle + wizard : prof principal (sa classe), censeur (scope), directeur (école), manager (école) | Réalité opérationnelle, flexibilité pour toutes les tailles d'école |
| Calendrier différencié par classe | Table `classroom_periode_status` override du `end_date` par défaut + verrou `notes_locked` par classe | Terminale / 3e ferment plus tôt pour BAC / BEPC |
| Hub bulletins | 3 niveaux de zoom : école → niveau → classe | Vue synoptique + drill-down cohérent |
| Génération PDF | `@react-pdf/renderer` dans API route Next.js `apps/school` (runtime Node) | Composition React réutilisable, itérable, testable |
| Cache PDF | Bucket Supabase Storage `bulletins-pdf` avec RLS scopée | Signed URL pour parents, cache versionné (v1, v2…) |
| Personnalisation bulletin | Éditable par manager via `/pedagogy/bulletin-template` (logo, couleurs, signatures, seuils mentions, toggles) | Chaque école se réapproprie visuellement |
| Templates PDF | Un seul template "Standard ivoirien" en V1 | Un design robuste vaut mieux que 3 moyens |
| Features V1 in-scope | PDF export + statistiques classe + dashboard suivi saisie + personnalisation bulletin | Priorités user validées |
| Features V1 out-of-scope | Import CSV, moyennes provisoires côté parent (V1.5), graphes évolution parent (V1.5), templates PDF multiples (V2), etc. | Voir §11 non-goals |

---

## 4. Architecture — Routes & composants

### 4.1 Routes ajoutées à `apps/school`

```
apps/school/src/app/(dashboard)/dashboard/
├── pedagogy/                          → Hub Rentrée (checklist 8 étapes)
│   ├── page.tsx
│   ├── school-year/page.tsx           → Étape 1 : année active + type période
│   ├── grading/page.tsx               → Étape 2a : barème école
│   ├── bulletin-template/page.tsx     → Étape 2b : personnalisation bulletin (facultatif)
│   ├── structure/
│   │   ├── page.tsx                   → Étape 3 : arbre cycles/niveaux/classes + template loader
│   │   └── [cycleId]/page.tsx         → Détail cycle + gestion niveaux/classes
│   ├── periods/page.tsx               → Étape 4 : périodes T1..T3 ou S1/S2
│   ├── subjects/
│   │   ├── page.tsx                   → Étape 5 : template loader + CRUD matières
│   │   └── [subjectId]/page.tsx       → Détail matière
│   ├── teachers/
│   │   ├── page.tsx                   → Étape 6 : liste enseignants + invitations
│   │   └── invite/page.tsx            → Modal invitation par email
│   └── assignments/
│       ├── page.tsx                   → Étape 7 : matrice globale classe × matière × prof
│       └── [classroomId]/page.tsx     → Vue classe (matières + prof principal)
│
├── grades/                            → Module notes (prof / prof principal / direction)
│   ├── page.tsx                       → Hub notes (vue par rôle)
│   ├── entry/[classroomSubjectId]/[periodeId]/page.tsx  → Grille/carte hybride
│   ├── appreciations/[classroomSubjectId]/[periodeId]/page.tsx  → Workbook appréciations
│   ├── tracking/page.tsx              → Dashboard suivi saisie
│   └── stats/[classroomSubjectId]/[periodeId]/page.tsx  → Stats classe
│
└── bulletins/                         → Module bulletins
    ├── page.tsx                       → Hub bulletins (vue école, 3 niveaux de zoom)
    ├── close/[periodeId]/page.tsx     → Wizard clôture (4 steps)
    └── [classroomId]/[periodeId]/
        ├── page.tsx                   → Vue classe (orchestration workflow)
        └── [studentId]/page.tsx       → Bulletin élève détaillé + PDF

apps/school/src/app/api/
└── bulletins/[bulletinId]/pdf/route.ts  → Génération PDF via @react-pdf/renderer
```

### 4.2 Sidebar dynamique par rôle

Le layout `(dashboard)/layout.tsx` récupère le rôle depuis `school_staff_profiles.role` et affiche la sidebar filtrée :

| Section | Manager | Directeur | Censeur | Enseignant |
|---|:-:|:-:|:-:|:-:|
| Recouvrement | RW | R | — | — |
| Inscription | RW | R | R (scope) | — |
| Rentrée (hub pédagogique) | RW | — | — | — |
| Notes | R (école) | R (école) | R (scope) | RW (ses classes) |
| Bulletins | R | RW publier | RW valider (scope) | RW (prof principal seulement) |

Guard : `<RoleGate roles={['manager','director']}>...</RoleGate>` masque les items non autorisés.

### 4.3 Composants métier clés

#### Setup (Rentrée pédagogique) — `dashboard/pedagogy/_components/`

- `PedagogyChecklist` — hub principal, 8 cartes cliquables avec statuts (fait / partiel / à faire / verrouillé / facultatif)
- `StructureTree` — arbre cycles → niveaux → classes, bouton "Charger template Ivorien Prim/Coll/Lyc"
- `PeriodesForm` — formulaire dynamique 2 ou 3 périodes selon `school_years.periode_type`
- `SubjectsList` + `SubjectEditor` (coefficient + max_score + group)
- `TeachersTable` — liste + statut invitation ("En attente", "Actif") + action "Renvoyer"
- `InviteTeacherModal` — email + choix personnel existant (dropdown) ou création nouveau
- `AssignmentsMatrix` — grille virtualisée classe × matière avec dropdown prof, `react-window` pour les grandes écoles
- `PrincipalTeacherPicker` — par classe, dropdown filtré sur profs affectés à la classe
- `BulletinTemplateEditor` — form multi-sections (en-tête, signatures, couleurs, mentions, toggles) + `BulletinPreviewPane` live

#### Saisie notes — `dashboard/grades/_components/`

- `NotesEntryLayout` — container qui bascule grille ↔ carte selon `useMediaQuery('(min-width: 768px)')`
- `NotesGridDesktop` — tableur, virtualisation `react-window`, nav clavier Tab/Enter/↑↓, auto-save 500ms debounce, coloration cellules (vert = saisi, orange = ABS, rouge = >max)
- `NotesCardMobile` — carte élève centrée, gros input, swipe / boutons ← Précédent · Suivant → entre élèves
- `EvaluationCreator` — modal : type (devoir/compo/examen), date, weight, max_score (hérite du barème école)
- `EvaluationPublishButton` — preview "N notes saisies / M élèves" avant confirmation
- `NoteEditModal` — édition post-publi : raison obligatoire (textarea), calls mutation avec audit
- `AppreciationsWorkbook` — grille avec colonnes contextuelles (moyennes historiques + tendance + templates + saisie auto)
- `AppreciationRow` — ligne élève avec `TendencyBadge` + textarea auto-save + suggestion contextuelle
- `AppreciationTemplatesMenu` — dropdown avec 10 templates séedés, clic remplit le champ courant
- `BulkApplyDialog` — appliquer une appréciation à tous les vides
- `SubjectClassTabs` — bascule 6e-A ↔ 6e-B ↔ 5e-A pour un même prof/matière
- `NotesTrackingMatrix` — dashboard suivi saisie, matrice classe × matière avec feux vert/orange/rouge
- `ClassStatsPanel` — histogramme (recharts) + top/flop + comparaison période précédente

#### Bulletins — `dashboard/bulletins/_components/`

- `BulletinsHubSchoolView` — vue école : ligne par période, agrégats "X/N clôturées, Y/N publiées"
- `BulletinsHubLevelView` — vue niveau : matrice niveaux × statut agrégé
- `BulletinsHubClassView` — vue classe : élèves + statut individuel + action selon rôle
- `PeriodClosureWizard` — 4 steps (scope, preview, options, exécution + récap)
- `ClosureScopeSelector` (école / niveau / classes spécifiques) + `ClosurePreviewTable` + `ClosureOptionsForm` + `ClosureRecap`
- `BulletinClassOrchestrator` — vue classe + statut par élève + `BulletinActionBar` contextuel
- `BulletinActionBar` — boutons dynamiques : "Calculer", "Finaliser", "Valider", "Publier", "Ré-ouvrir" selon rôle et statut
- `BulletinStudentDetail` — bulletin complet + appréciations éditables selon rôle + bouton PDF
- `BulletinStatusBadge` — badge avec icône et couleur pour chaque `bulletins.status`
- `BulletinVersionsHistory` — drawer latéral, timeline des versions et raisons de ré-ouverture
- `BulletinPdfButton` — trigger génération + download (signed URL)
- `ClassroomStatusBadge` — badge pour hub (gris = ouvert, orange = clôturé, bleu = calculé, violet = validation en cours, vert = publié)

### 4.4 Hooks partagés à ajouter (`packages/shared/src/hooks/`)

**Lecture** :
```
usePedagogySetupStatus(schoolId)         → état des 8 étapes du hub (vue v_pedagogy_setup_status)
useStructureTemplates()                  → templates ivoiriens disponibles
useCycles / useLevels / useClassrooms    → CRUD read (partiellement existants)
useSubjectGroups / useSubjects
useSubjectTemplates(cycleCode)
useTeachers(schoolId)                    → jointure personnel + teacher_profiles
useTeacherInvitations(schoolId)
useClassroomSubjects(classroomId)
useEvaluations(classroomSubjectId, periodeId)
useNotesForGrid(classroomSubjectId, periodeId)  → shape optimisé pour la grille (student x evaluation)
useProvisionalAverages(studentId, periodeId)    → vue v_provisional_averages
useNoteEntryProgress(classroomId?, periodeId?)  → matrice suivi
useClassStatistics(classroomSubjectId, periodeId)
useSubjectStudentContext(classroomSubjectId, periodeId)  → moyennes + tendance + saisies (workbook)
useAppreciationTemplates(schoolId)
useBulletinsByRole()                     → filtre auto sur le rôle courant
useBulletinHistory(studentId, schoolYearId)  → cumul multi-période
usePreviousSubjectAverages(studentId, subjectId, upToPeriodeOrder)
useBulletinVersions(bulletinId)
useNotesAudit(noteId)
useSchoolBulletinConfig(schoolId)
usePeriodClosureOverview(schoolId, periodeId?)
useClassroomPeriodStatus(classroomId, periodeId)
useProfClassSubjects(teacherId, periodeId)  → onglets classes d'un même prof/matière
```

**Écriture (mutations)** :
```
useSeedStructure(schoolId, templateKey)
useSeedSubjects(schoolId, templateKey)
useCreateCycle / useCreateLevel / useCreateClassroom
useCreatePeriode / useUpdatePeriode
useCreateSubject / useUpdateSubject
useInviteTeacher                         → edge function invite-teacher
useUpsertClassroomSubject                → affecte matière+prof à classe
useAssignPrincipalTeacher(classroomId, teacherId)
useCreateEvaluation / usePublishEvaluation
useSaveNotesBatch(evaluationId, notes[])
useEditNoteWithAudit(noteId, updates, reason)
useSaveAppreciation(bulletinSubjectId, text)  → auto-save
useBulkApplyAppreciation(evaluationId, text)
useTriggerBulletinCompute(classroomId, periodeId)  → edge function compute-bulletin
useAdvanceBulletinStatus(bulletinId, targetStatus, reason?)
useGenerateBulletinPdf(bulletinId)       → API route apps/school
usePreviewClosure(periodeId, scope)
useExecuteClosure(periodeId, config)
useUpdateSchoolBranding(patch)
useUpdateBulletinConfig(patch)
useUploadSchoolAsset(type, file)
useGeneratePreviewPdf(schoolId)
```

---

## 5. Modèle de données

### 5.1 Colonnes ajoutées à des tables existantes

| Table | Colonne | Type | But |
|---|---|---|---|
| `schools` | `default_max_score` | NUMERIC DEFAULT 20 | Barème école (/10, /20, /100) |
| `schools` | `display_name` | TEXT | Nom affiché sur le bulletin (défaut = name) |
| `schools` | `motto` | TEXT | Devise / slogan |
| `schools` | `address` | TEXT | Adresse physique multi-ligne |
| `schools` | `postal_address` | TEXT | Adresse postale (BP), distincte de l'adresse physique (usage CI) |
| `schools` | `phone` / `email` | TEXT | Coordonnées |
| `schools` | `accreditation_number` | TEXT | Numéro d'agrément (obligatoire CI officiel) |
| `schools` | `accent_color` | TEXT DEFAULT '#E97423' | Couleur d'accent bulletin |
| `schools` | `logo_url` / `stamp_url` / `director_signature_url` | TEXT | URLs Storage `school-assets` |
| `schools` | `bulletin_config` | JSONB | Voir §5.2 pour le shape |
| `schools` | `structure_seeded_from` | TEXT | Template utilisé pour la structure (`ivorien_college`…) |
| `school_years` | `periode_type` | TEXT CHECK IN ('trimestre','semestre') | Cadre le nombre de périodes de l'étape 4 |
| `cycles` / `levels` / `classrooms` | `created_natively` | BOOLEAN DEFAULT true | Flag SaaS-native vs sync legacy |
| `classrooms` | `principal_teacher_id` | UUID FK → `teacher_profiles(id)` nullable | Prof principal de la classe |
| `teacher_profiles` | `signature_url` | TEXT nullable | Signature scannée du prof principal pour bulletin PDF (Storage `school-assets`) |
| `students` | `student_type` | TEXT CHECK IN ('affected', 'not_affected', 'social_case') DEFAULT 'not_affected' | Type d'élève (affecté d'État / non-affecté / cas social). Transverse — utilisé par S3B (capture inscription, à patcher), S3A (filtre recouvrement), S3D (affichage bulletin). |
| `notes` | `is_exempted` | BOOLEAN DEFAULT false | Dispense (médicale, sport) |
| `notes` | `updated_by` | UUID FK → `auth.users(id)` nullable | Audit trail |
| `bulletins` | `status` | TEXT enum ('draft','ready_censeur','ready_director','published') DEFAULT 'draft' | State machine |
| `bulletins` | `finalized_by` / `finalized_at` | UUID + TIMESTAMPTZ | Prof principal qui a lancé compute |
| `bulletins` | `validated_by` / `validated_at` | UUID + TIMESTAMPTZ | Censeur qui a validé |
| `bulletins` | `published_by` / `published_at` | UUID + TIMESTAMPTZ | Directeur qui a publié |
| `bulletins` | `current_version` | INTEGER DEFAULT 1 | Pointe la dernière version dans `bulletin_versions` |
| `bulletins` | `annual_average` | NUMERIC nullable | Rempli uniquement au publish du dernier bulletin de l'année |

### 5.2 Shape de `schools.bulletin_config` (JSONB)

```json
{
  "show_class_stats": true,
  "show_rank": true,
  "show_absences": false,
  "mention_thresholds": {
    "excellent": 16,
    "bien": 14,
    "assez_bien": 12,
    "passable": 10
  },
  "mention_labels": {
    "excellent": "Excellent",
    "bien": "Bien",
    "assez_bien": "Assez bien",
    "passable": "Passable",
    "insuffisant": "Insuffisant"
  },
  "show_student_type": false,
  "student_type_labels": {
    "affected": "Élève affecté d'État",
    "not_affected": "Élève non-affecté",
    "social_case": "Cas social"
  },
  "legal_footer": ""
}
```

### 5.3 Nouvelles tables

| Table | Colonnes principales | But |
|---|---|---|
| `notes_audit` | `id, note_id, old_score, new_score, old_is_absent, new_is_absent, old_is_exempted, new_is_exempted, changed_by, changed_at, reason` | Historique modifs post-publi |
| `bulletin_versions` | `id, bulletin_id, version_number, snapshot JSONB, published_by, published_at, reason_for_edit` | Historique publi/re-publi |
| `teacher_invitations` | `id, personnel_id, email, invited_by, invited_at, accepted_at, token, expires_at` | Flow invitation email profs |
| `subject_templates` | `id, cycle_code, name, default_coefficient, default_group_name, "order"` | Templates matières par cycle (séedés) |
| `structure_templates` | `id, template_key, cycle_code, level_code, level_order, level_name` | Templates niveaux par cycle (séedés) |
| `appreciation_templates` | `id, school_id (NULLABLE), label, text, "order"` | Templates appréciations profs. `school_id NULL` = template global séedé disponible pour toutes les écoles ; non-null = template custom école. `useAppreciationTemplates(schoolId)` retourne l'union global + école. |
| `classroom_periode_status` | `id, classroom_id, periode_id, actual_end_date, notes_locked, locked_at, locked_by, closure_wizard_run_id, UNIQUE(classroom_id, periode_id)` | Override calendrier + verrou par classe |

### 5.4 Nouvelles vues SQL

| Vue | But | Consommateur |
|---|---|---|
| `v_provisional_averages` | Moyennes matière provisoires calculées à la volée sur `notes` publiées (sans passer par `bulletins`) | Dashboard suivi saisie + parent app V1.5 |
| `v_pedagogy_setup_status` | État des 8 étapes du hub par école (fait / partiel / à faire / verrouillé / facultatif) | Hub Rentrée |
| `v_note_entry_progress` | Matrice classe × matière × période avec compteurs d'évals publiées et notes saisies | Dashboard suivi + workbook appréciations |
| `v_class_statistics` | Moyennes, médiane, quartiles, distribution par matière/période | `ClassStatsPanel` |
| `v_bulletin_history` | Toutes les données de bulletins publiés d'un élève sur l'année (join `bulletins` + `bulletin_subjects` + `periodes`) | `useBulletinHistory` (parent + workbook + PDF) |
| `v_period_closure_overview` | Agrégat école → niveau → classe pour hub bulletins | Hub 3 niveaux de zoom |

### 5.5 Fonctions SQL

| Fonction | But | Statut |
|---|---|---|
| `compute_bulletin(classroom_id, periode_id)` | Existante — calcul moyennes matière + générale + rang + stats classe | Ajustement mineur : filtrer par `school_year_id` implicite via `periode` |
| `advance_bulletin_status(bulletin_id, target, actor_id, reason?)` | Nouvelle — transitions state machine + write dans `bulletin_versions`, verrou pessimiste `SELECT ... FOR UPDATE` | À écrire |
| `seed_pedagogy_for_school(school_id, cycle_code)` | Nouvelle — insère `subject_groups` + `subjects` depuis templates | À écrire |
| `seed_structure_for_school(school_id, template_key)` | Nouvelle — insère `cycles` + `levels` + `classrooms` depuis templates | À écrire |
| `close_period_for_classrooms(periode_id, classroom_ids[], actor_id, config)` | Nouvelle — orchestre le wizard clôture : insert `classroom_periode_status`, lock notes, trigger `compute_bulletin()` en batch, envoi notifs | À écrire |
| `compute_annual_average(bulletin_id)` | Nouvelle — calcule moyenne simple des périodes publiées, écrit dans `bulletins.annual_average` | À écrire |

### 5.6 State machine `bulletins.status`

```
                            ┌─────────────────────┐
                            │  compute_bulletin() │
        ┌───────────────────┤   → draft            │◄──────────────┐
        │                   └──────────┬──────────┘                │
        │                              │                            │
        │        [Prof principal :     │ finalize()                 │
        │         appréciation +       │ (guard : 100% appr. OK)    │
        │         finaliser]           ▼                            │
        │                   ┌─────────────────────┐                 │
        │                   │  ready_censeur      │                 │
        │                   └──────────┬──────────┘                 │
        │                              │                            │
        │        skip_if_no_censeur    │ validate()                 │
        │        ─────────────────►    │                            │
        │                              ▼                            │
        │                   ┌─────────────────────┐                 │
        │                   │  ready_director     │                 │
        │                   └──────────┬──────────┘                 │
        │                              │                            │
        │                              │ publish()                  │
        │                              ▼                            │
        │                   ┌─────────────────────┐                 │
        │                   │  published          │                 │
        │                   └──────────┬──────────┘                 │
        │                              │                            │
        │                              │ reopen(reason)             │
        └──────────────────────────────┘  version_number++  ────────┘
```

Invariants (enforcer via `advance_bulletin_status` + triggers) :
- Un prof ne peut créer/modifier une `note` si `classroom_periode_status.notes_locked = true` **sauf** via édit-post-publi audité
- Édit post-publi met le bulletin de l'élève en `draft` avec `current_version++` (au prochain publish)
- `advance_bulletin_status(→ ready_censeur)` refuse si `bulletin_subjects.teacher_appreciation` est null pour au moins une matière (sauf override directeur avec raison)
- `advance_bulletin_status(→ published)` sur le bulletin de la dernière période de l'année déclenche `compute_annual_average()`
- Bulletin ré-ouvert (retour à `draft` depuis `published`) maintient la v-1 visible parent jusqu'à re-publish (via PDF déjà dans Storage à `-v1.pdf`)
- Accès concurrent : verrou pessimiste `SELECT ... FOR UPDATE` sur `bulletins` dans `advance_bulletin_status`

---

## 6. Workflow bulletin détaillé

### 6.1 Cycle de vie temporel

**Phase 1 — Période en cours**
- Les profs saisissent + publient les évaluations au fil de l'eau
- Notes visibles parents en temps réel à chaque publication d'éval
- Moyennes provisoires visibles au prof principal via `v_provisional_averages`
- Push notif parent `evaluation_published` à chaque publi

**Phase 2 — Clôture (wizard multi-rôle)**

Déclencheurs autorisés :
- Prof principal : sa classe uniquement
- Censeur : classes de son scope (`vice_principal_scopes`)
- Directeur : toutes les classes de l'école
- Manager : toutes les classes de l'école

Wizard `/bulletins/close/[periodeId]` en 4 étapes :
1. **Scope** — radio (école / niveau / classes) + multi-select classes
2. **Preview** — table classes ciblées avec évals publiées vs attendues, alertes profs muets, classes déjà clôturées skippées
3. **Options** — date effective de clôture (défaut = aujourd'hui, éditable), toggle "Forcer même si évals incomplètes" (confirmation obligatoire), message personnalisé pour la notif
4. **Exécution + récap** — insert `classroom_periode_status` + trigger `compute_bulletin()` batch + notif push aux profs concernés (`closure` type)

Résultat : `classroom_periode_status.notes_locked = true`, `bulletins.status = 'draft'` pour tous les élèves de la classe.

**Phase 3 — Saisie appréciations (obligatoire)**

Chaque prof va sur `/grades/appreciations/[classroomSubjectId]/[periodeId]` :
- Modèle : 1 classeur = 1 classe × 1 matière (par prof)
- Grille avec colonnes contextuelles : moyennes historiques (T1, T2…), tendance vs période précédente, alerte "En baisse" (>2 pts), champ appréciation avec auto-save
- Templates cliquables (10 séedés) + suggestion contextuelle selon moyenne + "Appliquer à tous les vides"
- Onglets classes pour le même prof/matière (bascule 6e-A ↔ 6e-B)
- Voice-to-text mobile (Web Speech API)
- Progress bar par classe + total prof

Prof principal voit dashboard "8/12 profs ont saisi" avec bouton "Relancer" par prof retardataire.

**Phase 4 — Validation hiérarchique**

Guard `finalize()` : refus si `bulletin_subjects.teacher_appreciation IS NULL` pour au moins une matière (sauf override directeur avec raison).

Prof principal :
- Rédige `bulletins.general_appreciation`
- Clique "Finaliser" → `advance_bulletin_status(→ ready_censeur)`

Censeur (si scope) :
- Voit les bulletins de son scope en `ready_censeur`
- Peut réviser individuellement ou valider en batch
- Clique "Valider" → `advance_bulletin_status(→ ready_director)`

Si aucun censeur ne couvre la classe (vérifié via `vice_principal_scopes`) : `advance_bulletin_status(finalize)` transite directement en `ready_director`.

Directeur :
- Voit les bulletins en `ready_director`
- Rédige optionnellement `bulletins.principal_appreciation`
- Clique "Publier" → `advance_bulletin_status(→ published)` :
  - `bulletin_versions v1` créée (snapshot JSONB de tout le bulletin)
  - Génération PDF déclenchée (`useGenerateBulletinPdf`)
  - Notif push `bulletin_published` aux parents
  - Si dernière période de l'année : `compute_annual_average()` déclenché

**Phase 5 — Ré-ouverture (rare, auditée)**

Directeur seul, depuis `BulletinStudentDetail` :
- Clique "Ré-ouvrir" → modal avec raison obligatoire
- Action `reopen_bulletin(bulletin_id, actor_id, reason)` → `status` retourne à `draft` (pas de state `reopened` séparé, c'est une transition inverse depuis `published`)
- `current_version` reste inchangé jusqu'à re-publish (le bump à `current_version + 1` s'opère lors du prochain `advance_bulletin_status(→ published)`)
- PDF v-1 reste disponible parent jusqu'à re-publish (le nouveau PDF sera écrit avec `-v2.pdf` au chemin `bulletins-pdf/…`)
- Notif push `bulletin_revised` à la re-publi (pas à la ré-ouverture — le parent ne voit rien tant que le nouveau bulletin n'est pas publié)

### 6.2 Matrice de visibilité + actions par rôle et par statut

| Statut → | draft | ready_censeur | ready_director | published |
|---|---|---|---|---|
| **Prof matière** | R stats · RW appréciation sa matière | R | R | R |
| **Prof principal** | RW appréciation générale · action `finalize()` | R (verrouillé) | R | R |
| **Censeur (scope)** | R | RW · action `validate()` | R | R |
| **Directeur** | R | R | RW appréciation dir. · action `publish()` | R · action `reopen()` |
| **Parent** | ❌ | ❌ | ❌ | ✓ + push + PDF |

### 6.3 Notifications déclenchées (via `send-push-notification`)

| Type | Événement | Destinataires | Canal | CTA |
|---|---|---|---|---|
| `evaluation_published` | Phase 1 : publi éval | Parents des élèves notés | Push | `/grades?child={id}` |
| `closure` | Phase 2 : clôture période | Tous les profs de la classe | Push + email | `/grades/appreciations/…` |
| `appreciation_reminder` | Phase 3 : rappel prof retardataire | Prof concerné | Push (déclenché par prof principal ou J+2 auto) | `/grades/appreciations/…` |
| `bulletin_published` | Phase 4 : publi bulletin | Parents des élèves | Push | `/grades?child={id}&tab=bulletin` |
| `bulletin_revised` | Phase 5 : ré-ouverture puis re-publi | Parents des élèves | Push | `/grades?child={id}&tab=bulletin` |

---

## 7. Génération PDF & personnalisation

### 7.1 Architecture rendering

- **Runtime** : Node.js dans une API route Next.js de `apps/school` (pas edge Supabase)
- **Moteur** : `@react-pdf/renderer` (composition React, Font.register pour Inter, styles inline objet)
- **Route** : `apps/school/src/app/api/bulletins/[bulletinId]/pdf/route.ts`
- **Trigger** : appelée par `advance_bulletin_status(→ published)` via server action ou côté client immédiatement après le clic "Publier"

### 7.2 Storage bucket `bulletins-pdf` (privé)

Nomenclature : `bulletins-pdf/{school_id}/{school_year_id}/{periode_id}/{student_id}-v{version}.pdf`

RLS policies :
- `parent` : peut lister/télécharger uniquement les fichiers dont `student_id` appartient à ses enfants (helper `get_parent_student_ids()`)
- `school_staff` (`manager`/`director`/`censor`) : lecture école
- `teacher` : lecture uniquement pour ses élèves (via `classroom_subjects.teacher_id`)

Signed URL générée à la demande via `Storage.createSignedUrl(path, 3600)` (expiry 1h).

### 7.3 Structure du PDF (ordre standard ivoirien)

1. **En-tête** : logo école (avatar generic si absent), nom école (`display_name` ou `name`), ville, année scolaire, nom de la période
2. **Bloc élève** : nom + prénom, matricule, classe, effectif, date de naissance, sexe. Si `bulletin_config.show_student_type = true`, ligne supplémentaire "Statut : {student_type_labels[students.student_type]}".
3. **Tableau des matières** (groupé par `subject_group`) :
   - Colonnes fixes : Matière | Coef | Moyenne courante | Rang | Appr. prof
   - Colonnes optionnelles (`bulletin_config.show_class_stats`) : Min | Max | Moy classe
   - Colonnes historiques (si période > T1) : T1, T2… intercalées
4. **Ligne synthèse** : Moyenne générale | Rang (`bulletin_config.show_rank`) | Total coef | Moy classe | Mention (calculée depuis `bulletin_config.mention_thresholds`)
5. **Si dernière période** : ligne supplémentaire "Moyenne annuelle" + éventuel champ "Décision de passage" (V1.5, out V1)
6. **Cadre appréciation générale** (prof principal, `bulletins.general_appreciation`)
7. **Cadre appréciation du chef d'établissement** (`bulletins.principal_appreciation`, si remplie)
8. **Absences / retards** (masqué si `bulletin_config.show_absences = false` ou module attendance inactif)
9. **Footer** : date d'édition, version (v1, v2…), signatures (image `schools.director_signature_url` + `teacher_profiles.signature_url` du prof principal si upload), `bulletin_config.legal_footer`, mention "Document généré par Edukea"

### 7.4 Personnalisation par école

Éditeur `/pedagogy/bulletin-template` accessible depuis étape 2b du hub (statut "Facultatif").

Champs personnalisables (voir §5.1 pour le stockage) :
- **En-tête** : logo, nom, motto, adresse, téléphone, email, agrément, couleur d'accent
- **Signatures** : directeur, prof principal (par personnel), cachet école
- **Config bulletin** (JSONB) : toggles show_class_stats / show_rank / show_absences, seuils et labels mentions, footer légal
- **Preview live** : `BulletinPreviewPane` mini + `GeneratePreviewPdfButton` (PDF réel avec données fictives "Élève Exemple")

Un seul template PDF en V1 ("Standard ivoirien"). Choix multiples → V2.

---

## 8. Enrichissements parent app (`apps/parent`)

Existant : `/grades` avec onglets Notes + Bulletin fonctionnels en lecture (déjà en place, cf. `useGrades`, `useBulletin`, `usePeriodes`).

### 8.1 Ajouts V1

| Ajout | Détail |
|---|---|
| **Bouton "Télécharger PDF"** | Sur bulletin publié. Appelle `Storage.createSignedUrl(bulletinsPdfPath, 3600)`. Icône `Download` lucide. |
| **Tableau bulletin cumulé** | Colonnes T1, T2, T3 dynamiques selon `periode.order`. Utilise `useBulletinHistory`. |
| **Ligne "Moyenne annuelle"** | Bulletin de la dernière période (`bulletins.annual_average`). |
| **Badge "Bulletin corrigé"** | Si `current_version > 1`. Tooltip avec date re-publi + raison (`bulletin_versions.reason_for_edit`). |
| **Onglet "Historique"** (nouveau) | Liste périodes de l'année avec statut + bouton PDF par bulletin publié. |

### 8.2 Notifications push riches

Trois nouveaux types à câbler dans le dispatcher `send-push-notification` (déjà présent) :

| Type | Titre | Corps |
|---|---|---|
| `evaluation_published` | Nouvelle note en {matière} | {éval.name} : {student} a obtenu {score}/{max} |
| `bulletin_published` | Bulletin {période} disponible | Moyenne : {avg}/{max} · Rang {rank} |
| `bulletin_revised` | Bulletin {période} corrigé | Une nouvelle version est disponible |

### 8.3 Ajouts V1.5 (hors sprint 3D, à décider en fin de sprint)

- **Graphique d'évolution** matière par matière période par période (recharts `<LineChart>`)
- **Moyennes provisoires** pendant la période courante (`useProvisionalAverages`) — à valider politiquement avec écoles pilotes
- **Décision de passage** dans le bulletin annuel

---

## 9. Migration écoles legacy (sync MySQL)

Les 3 écoles pilotes existantes (Akonda et al.) tournent en mode legacy sync MySQL sans configuration Edukea native. Il faut un script one-off dans `supabase/migrations/00035_seed_legacy_schools.sql` (ou numéro suivant) qui :

1. Marque `cycles.created_natively = false`, `levels.created_natively = false`, `classrooms.created_natively = false` pour toutes les data existantes
2. Crée `periodes` par défaut (T1/T2/T3 avec dates estimées de l'année en cours pour chaque école) — set `school_years.periode_type = 'trimestre'` par défaut
3. Applique un template de matières (Ivorien Collège par défaut) via `seed_pedagogy_for_school()` pour chaque école
4. Laisse le manager finaliser via le hub Rentrée (statut "Partiel" sur les étapes déjà pré-remplies)

Ce script tourne une seule fois post-déploiement. Le manager de chaque école pilote reçoit un email d'onboarding avec lien vers le hub.

---

## 10. Découpage de livraison

6 phases séquentielles, chacune shippable et testable indépendamment. Chaque phase = 1 milestone git `milestone: S3D.N ...`.

| # | Phase | Contenu | Valeur au ship | Taille |
|---|---|---|---|---|
| **3D.1** | **Fondations DB + squelette hub** | Toutes migrations (nouvelles tables, colonnes, vues, fonctions SQL, seeds templates). Hub Rentrée cliquable avec checklist stub. RLS de base. | Manager voit le hub, comprend les 8 étapes. | S |
| **3D.2** | **Setup structure école** (étapes 1, 2a, 3) | Année scolaire + type période. Barème école. Structure : template loader + CRUD cycles/niveaux/classes. | École vierge peut monter sa structure via template en 5 min. | M |
| **3D.3** | **Setup pédagogique** (étapes 4-7) | Périodes. Matières + coefficients (templates + CRUD). Invitations profs (edge `invite-teacher`). Matrice affectations + prof principal. | École a fini onboarding, prête à recevoir des notes. | L |
| **3D.4** | **Saisie enseignant** | Routing par rôle. `NotesGridDesktop` + `NotesCardMobile`. Création évals. Auto-save. Édit post-publi audité. Notif push `evaluation_published`. Vue provisoires. | Profs saisissent + publient, parents voient temps réel. | L |
| **3D.5** | **Personnalisation bulletin + PDF renderer** (étape 2b) | Éditeur `/pedagogy/bulletin-template` + uploaders + preview live. Bucket `school-assets`. API route Next.js `/api/bulletins/[id]/pdf` avec `@react-pdf/renderer`. Bucket `bulletins-pdf` + RLS. | Bulletin peut être généré à la demande (preview manager). | M |
| **3D.6** | **Workflow bulletin complet** | Wizard clôture. `classroom_periode_status`. State machine `advance_bulletin_status()`. Hub `/bulletins` 3 niveaux de zoom. Workbook appréciations. Dashboard suivi. Stats classe. Notifs. Auto-gen PDF au publish. Enrichissements parent app. | Cycle complet fonctionnel : clôture → appréciations → validation → publication → parent notifié + PDF. | XL |

**Effort relatif** : S ≈ 1×, M ≈ 2×, L ≈ 3×, XL ≈ 5×. Total ≈ 16×.

**Dépendances** :
```
3D.1 → 3D.2 → 3D.3 → 3D.4 ─┐
                            ├─► 3D.6
                     3D.5 ──┘
```
3D.5 peut démarrer en parallèle de 3D.4 (ne dépend que du schéma shipped en 3D.1 et de la config école shipped en 3D.2).

---

## 11. Non-goals V1 (explicitement OUT du sprint)

| Feature | Motif d'exclusion | Cible |
|---|---|---|
| Import CSV de notes | Complexité matching + gestion erreurs. Le prof saisit à la main en V1. | V2 |
| Moyennes provisoires côté parent | Sensible politiquement. À co-décider avec écoles pilotes. | V1.5 |
| Graphes d'évolution parent (recharts) | Cosmétique, non critique. | V1.5 |
| Choix de templates PDF multiples | Un seul template robuste V1. | V2 |
| Signatures électroniques cryptographiques | Complexité juridique. Signature image suffit V1. | V3 |
| Export XLSX des bulletins par classe | Cas d'usage rare. | V2 |
| Bulletin cycle Maternelle qualitatif | Cible V2 : bulletin sans notes, uniquement appréciations. | V2 |
| Rôle élève (self-service) | Pas de rôle élève V1. | V3 |
| Attendance dans le PDF | Dépend du module attendance non-shipped. | Croiser dès attendance V1 |
| Décision de passage/redoublement liée au bulletin annuel | Traité dans S3B via `enrollment_transitions`. | S3B+ |
| Templates appréciation multilingues | Français uniquement V1. | V3 |
| PDF paginé pour très grandes classes | 40 élèves = 1-2 pages A4. | V2 |
| Bulletin annuel séparé (document dédié) | Moyenne annuelle est dans bulletin dernière période V1. | V2 |
| Dashboard audit trail cross-écoles côté fondateur | Table `notes_audit` existe mais pas de vue fondateur. | Module Fondateur dédié |
| Capture du `students.student_type` à l'inscription | Le champ est ajouté par S3D en DB, mais la mise à jour du wizard d'inscription (StepStudent) est un **patch S3B.1** distinct. En attendant, éditable à la main via un écran fiche élève à créer ou par backfill. | S3B.1 |
| Filtre recouvrement par `student_type` | Les affectés d'État sont payés par le gouvernement, ne doivent pas apparaître dans le recouvrement standard. → **Patch S3A.1**. | S3A.1 |

---

## 11.b Prérequis explicites hors S3D

S3D assume que **l'école existe déjà en DB** et que **le manager dispose d'un compte Supabase Auth avec `school_staff_profiles.role = 'manager'`**. Le module de création d'école (nom, email, téléphone, adresses, représentant + mdp, config CinetPay, logo initial) est **repoussé dans un Sprint 3E dédié** (module Fondateur / Admin, opéré depuis `apps/admin`).

**Impact sur l'ordonnancement des livraisons** :
- S3D peut démarrer sans attendre S3E, car les 3 écoles pilotes existent déjà via sync legacy
- Pour les nouvelles écoles à onboarder pendant la fenêtre S3D → S3E, une création SQL manuelle ou un stub admin minimal fera transition
- S3E héritera de la responsabilité de câbler : `auth.users` du représentant, `school_staff_profiles` avec role manager, seed initial `schools`, coordonnées de base

**Colonnes ajoutées par S3D à `schools` que S3E pourra pré-remplir** :
- `email`, `phone`, `address`, `postal_address`, `motto`, `logo_url`, `accreditation_number`
- La config CinetPay (`cinetpay_api_key`, `cinetpay_site_id`) reste de la responsabilité du **module paiement** — probablement colonnes existantes issues du sync, à confirmer S3E

**Ce que le manager peut compléter dans S3D** :
- Toutes les colonnes branding (`display_name`, `motto`, `address`, `postal_address`, `logo_url`, `stamp_url`, `director_signature_url`, `accent_color`, `bulletin_config`) via l'éditeur `/pedagogy/bulletin-template` (étape 2b, facultative)

**Backfill data one-off à prévoir en 3D.1** :
- Marquer tous les `students` existants à `student_type = 'not_affected'` par défaut. L'école ajustera les cas via un écran fiche élève (édition ponctuelle) — écran à cadrer dans **S3B.1**.

---

## 12. Risques identifiés

- **Performance grille de saisie** avec 40+ élèves × 6+ évals : virtualisation `react-window` obligatoire dès V1, benchmarks à faire pendant 3D.4
- **Coût génération PDF en batch** : publier 40 bulletins d'une classe déclenche 40 générations. Solution V1 : queue asynchrone via Postgres trigger `bulletins.status = 'published'` + edge function polling, PDF disponibles J+quelques minutes (parent voit "Génération en cours" pendant ce laps)
- **RLS complexes** sur les 3 niveaux de zoom bulletins (censeur voit sur scope, prof principal voit ses classes). Tests rigoureux, notamment `get_censor_scope(auth.uid())`
- **State machine incohérente** en cas d'accès concurrent (2 profs ré-modifient une note pendant que le prof principal finalise). Solution : verrou pessimiste `SELECT ... FOR UPDATE` dans `advance_bulletin_status()`
- **Migration écoles legacy** : script one-off (§9) doit être testé sur staging avant prod, avec rollback prévu
- **Personnalisation bulletin non-triviale** : le manager peut mal configurer les seuils de mention. Validation front + backend obligatoire (excellent ≥ bien ≥ assez_bien ≥ passable)
- **Storage `bulletins-pdf` grossit vite** : 500 élèves × 3 périodes × plusieurs versions = ~1500-3000 PDF/an/école. Politique de rétention à définir V2 (probablement garder tous les publiés)
- **Voice-to-text mobile** : dépend du navigateur (Chrome/Safari). Fallback textarea classique si `webkitSpeechRecognition` indisponible
- **Édition d'une note post-publi qui affecte un bulletin déjà publié** : décision retenue = bulletin revient en `draft`, `current_version` bumpé au prochain publish. Nécessite badge alerte visible pour le directeur
- **Table `vice_principal_scopes` prérequise** pour la résolution du scope censeur (§4.2, §6.1 phase 4) : cette table n'existe pas encore dans les migrations. Elle doit être créée pendant la phase 3D.1 (fondations) même si le rôle censeur n'est pas encore utilisé opérationnellement — sinon toute la matrice de visibilité et le workflow bulletin échouent

---

## 13. Références

- Rôles et fonctionnalités : `docs/ROLES_ET_FONCTIONNALITES.md`
- Design system : `docs/superpowers/specs/2026-07-18-design-system-edukea-design.md`
- Sprint 3B (inscription) : `docs/superpowers/specs/2026-07-20-inscription-reinscription-passage-design.md`
- Migrations existantes : `supabase/migrations/00002_grades_system.sql`, `00009_functions.sql`
- Edge function existante : `supabase/functions/compute-bulletin/index.ts`
- Hooks existants : `packages/shared/src/hooks/useGrades.ts`, `useBulletin.ts`

---

*Design validé le 2026-07-20. Prochaine étape : plan d'implémentation détaillé (writing-plans).*
