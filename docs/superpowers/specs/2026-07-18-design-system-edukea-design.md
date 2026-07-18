# Design System Edukea — spec v1

**Date**: 2026-07-18
**Statut**: Design validé, en attente d'approbation utilisateur avant plan d'implémentation
**Périmètre**: Design system SaaS-grade complet — fondations (tokens), primitives, patterns métier, layout — pour les 4 apps du monorepo (`web`, `parent`, `school`, `admin`), avec priorité applicative sur `school`.

---

## 1. Contexte et objectifs

Edukea est en refonte totale. L'ancien logiciel (Laravel, ~10 ans) est utilisé quotidiennement par des chefs d'établissement privés ivoiriens, non-techies. La refonte capitalise sur React tout en préservant leurs réflexes de navigation et de vocabulaire métier.

Le positionnement produit est **« la trésorerie de votre école en temps réel »** (voir doc de stratégie `Edukea_Strategie_Lancement.docx`). Le design system doit donc servir en priorité les moments financiers : cockpit trésorerie, recouvrement, versements, ledger.

**Objectif du design system :**

- Fournir un langage visuel cohérent, distinctif et durable pour Edukea.
- Accélérer la construction des pages produit sans réinventer les composants.
- Ancrer la marque : bleu Edukea `#1D3A6B` dominant, orange `#F69F13` en accent, police Clash Display sur les moments-clés.
- Éviter le look « AI-slop SaaS générique » (petites capitales lettering-space, pastilles vertes à flèche, dots pulsés « live », etc. — voir §7).

**Non-objectifs (V1) :**

- Pas de mode sombre pour la V1 (à envisager V2). Le fond app reste clair.
- Pas d'internationalisation typographique — français uniquement (Clash Display + Inter couvrent le français ; d'autres langues seront à valider).
- Pas de motion complexe (Framer Motion) au démarrage — transitions CSS only.

---

## 2. Principes de design

Chaque décision du design system doit se justifier par au moins un de ces principes :

1. **Sérieux financier avant SaaS générique.** Les chiffres sont l'événement principal ; la mise en forme doit renforcer leur crédibilité, pas les décorer.
2. **Familier plutôt que révolutionnaire.** Un chef d'établissement qui ouvre Edukea V3 doit retrouver ses réflexes de l'ancien Laravel : nav claire, tables denses, code couleur R/J/V pour les statuts de paiement, wizard à étapes.
3. **Marque Edukea présente, jamais bavarde.** Le bleu domine la sidebar et les moments hero ; l'orange est un accent (barre latérale d'item actif, valeurs delta, badges d'alerte), jamais du gras.
4. **Densité ajustée par contexte.** Cockpit : respiration. Tables opérationnelles : densité (30+ lignes visibles).
5. **Typographie fait le travail des chrome.** On préfère une hairline et un séparateur `·` à une pastille colorée pour hiérarchiser.

---

## 3. Foundations (tokens)

### 3.1 Couleurs

Toutes les valeurs sont déjà déclarées dans `packages/shared/src/lib/brand.ts` et dans les CSS variables des `apps/*/src/app/globals.css`. Le design system les référence, ne les redéfinit pas.

| Rôle | Hex | HSL | Usage |
|---|---|---|---|
| **Primary** (Edukea blue) | `#1D3A6B` | `218 58% 27%` | Sidebar, hero KPI, boutons primaires, marque |
| **Primary deep** | `#152B52` | `218 58% 20%` | Bord droit sidebar, hover primary |
| **Accent** (Edukea orange) | `#F69F13` | `37 92% 52%` | Barre latérale item actif sidebar, delta, badges, avatars marqués |
| **Accent soft** | `#FEF1E0` | — | Fond des pills « Débuté », icônes MoMo |
| **Ink** (foreground) | `#0B1220` | — | Texte principal |
| **Ink-2** (secondaire) | `#334155` | — | Texte de contexte |
| **Ink-3** (tertiaire) | `#64748B` | — | Sous-titres, labels de card |
| **Ink-4** (fantomatique) | `#94A3B8` | — | Placeholders, séparateurs typographiques `·` |
| **Line** | `#E5E7EB` | — | Bordures cards, inputs |
| **Line soft** | `#F1F5F9` | — | Séparateurs discrets |
| **BG app** | `#F7F8FB` | — | Fond du main content |

**Sémantique statut paiement** (invariant métier, universel Côte d'Ivoire) :

| Statut | Fond pill | Texte | Dot |
|---|---|---|---|
| **Soldé** (payé complet) | `#DCFCE7` | `#166534` | `#22C55E` |
| **Débuté** (partiel) | `#FEF1E0` (accent soft) | `#B45309` | `#F69F13` (accent) |
| **Impayé** (non débuté) | `#FEE2E2` | `#B91C1C` | `#EF4444` |

Sémantique feedback système :

| Rôle | Hex |
|---|---|
| Success | `#059669` |
| Warning | `#F59E0B` |
| Danger | `#DC2626` |
| Info | `#3B82F6` |

### 3.1.bis Logo — assets et usage

Les 3 versions officielles du logo Edukea sont dans `docs/` (PNG 5400×5400 avec beaucoup d'espace blanc autour du contenu utile) :

| Fichier | Usage | Où |
|---|---|---|
| `docs/Logo Couleur.png` | Logo full color (icône hexagone gradient bleu→orange + wordmark bleu) | Topbar sur fond blanc, splash screen, favicon, header du site public `web` |
| `docs/Logo Blanc.png` | Logo tout blanc | Fond sombre (hero KPI si besoin filigrane, sidebar sombre alt, print sur foncé) |
| `docs/Logo Noir.png` | Logo tout noir | Documents imprimés, factures, exports PDF |

**Crop obligatoire avant intégration.** Les PNG bruts ont ~5.5:1 de whitespace vertical par rapport au contenu utile. Le contenu réel est un rectangle horizontal ~5.5:1. Un script de build (Python + Pillow, ou équivalent Node/sharp) détecte le bbox et produit `logo-color.png`, `logo-white.png`, `logo-black.png` en versions cadrées (avec ~10% de marge autour du contenu).

**Livraison dans le monorepo** : les 3 fichiers croppés sont livrés en `packages/ui/assets/` (les originaux non croppés restent dans `docs/` comme source de vérité pour re-cropper si besoin). Idéalement remplacés par des SVG à terme.

**Emplacement UI** : Logo Couleur (croppé) est utilisé **exclusivement dans le topbar** sur fond blanc, dans un slot à gauche aligné sur la largeur de la sidebar (232px). Aucun logo en sidebar (le workspace label prend cette place — voir §4.3).

**Règles d'usage** (rappel charte p.8) :
- Ne pas changer la couleur d'un élément, ne pas retirer d'élément, ne pas changer la police, ne pas déplacer d'élément.
- Hauteur minimale recommandée : 24px (l'hexagone devient illisible en dessous).
- Marge de protection : ~10% de la hauteur du logo autour (déjà encodée dans le crop).

### 3.2 Typographie

| Famille | Usage | Import |
|---|---|---|
| **Clash Display** (Fontshare, weights 400/500/600/700) | Titres de page, titres de card, valeurs chiffrées, marque | `@import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap');` |
| **Inter** (Google Fonts, weights 300/400/500/600/700/800) | Texte courant, corps de tables, labels, form controls | déjà importé |

**Règle stricte** : Clash Display n'est **jamais** utilisée pour du body ou du texte long. Elle est réservée aux :

- Titres de page (H1 : 22-28px, weight 600)
- Titres de card (16px, weight 600)
- Valeurs numériques KPI (22-56px, weight 600-700)
- Valeurs numériques dans les tables (14px, weight 600, tabular-nums)
- Marque « Edukea » (18px, weight 700, couleur primary)

**Échelle typographique de base (Inter par défaut sauf mention) :**

| Token | Taille | Poids | Line-height | Usage |
|---|---|---|---|---|
| `display-lg` (Clash) | 56 | 700 | 1 | Hero value |
| `display-md` (Clash) | 32-40 | 700 | 1 | Ring center, KPI hero secondaire |
| `heading-lg` (Clash) | 22 | 600 | 1.2 | Titre de page |
| `heading-md` (Clash) | 16 | 600 | 1.3 | Titre de card |
| `heading-sm` (Clash) | 15 | 600 | 1.3 | Label KPI |
| `body-md` | 14 | 400 | 1.5 | Corps courant |
| `body-sm` | 13 | 400 | 1.5 | Sous-titres, contexte |
| `body-xs` | 12 | 500 | 1.4 | Labels de champ, sub-info avatar |
| `caption` | 11 | 500 | 1.4 | Meta lignes tables |

**Interdits typographiques** (voir §7) :

- Aucun label produit en `text-transform: uppercase` + `letter-spacing`. Sentence case uniquement.
- Aucun mélange de weight aléatoire sur une même hiérarchie.

### 3.3 Espacement

Échelle 4px de base, tokens tailwind équivalents :

`0, 1 (4), 2 (8), 3 (12), 4 (16), 5 (20), 6 (24), 8 (32), 10 (40), 12 (48), 16 (64), 20 (80)`

**Rythme par contexte :**

| Contexte | Padding intérieur | Gap enfants |
|---|---|---|
| Card standard | 20px | 12px |
| Card KPI | 18px 20px | 8px |
| Card hero KPI | 26px 28px | — |
| Table row | 14px 20px | 14px |
| Sidebar item | 10px 12px | 11px |
| Bouton (medium) | 8px 14px | 6px |
| Input | 8px 12px | — |

### 3.4 Rayons de bordure (radius)

| Token | Valeur | Usage |
|---|---|---|
| `radius-sm` | 6px | Badges, tags |
| `radius-md` | 10px | Boutons, inputs, icônes carrées |
| `radius-lg` (existant `--radius: 0.75rem` = 12px) | 12px | Sparkline card, mockup subs |
| `radius-xl` | 16px | Cards standard |
| `radius-2xl` | 20px | Cards hero KPI, stage container |
| `radius-full` | 9999px | Pills status, avatars, badges compteurs |

### 3.5 Ombres (elevation)

Système à 3 niveaux + une ombre marquante pour le hero :

| Token | Usage | Valeur |
|---|---|---|
| `shadow-flat` | Card standard au repos | `0 1px 3px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.08)` |
| `shadow-hover` | Card lifted au hover | `0 4px 12px rgba(15,23,42,0.06), 0 16px 40px -12px rgba(15,23,42,0.14)` |
| `shadow-hero` | Hero KPI, moment brand | `0 24px 60px -24px rgba(29,58,107,0.45), 0 6px 16px -8px rgba(29,58,107,0.20)` |
| `shadow-stage` | Container overall | `0 40px 80px -40px rgba(15,23,42,0.25), 0 20px 40px -20px rgba(15,23,42,0.10)` |

### 3.6 Motion

- Transition standard : `transition: all 0.15s;`
- Card hover lift : `transform: translateY(-2px)` + `shadow-hover`
- Sidebar item hover : background transition `0.15s`
- **Pas de motion élaborée V1.** Framer Motion à envisager V2 uniquement si un besoin explicite émerge.

---

## 4. Layout patterns

### 4.1 AppShell (structure applicative)

Grille globale de toutes les pages de `apps/school` (et clonable pour `admin`, `parent`) :

```
┌─────────────────────────────────────────────────┐
│  Topbar (blanc, 62px)                           │
├──────────┬──────────────────────────────────────┤
│ Sidebar  │  Main content                        │
│ 232px    │  (padding 24px 28px)                 │
│ sombre   │                                      │
│ bleu     │                                      │
│ Edukea   │                                      │
└──────────┴──────────────────────────────────────┘
```

### 4.2 Topbar

- Fond blanc, bordure basse `line`, hauteur **72px**.
- **Gauche — slot brand de 232px** (même largeur que la sidebar, alignement des colonnes) : Logo Couleur croppé (`packages/ui/assets/logo-color.png`) rendu avec `max-width: 180px; height: auto` et centré vertical/horizontal. Le slot est séparé du reste par une bordure droite `line`.
- **Droite** : deux `ContextPill` (année scolaire, type d'école) + avatar utilisateur (36×36, `accent`).
- **Anti-pattern strict** : aucun logo partenaire/tiers en top-right (l'ancien Laravel avait le logo Lambano ici — supprimé).

### 4.3 Sidebar sombre

- Fond `primary` `#1D3A6B` + pattern de points radial 22×22 opacité 3% (ancre brand).
- Bord droit `primary-deep`.
- Largeur fixe 232px (V1). Collapsable prévue V2.
- **Bloc `Workspace` en haut** (à la place d'un logo, car le logo est en topbar) : padding `20px`, bordure basse `rgba(255,255,255,0.06)`. Composé de :
  - une icône bâtiment 38×38 en glass overlay (bg `rgba(255,255,255,0.08)`, border `rgba(255,255,255,0.10)`, radius `md`, couleur `accent`) ;
  - un titre en Clash 15 600 blanc (ex. « Espace direction ») ;
  - un sub en Inter 11 `rgba(255,255,255,0.45)` (ex. « Collège Akonda-Diarra »).
- **Sections** : labels sentence case, `weight 600`, `rgba(255,255,255,0.45)`, padding `14px 12px 6px`.
  - Regroupements : *Pilotage · Scolarité · Finance · Communication · [séparateur] · Paramétrage · [zone user]*
- **Items** :
  - Repos : `rgba(255,255,255,0.72)`, weight 500, radius 10px, padding `10px 12px`
  - Hover : bg `rgba(255,255,255,0.06)`, text white
  - Actif : bg `rgba(255,255,255,0.10)`, weight 600, text white, inset ring `rgba(255,255,255,0.08)`, **barre latérale orange lumineuse** 3×18px avec box-shadow `0 0 12px rgba(246,159,19,0.5)`
- **Badges** dans items : orange par défaut (informatif), rouge (`#EF4444`) pour urgence (impayés).
- **Zone user en bas** : bloc « glass » `rgba(255,255,255,0.04)` avec border `rgba(255,255,255,0.06)`, avatar orange + nom + rôle.

### 4.4 Main content

- Fond `bg` (`#F7F8FB`).
- **PageHeader** en haut : titre H1 Clash 22px + sub `Nom d'école · mise à jour à HHhMM` en Inter 13 `ink-3` ; boutons secondaires (Actualiser, filtres…) alignés à droite.
- Contenu en flux vertical avec `gap: 20px` entre sections.

---

## 5. Patterns métier

### 5.1 HeroKPI (moment financier majeur)

Composant central du cockpit trésorerie. Structure :

```
┌────────────────────────────────────────────────┐
│  Trésorerie · vendredi 18 juillet · 10h24     │  ← eyebrow éditorial, Inter 13 500
│                                                │
│  1 240 500 FCFA                                │  ← value Clash 52 700, cur Inter 18 500 dimmed
│  ────────────────────────────────────          │  ← hairline 1px rgba(255,255,255,0.10)
│  +82 500 FCFA encaissés · 24 versements ·     │  ← ligne typo, séparateurs « · »
│  △ 7,1% vs hier                                │
└────────────────────────────────────────────────┘
```

- Fond : aplat `primary` avec **un seul** halo `rgba(255,255,255,0.06)` top-right (320×320px, feathered), pattern de points 4% (identique sidebar).
- Ombre `shadow-hero`.
- **Contient optionnellement** un `Sparkline` sur la moitié droite (grille grid `1.4fr 1fr`).
- **Interdits** : pill verte `↑ +7.1%`, pulse dot « live », label small-caps `TRÉSORERIE DU JOUR`.

### 5.2 KPIStat (KPI card secondaire)

Grid `repeat(3, 1fr)` sous le hero. Structure :

```
┌──────────────────────────┐
│  Caisse             [₣] │  ← label Clash 15 600, icône 36×36 tinted
│                          │
│  380 000 FCFA           │  ← Clash 24 600, tabular-nums, cur Inter 12 dimmed
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    │  ← dashed border-top ink-3
│  12 versements    +62 000│  ← foot Inter 12, num Clash à droite
└──────────────────────────┘
```

- Radius `radius-xl` (16px), fond blanc, `shadow-flat` → `shadow-hover` sur hover avec `translateY(-2px)`.
- **Icônes tintées** par catégorie : cash green, MoMo accent-soft, bank blue-soft.
- **Interdits** : ↑↓ colorés en foot, label uppercase.

### 5.3 StatusPill (paiement)

Trois variants exclusifs : `solde`, `debute`, `impaye`.

```
[● Soldé]   [● Débuté]   [● Impayé]
```

Structure : `padding 4px 9px`, `radius-full`, `font-size 11`, `weight 700`. Dot 6×6 avant texte. Couleurs § 3.1.

### 5.4 TxRow (ligne de transaction)

Table dense pour « Derniers versements ». Colonnes : `[avatar 40] [Élève 1.5fr] [Classe 90] [Statut 100] [Montant 110] [action 30]`.

- Header : `line-soft` bg, sentence case Inter 11 600, padding `12px 20px`.
- Row : padding `14px 20px`, border-bottom `line-soft`, hover bg `#FBFCFE`.
- **Avatar** : cercle 32×32, initiales blanches Inter 11 700 sur fond coloré catégoriel (blue, orange, green, purple — palette rotative).
- **Nom** : Inter 13 600 `ink` + sub-line `Matr. XXX · canal` en Inter 11 `ink-3`.
- **Montant** : Clash 14 600 tabular-nums, texte `ink` par défaut, `#B91C1C` si impayé.
- **Action** : `⋯` opacité 0.6, opacité 1 au hover row, couleur primary.

### 5.5 ProgressRing (recouvrement)

Cercle 200×180 avec :

- Anneau vide : `line-soft` `#F1F5F9`, stroke 16.
- Anneau plein : stroke `primary` (fill uni, pas de dégradé pour V1), stroke-linecap round.
- Centre : `71%` en Clash `display-md` 32 700 primary + `recouvré` en Inter 12 `ink-3`.
- Légende sous dashed border-top : 3 valeurs (`Soldés 1 249` / `Partiel 312` / `Impayés 12`) en sentence case, dots colorés selon statut.

### 5.6 ContextPill (topbar)

Pill neutre, cliquable (dropdown attendu) :

```
[● Année 2025-2026]   [Général]
```

- Fond blanc, border `line`, radius-full, padding `7px 12px`, Inter 12 600 `ink-2`.
- Hover : border et texte `primary`.
- Dot orange 6×6 optionnel (accent brand quand pertinent).

### 5.7 Sparkline

SVG `viewBox 300 100`, path 2 couches : fill sous la courbe (linear gradient orange 35% → 0%), stroke orange `#F69F13` weight 2.5px, dot final blanc-ringé orange 4px. Optionnellement sur fond `rgba(255,255,255,0.04)` avec radius 12px.

### 5.8 Wizard / Stepper

Pattern à 5 étapes pour Inscription/Réinscription (préservation réflexe ancien Laravel) :

```
[Étape 01]  [Étape 02]  [Étape 03]  [Étape 04]  [Étape 05]
Fiche       Identif.    Niveau       Paiement    Récap.
──────────  ──────────  ──────────  ──────────  ──────────
```

- Étape active : bord bas primary 2px + label en Clash 600 primary.
- Étapes terminées : check icon + label soft `ink-3`.
- Étapes futures : label `ink-4`.
- Auto-save à chaque transition d'étape (au niveau du produit, pas du DS).

---

## 6. Bibliothèque de composants (SaaS-grade complet)

Priorité indiquée pour l'implémentation (P0 = incontournable, P1 = enchaîné, P2 = utile mais différable).

### 6.1 Primitives (P0)

Basés sur shadcn/ui déjà installé, avec tokens Edukea appliqués.

- `Button` — variants `primary` (bg primary), `secondary` (border), `ghost` (transparent), `danger`, `icon-only`. Tailles `sm`, `md`, `lg`.
- `Input`, `Textarea`, `Select`, `Combobox`, `DatePicker`, `NumberInput` (avec suffixe FCFA)
- `Checkbox`, `Radio`, `Switch`
- `Label`, `HelperText`, `ErrorText`
- `Badge` (compteur numérique), `Pill` (status), `Tag`
- `Avatar` (initiales + fond coloré catégoriel)
- `Tooltip`
- `Icon` (wrapper Lucide)
- `Divider`

### 6.2 Layout (P0)

- `AppShell` (topbar + sidebar + main)
- `Topbar` (avec brand, ContextPill, avatar)
- `Sidebar` (dark, sections, items, badges, user footer)
- `SidebarWorkspace` (bloc en tête de sidebar : icône glass + titre + sub)
- `Logo` (wrapper `<img>` avec les 3 variantes color/white/black + tailles preset)
- `PageHeader` (title + sub + actions)
- `Card` (variants : base, hero, dashed-footer)
- `EmptyState`
- `Skeleton` (loading)

### 6.3 Patterns métier (P1)

- `HeroKPI`
- `KPIStat`
- `StatusPill` (avec 3 variants R/J/V)
- `TxRow`
- `ContextPill`
- `Sparkline`
- `ProgressRing`
- `Wizard` (5-step + auto-save hook)
- `DataTable` (dense, filtrable colonne, tri, pagination)
- `RefreshButton` (avec état loading)

### 6.4 Interactive (P1-P2)

- `Modal` / `Dialog` (P1)
- `Sheet` / `Drawer` (P1)
- `DropdownMenu` (P1 — nécessaire pour actions TxRow)
- `Popover` (P2)
- `Toast` (P1 — feedback versement enregistré)
- `Alert` / `Banner` (P2)
- `Tabs` (P2)

### 6.5 Charts (P2, différables)

- `LineChart`, `BarChart`, `DonutChart` — via `recharts` (déjà envisagé) ou custom SVG léger. La `Sparkline` et le `ProgressRing` sont custom SVG car ils sont patterns d'usage prescrit du DS.

---

## 7. Anti-patterns (règles négatives, à codifier dans lints/reviews)

Ces règles émergent de la brainstorming visuelle. Elles sont explicites pour être appliquées mécaniquement en review.

1. **Aucun label produit en `text-transform: uppercase` + `letter-spacing`.** Le pattern « SMALL-CAPS LABEL » avec letter-spacing ~0.05em est le tell #1 des dashboards AI-générés. Exception unique : table head dense de type Excel (11px semibold), reste en sentence case.
2. **Aucune pill colorée pour un delta de KPI.** Pas de `background: rgba(52,211,153,0.15)` + `color: green` + `↑ +7,1%`. Utiliser une ligne typographique sous une hairline avec un chevron typographique `△` ou `▽`.
3. **Aucun « pulse dot » vert pour signifier « live ».** Pas de `box-shadow: 0 0 0 4px rgba(52,211,153,0.20)` sur un dot. Utiliser un timestamp explicite (« mise à jour à 10h24 »).
4. **Aucun logo partenaire ou tiers dans le top-right de l'app.** L'ancien Laravel affichait le logo Lambano ici — la refonte l'interdit.
5. **Aucun émoji-arrow `↑ ↓` en corps de texte comme composant principal.** Toléré uniquement dans les libellés Delta typographiques (`△`, `▽`) ou dans les icônes Lucide (`ArrowUp`) dans des zones dédiées.
6. **Clash Display jamais utilisée pour du body ou du texte long.** Réservée strictement à titres, valeurs numériques, marque.
7. **Pas de dégradés multi-radiaux sur les surfaces primary.** Aplat + un seul halo discret max. La v1 du hero avait un triple radial-gradient orange/blanc — supprimé.
8. **La devise FCFA n'est jamais du chiffre.** Toujours suffixée en Inter petit dimmed (`.cur` class). L'utilisateur scanne la valeur, pas l'unité.
9. **Pas de mode sombre partiel.** La sidebar est sombre par design (elle porte la marque), mais le contenu reste toujours clair. Pas de « inverted card » pour effet.

---

## 8. Delivery — structure monorepo

### 8.1 Nouveau package `@edukea/ui`

```
packages/ui/
├── package.json          (@edukea/ui, workspace:*)
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── tokens/           (source unique des tokens tailwind + CSS vars)
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   ├── radius.ts
│   │   ├── shadows.ts
│   │   └── index.ts
│   ├── primitives/       (extension shadcn/ui avec tokens Edukea)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── pill.tsx
│   │   ├── avatar.tsx
│   │   ├── tooltip.tsx
│   │   ├── divider.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── app-shell.tsx
│   │   ├── topbar.tsx
│   │   ├── sidebar.tsx      (dark)
│   │   ├── page-header.tsx
│   │   └── context-pill.tsx
│   ├── patterns/
│   │   ├── hero-kpi.tsx
│   │   ├── kpi-stat.tsx
│   │   ├── status-pill.tsx  (Soldé/Débuté/Impayé)
│   │   ├── tx-row.tsx
│   │   ├── sparkline.tsx
│   │   ├── progress-ring.tsx
│   │   ├── wizard.tsx
│   │   ├── refresh-button.tsx
│   │   ├── empty-state.tsx
│   │   └── skeleton.tsx
│   └── lib/
│       ├── cn.ts
│       └── formatters.ts    (formatFCFA, formatDate en fr)
└── tailwind-preset.js       (preset partagé, consommé par les 4 apps)
```

### 8.2 Consommation dans les apps

Chaque `apps/*/tailwind.config.ts` étend le preset partagé :

```ts
import edukeaPreset from '@edukea/ui/tailwind-preset';
export default { presets: [edukeaPreset], content: [...] };
```

Le fichier `packages/shared/src/lib/brand.ts` reste — c'est la source primitive JS. `@edukea/ui/tokens` importe depuis `@edukea/shared` (pas de duplication).

### 8.3 Migration progressive

Les composants shadcn/ui **déjà présents** dans chaque app (`apps/*/src/components/ui/`) restent en place le temps de la migration. Chaque page migrée passe à `@edukea/ui`. Un composant local (ex `apps/school/src/components/ui/button.tsx`) est **supprimé quand la dernière page l'utilisant a été migrée** vers `@edukea/ui`.

---

## 9. Critères de succès

- Un développeur peut monter une page cockpit-like (`HeroKPI` + `KPIStat×3` + `ProgressRing` + `TxRow×N`) en < 100 lignes de JSX en consommant `@edukea/ui`.
- Le chef d'établissement d'un pilote FEPPECI reconnait « ses réflexes » (nav claire, statuts couleur, wizard 5 étapes, table dense) à la première utilisation, sans onboarding, dans un test utilisateur de 15 minutes.
- Aucune régression visuelle sur la charte (bleu `#1D3A6B` + orange `#F69F13` + Clash Display) entre les 4 apps.
- Le linter (règle interne ou review humaine) rejette une PR qui utilise :
  - `text-uppercase` avec `letter-spacing` sur un label produit ;
  - une pill colorée pour un delta chiffré ;
  - un `bg-*` gradient multi-couleur sur une surface primary.

---

## 10. Hors périmètre V1

- Dark mode global de l'app (seule la sidebar est sombre).
- Charts avancés (recharts / D3 configurations complexes).
- Framer Motion / animations d'entrée de page.
- Composants mobiles-natifs (Edukea mobile viendra dans une itération séparée).
- Traductions au-delà du français.
- Internationalisation typographique (Clash Display couvre le français, ce sera à valider pour d'autres langues).
- `admin` app SaaS metrics dashboard (bénéficiera du DS mais ses composants spécifiques — donut MRR, cohort retention — sont hors V1).

---

## 11. Références externes

- Charte graphique officielle : `Charte Graphique - Edukea.pdf` (racine du monorepo, 13 pages)
- Doc de stratégie : `Edukea_Strategie_Lancement.docx` (racine)
- Ancienne UX (réflexes à préserver) : `screens/` (~48 captures)
- Brainstorming visuel : `.superpowers/brainstorm/8881-1784362358/content/` (v1 → v4 finale)
- Tokens actuels : `packages/shared/src/lib/brand.ts`, `apps/*/tailwind.config.ts`, `apps/*/src/app/globals.css`
