# Design System Edukea V1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer le package `@edukea/ui` (tokens, layout, patterns cockpit) et refondre la page cockpit de `apps/school` en le consommant, validation visuelle finale via `next dev` sur port 4002.

**Architecture:** Nouveau package workspace `@edukea/ui` publié en interne, consommé par `apps/school` d'abord. Tokens en TS + Tailwind preset partagé. Composants React 19 + Tailwind, class-variance-authority pour les variants, shadcn/ui non re-implémenté (mais migration progressive planifiée). Anti-patterns codifiés dans la doc du package (§ Anti-patterns du spec).

**Tech Stack:** pnpm 10 · Turbo · React 19 · Next.js 15 · TypeScript 5.7 · Tailwind 3.4 · Vitest (nouveau, uniquement dans `@edukea/ui`) · class-variance-authority · Lucide icons.

**Référence spec:** `docs/superpowers/specs/2026-07-18-design-system-edukea-design.md`

---

## Cartographie des fichiers

Structure cible du package `@edukea/ui` :

```
packages/ui/
├── package.json                     ← workspace package, exporte tokens + composants
├── tsconfig.json
├── vitest.config.ts
├── tailwind-preset.ts               ← preset consommé par les 4 apps
├── assets/
│   ├── logo-color.png               ← cropped, ratio ~5.5:1
│   ├── logo-white.png
│   └── logo-black.png
├── src/
│   ├── index.ts                     ← barrel export
│   ├── tokens/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   ├── radius.ts
│   │   ├── shadows.ts
│   │   └── index.ts
│   ├── lib/
│   │   ├── cn.ts                    ← clsx + tailwind-merge
│   │   ├── formatters.ts            ← formatFCFA, formatDateFr
│   │   └── formatters.test.ts
│   ├── primitives/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── logo.tsx
│   │   └── icon.tsx
│   ├── layout/
│   │   ├── topbar.tsx
│   │   ├── context-pill.tsx
│   │   ├── sidebar.tsx
│   │   ├── sidebar-workspace.tsx
│   │   ├── sidebar-item.tsx
│   │   ├── sidebar-section.tsx
│   │   ├── sidebar-user.tsx
│   │   ├── page-header.tsx
│   │   └── app-shell.tsx
│   ├── patterns/
│   │   ├── status-pill.tsx
│   │   ├── status-pill.test.ts
│   │   ├── sparkline.tsx
│   │   ├── sparkline.test.ts
│   │   ├── progress-ring.tsx
│   │   ├── hero-kpi.tsx
│   │   ├── kpi-stat.tsx
│   │   ├── tx-row.tsx
│   │   ├── tx-table.tsx
│   │   └── refresh-button.tsx
└── scripts/
    └── crop-logo.py                 ← script Python idempotent de crop du bbox
```

Modifications dans `apps/school` :

- `apps/school/package.json` : ajouter `"@edukea/ui": "workspace:*"`
- `apps/school/tailwind.config.ts` : consommer le preset `@edukea/ui/tailwind-preset`
- `apps/school/src/app/(dashboard)/layout.tsx` : remplacer par un consommateur d'`AppShell`
- `apps/school/src/app/(dashboard)/dashboard/page.tsx` : refonte cockpit trésorerie
- `apps/school/public/logo-color.png` et `logo-white.png` : copies (Next.js sert `/public/*`)

---

## Phase 1 — Package skeleton

### Task 1 : Créer le package `@edukea/ui`

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/src/index.ts`

- [ ] **Step 1 : Créer le package.json**

Contenu de `packages/ui/package.json` :

```json
{
  "name": "@edukea/ui",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./tailwind-preset": "./tailwind-preset.ts",
    "./assets/*": "./assets/*"
  },
  "scripts": {
    "lint": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.460.0",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@testing-library/react": "^16.0.0",
    "@types/react": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^26.0.0",
    "react": "^19.0.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "tailwindcss": "^3.4.0"
  }
}
```

- [ ] **Step 2 : Créer le tsconfig.json**

Contenu de `packages/ui/tsconfig.json` :

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "preserve",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "allowSyntheticDefaultImports": true,
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*", "tailwind-preset.ts", "vitest.config.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3 : Créer le barrel export vide**

Contenu de `packages/ui/src/index.ts` :

```ts
export * from './tokens';
```

- [ ] **Step 4 : Installer les dépendances**

Run: `cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea && pnpm install`

Expected: `+ @edukea/ui` visible dans les workspaces, aucune erreur.

- [ ] **Step 5 : Commit**

```bash
git add packages/ui/package.json packages/ui/tsconfig.json packages/ui/src/index.ts pnpm-lock.yaml
git commit -m "feat(ui): scaffold @edukea/ui package"
```

---

### Task 2 : Configurer vitest

**Files:**
- Create: `packages/ui/vitest.config.ts`
- Create: `packages/ui/src/lib/formatters.ts`
- Create: `packages/ui/src/lib/formatters.test.ts`

- [ ] **Step 1 : Écrire vitest.config.ts**

Contenu :

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

- [ ] **Step 2 : Écrire les tests unitaires de `formatFCFA` (failing first)**

Contenu de `packages/ui/src/lib/formatters.test.ts` :

```ts
import { describe, it, expect } from 'vitest';
import { formatFCFA, formatDateFr } from './formatters';

describe('formatFCFA', () => {
  it('groups thousands with non-breaking spaces', () => {
    expect(formatFCFA(1240500)).toBe('1 240 500 FCFA');
  });

  it('handles zero', () => {
    expect(formatFCFA(0)).toBe('0 FCFA');
  });

  it('handles negative amounts', () => {
    expect(formatFCFA(-500)).toBe('-500 FCFA');
  });

  it('supports withoutSuffix option', () => {
    expect(formatFCFA(50000, { withoutSuffix: true })).toBe('50 000');
  });
});

describe('formatDateFr', () => {
  it('formats a date to "vendredi 18 juillet"', () => {
    const d = new Date('2026-07-18T10:24:00Z');
    expect(formatDateFr(d)).toBe('vendredi 18 juillet');
  });
});
```

- [ ] **Step 3 : Lancer les tests et confirmer l'échec**

Run: `cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea && pnpm --filter @edukea/ui test`

Expected: FAIL — `formatFCFA is not a function` (module manquant).

- [ ] **Step 4 : Implémenter les formatters (minimal pass)**

Contenu de `packages/ui/src/lib/formatters.ts` :

```ts
export interface FormatFCFAOptions {
  withoutSuffix?: boolean;
}

export function formatFCFA(amount: number, opts: FormatFCFAOptions = {}): string {
  const grouped = new Intl.NumberFormat('fr-FR').format(amount);
  return opts.withoutSuffix ? grouped : `${grouped} FCFA`;
}

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export function formatDateFr(date: Date): string {
  return DATE_FMT.format(date);
}
```

- [ ] **Step 5 : Lancer les tests et confirmer le succès**

Run: `pnpm --filter @edukea/ui test`

Expected: PASS — 5 tests verts.

- [ ] **Step 6 : Commit**

```bash
git add packages/ui/vitest.config.ts packages/ui/src/lib/formatters.ts packages/ui/src/lib/formatters.test.ts
git commit -m "feat(ui): add formatFCFA and formatDateFr with tests"
```

---

### Task 3 : Utilitaire `cn` (clsx + tailwind-merge)

**Files:**
- Create: `packages/ui/src/lib/cn.ts`

- [ ] **Step 1 : Créer `cn.ts`**

Contenu :

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2 : Type-check**

Run: `pnpm --filter @edukea/ui lint`

Expected: PASS — 0 error.

- [ ] **Step 3 : Commit**

```bash
git add packages/ui/src/lib/cn.ts
git commit -m "feat(ui): add cn helper (clsx + tailwind-merge)"
```

---

## Phase 2 — Tokens

### Task 4 : Tokens couleur

**Files:**
- Create: `packages/ui/src/tokens/colors.ts`
- Create: `packages/ui/src/tokens/index.ts`

- [ ] **Step 1 : Écrire `colors.ts`**

Contenu :

```ts
export const brand = {
  primary: '#1D3A6B',
  primaryDeep: '#152B52',
  accent: '#F69F13',
  accentSoft: '#FEF1E0',
} as const;

export const ink = {
  DEFAULT: '#0B1220',
  2: '#334155',
  3: '#64748B',
  4: '#94A3B8',
} as const;

export const surface = {
  bg: '#F7F8FB',
  line: '#E5E7EB',
  lineSoft: '#F1F5F9',
  white: '#FFFFFF',
} as const;

/**
 * Statut de paiement (invariant métier CI).
 * Chaque variant expose bg / text / dot.
 */
export const paymentStatus = {
  solde:  { bg: '#DCFCE7', text: '#166534', dot: '#22C55E' },
  debute: { bg: '#FEF1E0', text: '#B45309', dot: '#F69F13' },
  impaye: { bg: '#FEE2E2', text: '#B91C1C', dot: '#EF4444' },
} as const;

export const feedback = {
  success: '#059669',
  warning: '#F59E0B',
  danger: '#DC2626',
  info: '#3B82F6',
} as const;

export const colors = { brand, ink, surface, paymentStatus, feedback } as const;
```

- [ ] **Step 2 : Écrire l'index tokens**

Contenu de `packages/ui/src/tokens/index.ts` :

```ts
export * from './colors';
```

- [ ] **Step 3 : Type-check**

Run: `pnpm --filter @edukea/ui lint`
Expected: PASS.

- [ ] **Step 4 : Commit**

```bash
git add packages/ui/src/tokens/colors.ts packages/ui/src/tokens/index.ts
git commit -m "feat(ui): add color tokens"
```

---

### Task 5 : Tokens typographie, spacing, radius, shadows

**Files:**
- Create: `packages/ui/src/tokens/typography.ts`
- Create: `packages/ui/src/tokens/spacing.ts`
- Create: `packages/ui/src/tokens/radius.ts`
- Create: `packages/ui/src/tokens/shadows.ts`
- Modify: `packages/ui/src/tokens/index.ts`

- [ ] **Step 1 : `typography.ts`**

```ts
export const fontFamily = {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  display: ['"Clash Display"', 'Inter', 'system-ui', 'sans-serif'],
} as const;

export const fontSize = {
  'display-lg':  ['3.5rem',   { lineHeight: '1',    letterSpacing: '-0.035em' }],
  'display-md':  ['2rem',     { lineHeight: '1',    letterSpacing: '-0.025em' }],
  'heading-lg':  ['1.375rem', { lineHeight: '1.2',  letterSpacing: '-0.015em' }],
  'heading-md':  ['1rem',     { lineHeight: '1.3',  letterSpacing: '-0.015em' }],
  'heading-sm':  ['0.9375rem',{ lineHeight: '1.3',  letterSpacing: '-0.01em' }],
  'body-md':     ['0.875rem', { lineHeight: '1.5' }],
  'body-sm':     ['0.8125rem',{ lineHeight: '1.5' }],
  'body-xs':     ['0.75rem',  { lineHeight: '1.4' }],
  'caption':     ['0.6875rem',{ lineHeight: '1.4' }],
} as const;

export const typography = { fontFamily, fontSize } as const;
```

- [ ] **Step 2 : `spacing.ts`**

```ts
// Multiples de 4px, en rem
export const spacing = {
  0:  '0',
  1:  '0.25rem',   //  4
  2:  '0.5rem',    //  8
  3:  '0.75rem',   // 12
  4:  '1rem',      // 16
  5:  '1.25rem',   // 20
  6:  '1.5rem',    // 24
  8:  '2rem',      // 32
  10: '2.5rem',    // 40
  12: '3rem',      // 48
  16: '4rem',      // 64
  20: '5rem',      // 80
} as const;
```

- [ ] **Step 3 : `radius.ts`**

```ts
export const radius = {
  sm:   '0.375rem', //  6
  md:   '0.625rem', // 10
  lg:   '0.75rem',  // 12
  xl:   '1rem',     // 16
  '2xl':'1.25rem',  // 20
  full: '9999px',
} as const;
```

- [ ] **Step 4 : `shadows.ts`**

```ts
export const shadows = {
  flat:  '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.08)',
  hover: '0 4px 12px rgba(15,23,42,0.06), 0 16px 40px -12px rgba(15,23,42,0.14)',
  hero:  '0 24px 60px -24px rgba(29,58,107,0.45), 0 6px 16px -8px rgba(29,58,107,0.20)',
  stage: '0 40px 80px -40px rgba(15,23,42,0.25), 0 20px 40px -20px rgba(15,23,42,0.10)',
} as const;
```

- [ ] **Step 5 : Réexporter dans `tokens/index.ts`**

Contenu final de `packages/ui/src/tokens/index.ts` :

```ts
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './radius';
export * from './shadows';
```

- [ ] **Step 6 : Type-check**

Run: `pnpm --filter @edukea/ui lint`
Expected: PASS.

- [ ] **Step 7 : Commit**

```bash
git add packages/ui/src/tokens/
git commit -m "feat(ui): add typography, spacing, radius, shadows tokens"
```

---

### Task 6 : Tailwind preset consommant les tokens

**Files:**
- Create: `packages/ui/tailwind-preset.ts`

- [ ] **Step 1 : Écrire le preset**

Contenu :

```ts
import type { Config } from 'tailwindcss';
import { brand, ink, surface, feedback, paymentStatus } from './src/tokens/colors';
import { fontFamily, fontSize } from './src/tokens/typography';
import { spacing } from './src/tokens/spacing';
import { radius } from './src/tokens/radius';
import { shadows } from './src/tokens/shadows';

const preset: Partial<Config> = {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        // Semantic (existing CSS vars in globals.css)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: brand.primary,
          foreground: '#FFFFFF',
          deep: brand.primaryDeep,
          light: '#E8EDF5',
        },
        brand: {
          DEFAULT: brand.primary,
          accent: brand.accent,
          'accent-soft': brand.accentSoft,
        },
        ink: {
          DEFAULT: ink.DEFAULT,
          2: ink[2],
          3: ink[3],
          4: ink[4],
        },
        line: surface.line,
        'line-soft': surface.lineSoft,
        // Payment status flatten
        'status-solde-bg':    paymentStatus.solde.bg,
        'status-solde-text':  paymentStatus.solde.text,
        'status-solde-dot':   paymentStatus.solde.dot,
        'status-debute-bg':   paymentStatus.debute.bg,
        'status-debute-text': paymentStatus.debute.text,
        'status-debute-dot':  paymentStatus.debute.dot,
        'status-impaye-bg':   paymentStatus.impaye.bg,
        'status-impaye-text': paymentStatus.impaye.text,
        'status-impaye-dot':  paymentStatus.impaye.dot,
        // Feedback
        success: feedback.success,
        warning: feedback.warning,
        destructive: {
          DEFAULT: feedback.danger,
          foreground: '#FFFFFF',
        },
        // shadcn compat
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      fontFamily,
      fontSize,
      spacing,
      borderRadius: {
        ...radius,
        // shadcn compat
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: shadows,
    },
  },
  plugins: [],
};

export default preset;
```

- [ ] **Step 2 : Type-check**

Run: `pnpm --filter @edukea/ui lint`
Expected: PASS.

- [ ] **Step 3 : Commit**

```bash
git add packages/ui/tailwind-preset.ts
git commit -m "feat(ui): add tailwind preset consuming tokens"
```

---

## Phase 3 — Assets & Logo

### Task 7 : Script de crop du logo + assets versionnés

**Files:**
- Create: `packages/ui/scripts/crop-logo.py`
- Create: `packages/ui/assets/logo-color.png` (copie depuis `packages/ui-assets/`)
- Create: `packages/ui/assets/logo-white.png`
- Create: `packages/ui/assets/logo-black.png`
- Create: `packages/ui/assets/README.md`

- [ ] **Step 1 : Écrire le script `crop-logo.py`**

Contenu :

```python
#!/usr/bin/env python3
"""
Crop les logos Edukea (docs/Logo *.png) au bbox réel + 10% de marge.
Écrit `packages/ui/assets/logo-{color,white,black}.png`.

Idempotent : re-run après changement de fichier source produit un output identique
tant que le bbox et la marge sont inchangés.
"""
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SOURCES = {
    'logo-color.png': ROOT / 'docs' / 'Logo Couleur.png',
    'logo-white.png': ROOT / 'docs' / 'Logo Blanc.png',
    'logo-black.png': ROOT / 'docs' / 'Logo Noir.png',
}
OUT_DIR = ROOT / 'packages' / 'ui' / 'assets'
MARGIN_RATIO = 0.10

def crop_with_margin(im: Image.Image) -> Image.Image:
    bbox = im.getbbox()
    if bbox is None:
        raise ValueError('image is entirely transparent')
    x0, y0, x1, y1 = bbox
    pad = int((y1 - y0) * MARGIN_RATIO)
    return im.crop((
        max(0, x0 - pad),
        max(0, y0 - pad),
        min(im.width, x1 + pad),
        min(im.height, y1 + pad),
    ))

def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, src in SOURCES.items():
        if not src.exists():
            raise FileNotFoundError(src)
        out = OUT_DIR / name
        crop_with_margin(Image.open(src)).save(out, optimize=True)
        print(f'wrote {out}')

if __name__ == '__main__':
    main()
```

- [ ] **Step 2 : Exécuter le script**

Run: `cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea && python3 packages/ui/scripts/crop-logo.py`

Expected: `wrote packages/ui/assets/logo-color.png` (× 3).

- [ ] **Step 3 : Vérifier les dimensions**

Run: `sips -g pixelWidth -g pixelHeight packages/ui/assets/logo-color.png`

Expected: ratio ~5.5:1 (~4434 × 812).

- [ ] **Step 4 : Écrire `assets/README.md`**

Contenu :

```md
# Assets Edukea

Logos officiels croppés au bbox réel + 10% de marge, régénérables via :

```bash
python3 packages/ui/scripts/crop-logo.py
```

Sources : `docs/Logo Couleur.png`, `docs/Logo Blanc.png`, `docs/Logo Noir.png` (PNG 5400×5400).

Usage :

- `logo-color.png` — topbar `apps/school` sur fond blanc (uniquement)
- `logo-white.png` — fonds sombres ponctuels (splash mobile, hero KPI si filigrane)
- `logo-black.png` — exports PDF, print documents
```

- [ ] **Step 5 : Commit**

```bash
git add packages/ui/scripts/crop-logo.py packages/ui/assets/
git commit -m "feat(ui): add cropped logo assets + crop script"
```

---

### Task 8 : Composant `Logo`

**Files:**
- Create: `packages/ui/src/primitives/logo.tsx`

- [ ] **Step 1 : Écrire le composant**

Contenu de `packages/ui/src/primitives/logo.tsx` :

```tsx
import { cn } from '../lib/cn';

export type LogoVariant = 'color' | 'white' | 'black';

export interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: LogoVariant;
  src?: string;
}

/**
 * Wrapper autour du logo Edukea. La source par défaut suppose que l'app
 * consommatrice a copié les fichiers dans son dossier `/public/logo-*.png`
 * (Next.js sert /public à la racine). Alternative : passer `src` explicitement.
 */
export function Logo({
  variant = 'color',
  src,
  alt = 'Edukea',
  className,
  ...rest
}: LogoProps) {
  const finalSrc = src ?? `/logo-${variant}.png`;
  return (
    <img
      src={finalSrc}
      alt={alt}
      className={cn('block h-auto w-auto', className)}
      {...rest}
    />
  );
}
```

- [ ] **Step 2 : Réexporter depuis `src/index.ts`**

Modifier `packages/ui/src/index.ts` en ajoutant la ligne :

```ts
export * from './primitives/logo';
```

Contenu final :

```ts
export * from './tokens';
export * from './primitives/logo';
```

- [ ] **Step 3 : Type-check**

Run: `pnpm --filter @edukea/ui lint`
Expected: PASS.

- [ ] **Step 4 : Commit**

```bash
git add packages/ui/src/primitives/logo.tsx packages/ui/src/index.ts
git commit -m "feat(ui): add Logo primitive"
```

---

## Phase 4 — Primitives

### Task 9 : `Card` primitive

**Files:**
- Create: `packages/ui/src/primitives/card.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1 : Écrire `card.tsx`**

Contenu :

```tsx
import * as React from 'react';
import { cn } from '../lib/cn';

export type CardVariant = 'base' | 'hero' | 'dashed-footer';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

/**
 * Card standard du design system. `variant="hero"` = fond primary + shadow-hero
 * pour les moments financiers majeurs (cf. HeroKPI). `variant="dashed-footer"`
 * = card avec footer séparé par une hairline dashed (cf. KPIStat).
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'base', className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-line bg-white p-5 shadow-flat transition-shadow duration-150',
        variant === 'hero' &&
          'relative overflow-hidden rounded-2xl border-0 bg-primary p-6 text-white shadow-hero',
        variant === 'dashed-footer' && '[&>.card-foot]:mt-2 [&>.card-foot]:border-t [&>.card-foot]:border-dashed [&>.card-foot]:border-line [&>.card-foot]:pt-2.5',
        className,
      )}
      {...rest}
    />
  ),
);
Card.displayName = 'Card';

export function CardHeader({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-3 flex items-center justify-between', className)} {...rest} />;
}

export function CardTitle({ className, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('font-display text-heading-md text-ink', className)}
      {...rest}
    />
  );
}

export function CardSub({ className, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-0.5 text-body-xs text-ink-3', className)} {...rest} />;
}

export function CardFoot({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('card-foot flex items-baseline justify-between text-body-xs text-ink-3', className)} {...rest} />;
}
```

- [ ] **Step 2 : Réexporter**

Ajouter dans `packages/ui/src/index.ts` :

```ts
export * from './primitives/card';
```

- [ ] **Step 3 : Type-check**

Run: `pnpm --filter @edukea/ui lint`
Expected: PASS.

- [ ] **Step 4 : Commit**

```bash
git add packages/ui/src/primitives/card.tsx packages/ui/src/index.ts
git commit -m "feat(ui): add Card primitive with hero and dashed-footer variants"
```

---

### Task 10 : `Badge` et `Avatar`

**Files:**
- Create: `packages/ui/src/primitives/badge.tsx`
- Create: `packages/ui/src/primitives/avatar.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1 : `badge.tsx`**

```tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md text-caption font-bold px-1.5 py-0.5 text-white leading-none',
  {
    variants: {
      tone: {
        accent: 'bg-brand-accent',
        danger: 'bg-destructive',
        neutral: 'bg-ink-3',
      },
    },
    defaultVariants: { tone: 'accent' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...rest }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...rest} />;
}
```

- [ ] **Step 2 : `avatar.tsx`**

```tsx
import * as React from 'react';
import { cn } from '../lib/cn';

export type AvatarTone = 'blue' | 'orange' | 'green' | 'purple' | 'accent';

const toneClass: Record<AvatarTone, string> = {
  blue:   'bg-primary',
  orange: 'bg-brand-accent',
  green:  'bg-success',
  purple: 'bg-[#7C3AED]',
  accent: 'bg-brand-accent',
};

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  initials: string;
  tone?: AvatarTone;
  size?: 'sm' | 'md' | 'lg';
}

/** Rotates deterministically over the 4 base tones from a seed string (e.g. student id). */
export function toneFromSeed(seed: string): AvatarTone {
  const tones: AvatarTone[] = ['blue', 'orange', 'green', 'purple'];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return tones[h % tones.length];
}

export function Avatar({ initials, tone = 'accent', size = 'md', className, ...rest }: AvatarProps) {
  const dim = size === 'sm' ? 'h-8 w-8 text-caption' : size === 'lg' ? 'h-10 w-10 text-body-sm' : 'h-9 w-9 text-body-xs';
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full font-bold text-white',
        dim,
        toneClass[tone],
        className,
      )}
      {...rest}
    >
      {initials}
    </div>
  );
}
```

- [ ] **Step 3 : Réexporter**

Ajouter dans `packages/ui/src/index.ts` :

```ts
export * from './primitives/badge';
export * from './primitives/avatar';
```

- [ ] **Step 4 : Type-check**

Run: `pnpm --filter @edukea/ui lint`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add packages/ui/src/primitives/badge.tsx packages/ui/src/primitives/avatar.tsx packages/ui/src/index.ts
git commit -m "feat(ui): add Badge and Avatar primitives"
```

---

### Task 11 : `Button` primitive

**Files:**
- Create: `packages/ui/src/primitives/button.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1 : Écrire `button.tsx`**

```tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:   'bg-primary text-primary-foreground hover:bg-primary-deep',
        secondary: 'bg-white border border-line text-ink-2 hover:border-primary hover:text-primary',
        ghost:     'text-ink-2 hover:bg-line-soft hover:text-ink',
        danger:    'bg-destructive text-white hover:opacity-90',
      },
      size: {
        sm: 'text-body-xs px-3 py-1.5',
        md: 'text-body-sm px-3.5 py-2',
        lg: 'text-body-md px-4 py-2.5',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, className, ...rest }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...rest} />
  ),
);
Button.displayName = 'Button';
```

- [ ] **Step 2 : Réexporter**

Ajouter dans `packages/ui/src/index.ts` : `export * from './primitives/button';`

- [ ] **Step 3 : Type-check**

Run: `pnpm --filter @edukea/ui lint`
Expected: PASS.

- [ ] **Step 4 : Commit**

```bash
git add packages/ui/src/primitives/button.tsx packages/ui/src/index.ts
git commit -m "feat(ui): add Button primitive"
```

---

## Phase 5 — Patterns métier (P1)

### Task 12 : `StatusPill` (avec test TDD)

**Files:**
- Create: `packages/ui/src/patterns/status-pill.tsx`
- Create: `packages/ui/src/patterns/status-pill.test.ts`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1 : Écrire les tests failing**

Contenu de `packages/ui/src/patterns/status-pill.test.ts` :

```ts
import { describe, it, expect } from 'vitest';
import { labelForStatus, type PaymentStatus } from './status-pill';

describe('labelForStatus', () => {
  it('returns human label for each status', () => {
    const cases: Array<[PaymentStatus, string]> = [
      ['solde', 'Soldé'],
      ['debute', 'Débuté'],
      ['impaye', 'Impayé'],
    ];
    for (const [status, expected] of cases) {
      expect(labelForStatus(status)).toBe(expected);
    }
  });
});
```

- [ ] **Step 2 : Lancer les tests et confirmer l'échec**

Run: `pnpm --filter @edukea/ui test`
Expected: FAIL — `status-pill` module missing.

- [ ] **Step 3 : Implémenter `status-pill.tsx`**

```tsx
import * as React from 'react';
import { cn } from '../lib/cn';

export type PaymentStatus = 'solde' | 'debute' | 'impaye';

const LABELS: Record<PaymentStatus, string> = {
  solde:  'Soldé',
  debute: 'Débuté',
  impaye: 'Impayé',
};

const CLASSES: Record<PaymentStatus, { bg: string; text: string; dot: string }> = {
  solde:  { bg: 'bg-status-solde-bg',  text: 'text-status-solde-text',  dot: 'bg-status-solde-dot' },
  debute: { bg: 'bg-status-debute-bg', text: 'text-status-debute-text', dot: 'bg-status-debute-dot' },
  impaye: { bg: 'bg-status-impaye-bg', text: 'text-status-impaye-text', dot: 'bg-status-impaye-dot' },
};

export function labelForStatus(status: PaymentStatus): string {
  return LABELS[status];
}

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: PaymentStatus;
  label?: string;
}

export function StatusPill({ status, label, className, ...rest }: StatusPillProps) {
  const c = CLASSES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-bold',
        c.bg,
        c.text,
        className,
      )}
      {...rest}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />
      {label ?? labelForStatus(status)}
    </span>
  );
}
```

- [ ] **Step 4 : Lancer les tests et confirmer le succès**

Run: `pnpm --filter @edukea/ui test`
Expected: PASS.

- [ ] **Step 5 : Réexporter + type-check**

Ajouter dans `packages/ui/src/index.ts` : `export * from './patterns/status-pill';`
Run: `pnpm --filter @edukea/ui lint`
Expected: PASS.

- [ ] **Step 6 : Commit**

```bash
git add packages/ui/src/patterns/status-pill.tsx packages/ui/src/patterns/status-pill.test.ts packages/ui/src/index.ts
git commit -m "feat(ui): add StatusPill pattern with 3 payment variants"
```

---

### Task 13 : `Sparkline` (avec test TDD sur le path SVG)

**Files:**
- Create: `packages/ui/src/patterns/sparkline.tsx`
- Create: `packages/ui/src/patterns/sparkline.test.ts`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1 : Écrire les tests failing**

```ts
import { describe, it, expect } from 'vitest';
import { buildSparkPath } from './sparkline';

describe('buildSparkPath', () => {
  it('returns a stroke path with correct point count', () => {
    const { stroke } = buildSparkPath([1, 2, 3, 4, 5], { width: 100, height: 50 });
    // 5 points => 4 line commands after M
    expect(stroke.split('L').length).toBe(5);
    expect(stroke.startsWith('M')).toBe(true);
  });

  it('spans full width from x=0 to x=width', () => {
    const { stroke } = buildSparkPath([10, 20, 30], { width: 300, height: 100 });
    expect(stroke).toMatch(/^M0,/);
    expect(stroke).toMatch(/L300,/);
  });

  it('closes fill path back to baseline', () => {
    const { fill } = buildSparkPath([1, 2, 3], { width: 30, height: 10 });
    // fill should end with a Z close
    expect(fill.endsWith('Z')).toBe(true);
  });
});
```

- [ ] **Step 2 : Confirmer l'échec**

Run: `pnpm --filter @edukea/ui test`
Expected: FAIL.

- [ ] **Step 3 : Implémenter `sparkline.tsx`**

```tsx
import * as React from 'react';
import { cn } from '../lib/cn';

export interface SparkPaths {
  stroke: string;
  fill: string;
}

export function buildSparkPath(values: number[], opts: { width: number; height: number }): SparkPaths {
  const { width, height } = opts;
  if (values.length < 2) {
    return { stroke: `M0,${height} L${width},${height}`, fill: `M0,${height} L${width},${height} Z` };
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return [x, y] as const;
  });
  const stroke = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const fill = `${stroke} L${width},${height} L0,${height} Z`;
  return { stroke, fill };
}

export interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  strokeColor?: string;
  fillOpacity?: number;
  showEndDot?: boolean;
  className?: string;
}

let __gradientCounter = 0;

export function Sparkline({
  values,
  width = 300,
  height = 100,
  strokeColor = '#F69F13',
  fillOpacity = 0.35,
  showEndDot = true,
  className,
}: SparklineProps) {
  const paths = React.useMemo(() => buildSparkPath(values, { width, height }), [values, width, height]);
  const gradientId = React.useMemo(() => `spark-fill-${++__gradientCounter}`, []);
  const [endX, endY] = React.useMemo(() => {
    if (values.length < 2) return [width, height];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const lastY = height - ((values[values.length - 1] - min) / range) * height;
    return [width, lastY];
  }, [values, width, height]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className={cn('block h-full w-full', className)}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={paths.fill} fill={`url(#${gradientId})`} />
      <path d={paths.stroke} fill="none" stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {showEndDot && (
        <circle cx={endX} cy={endY} r={4} fill={strokeColor} stroke="white" strokeWidth={2} />
      )}
    </svg>
  );
}
```

- [ ] **Step 4 : Confirmer le succès**

Run: `pnpm --filter @edukea/ui test`
Expected: PASS.

- [ ] **Step 5 : Réexporter + type-check + commit**

Ajouter dans `packages/ui/src/index.ts` : `export * from './patterns/sparkline';`
Run: `pnpm --filter @edukea/ui lint` → PASS.

```bash
git add packages/ui/src/patterns/sparkline.tsx packages/ui/src/patterns/sparkline.test.ts packages/ui/src/index.ts
git commit -m "feat(ui): add Sparkline pattern with tested path builder"
```

---

### Task 14 : `ProgressRing`

**Files:**
- Create: `packages/ui/src/patterns/progress-ring.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1 : Écrire le composant**

```tsx
import * as React from 'react';
import { cn } from '../lib/cn';

export interface ProgressRingProps {
  /** 0 à 100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSub?: string;
  className?: string;
}

/** Progress ring circulaire (arc bleu Edukea) avec label centré. */
export function ProgressRing({
  value,
  size = 180,
  strokeWidth = 16,
  centerLabel,
  centerSub,
  className,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (clamped / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#F1F5F9" strokeWidth={strokeWidth} />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#1D3A6B"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <div className="absolute text-center">
        {centerLabel !== undefined && (
          <div className="font-display text-display-md font-bold text-primary">{centerLabel}</div>
        )}
        {centerSub !== undefined && (
          <div className="text-body-xs font-medium text-ink-3">{centerSub}</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2 : Réexporter + type-check**

Ajouter dans `src/index.ts` : `export * from './patterns/progress-ring';`
Run: `pnpm --filter @edukea/ui lint` → PASS.

- [ ] **Step 3 : Commit**

```bash
git add packages/ui/src/patterns/progress-ring.tsx packages/ui/src/index.ts
git commit -m "feat(ui): add ProgressRing pattern"
```

---

### Task 15 : `HeroKPI` + `KPIStat`

**Files:**
- Create: `packages/ui/src/patterns/hero-kpi.tsx`
- Create: `packages/ui/src/patterns/kpi-stat.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1 : `hero-kpi.tsx`**

```tsx
import * as React from 'react';
import { cn } from '../lib/cn';
import { formatFCFA, formatDateFr } from '../lib/formatters';

export interface HeroKPIProps {
  /** Montant en XOF (entier). */
  amount: number;
  /** Titre du KPI. Ex. "Trésorerie". */
  label: string;
  /** Date affichée dans l'eyebrow. Défaut : maintenant. */
  date?: Date;
  /** Heure "hh'h'mm" affichée dans l'eyebrow. Défaut : maintenant. */
  updatedAt?: string;
  /** Ligne récap sous la hairline. Ex. array de fragments à joindre par " · ". */
  metrics?: React.ReactNode[];
  /** Sparkline optionnelle à droite. */
  spark?: React.ReactNode;
  className?: string;
}

const defaultTime = (d: Date) =>
  `${d.getHours().toString().padStart(2, '0')}h${d.getMinutes().toString().padStart(2, '0')}`;

export function HeroKPI({
  amount,
  label,
  date,
  updatedAt,
  metrics,
  spark,
  className,
}: HeroKPIProps) {
  const now = date ?? new Date();
  const time = updatedAt ?? defaultTime(now);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-primary p-6 sm:p-7 text-white shadow-hero',
        spark ? 'grid grid-cols-1 items-center gap-8 md:grid-cols-[1.4fr_1fr]' : 'block',
        className,
      )}
    >
      {/* halo top-right + dot pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-80 w-80"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 65%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 12px 12px, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <div className="relative">
        <div className="mb-2.5 flex flex-wrap items-baseline gap-2.5 text-body-sm font-medium text-white/60">
          <span>{label}</span>
          <span className="font-normal text-white/30">·</span>
          <strong className="font-semibold text-white">{formatDateFr(now)}</strong>
          <span className="font-normal text-white/30">·</span>
          <span>mise à jour à {time}</span>
        </div>
        <div className="font-display text-display-lg font-bold leading-none tracking-tight">
          {formatFCFA(amount, { withoutSuffix: true })}
          <span className="ml-1.5 font-sans text-body-md font-medium text-white/55">FCFA</span>
        </div>
        {metrics && metrics.length > 0 && (
          <div className="mt-4 flex flex-wrap items-baseline gap-2.5 border-t border-white/10 pt-3.5 text-body-sm text-white/80">
            {metrics.flatMap((m, i) =>
              i === 0
                ? [<React.Fragment key={i}>{m}</React.Fragment>]
                : [
                    <span key={`sep-${i}`} className="text-white/30">·</span>,
                    <React.Fragment key={i}>{m}</React.Fragment>,
                  ],
            )}
          </div>
        )}
      </div>
      {spark && (
        <div className="relative h-24 overflow-hidden rounded-xl bg-white/5 p-2">
          {spark}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2 : `kpi-stat.tsx`**

```tsx
import * as React from 'react';
import { cn } from '../lib/cn';
import { formatFCFA } from '../lib/formatters';

export interface KPIStatProps {
  label: string;
  amount: number;
  currency?: 'FCFA';
  icon?: React.ReactNode;
  /** Texte gauche du foot (ex. "12 versements aujourd'hui"). */
  footLeft?: React.ReactNode;
  /** Chiffre droit du foot (ex. "+62 000"). Rendu en Clash Display. */
  footRight?: number | string;
  className?: string;
}

export function KPIStat({
  label,
  amount,
  currency = 'FCFA',
  icon,
  footLeft,
  footRight,
  className,
}: KPIStatProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border border-line bg-white p-4 shadow-flat transition duration-150 hover:-translate-y-0.5 hover:shadow-hover',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="font-display text-heading-sm font-semibold text-ink">{label}</div>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-md">{icon}</div>
        )}
      </div>
      <div className="font-display text-heading-lg font-semibold tabular-nums text-ink">
        {formatFCFA(amount, { withoutSuffix: true })}
        <span className="ml-1 font-sans text-body-xs font-medium text-ink-3">{currency}</span>
      </div>
      {(footLeft !== undefined || footRight !== undefined) && (
        <div className="mt-1 flex items-baseline justify-between border-t border-dashed border-line pt-2.5 text-body-xs text-ink-3">
          <span>{footLeft}</span>
          {footRight !== undefined && (
            <span className="font-display font-semibold tabular-nums text-ink">
              {typeof footRight === 'number' ? formatFCFA(footRight, { withoutSuffix: true }) : footRight}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3 : Réexporter**

Ajouter dans `src/index.ts` :

```ts
export * from './patterns/hero-kpi';
export * from './patterns/kpi-stat';
```

- [ ] **Step 4 : Type-check**

Run: `pnpm --filter @edukea/ui lint`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add packages/ui/src/patterns/hero-kpi.tsx packages/ui/src/patterns/kpi-stat.tsx packages/ui/src/index.ts
git commit -m "feat(ui): add HeroKPI and KPIStat patterns"
```

---

### Task 16 : `TxRow`, `TxTable`, `RefreshButton`

**Files:**
- Create: `packages/ui/src/patterns/tx-row.tsx`
- Create: `packages/ui/src/patterns/tx-table.tsx`
- Create: `packages/ui/src/patterns/refresh-button.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1 : `tx-row.tsx`**

```tsx
import * as React from 'react';
import { RefreshCw } from 'lucide-react';
import { Avatar, toneFromSeed } from '../primitives/avatar';
import { StatusPill, type PaymentStatus } from './status-pill';
import { formatFCFA } from '../lib/formatters';
import { cn } from '../lib/cn';

export interface TxRowData {
  id: string;
  studentName: string;
  studentSub?: string;
  className: string;
  status: PaymentStatus;
  amount: number | null;
}

export interface TxRowProps extends React.HTMLAttributes<HTMLDivElement> {
  data: TxRowData;
  onAction?: (id: string) => void;
}

export function TxRow({ data, onAction, className, ...rest }: TxRowProps) {
  const initials = data.studentName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div
      className={cn(
        'group grid items-center gap-3.5 border-b border-line-soft px-5 py-3.5 text-body-sm transition-colors last:border-b-0 hover:bg-[#FBFCFE]',
        'grid-cols-[40px_1.5fr_90px_100px_110px_30px]',
        className,
      )}
      {...rest}
    >
      <Avatar initials={initials} tone={toneFromSeed(data.id)} size="sm" />
      <div>
        <div className="font-semibold text-ink">{data.studentName}</div>
        {data.studentSub && <div className="mt-0.5 text-caption text-ink-3">{data.studentSub}</div>}
      </div>
      <div className="text-body-xs font-medium text-ink-2">{data.className}</div>
      <div><StatusPill status={data.status} /></div>
      <div className="text-right font-display text-body-md font-semibold tabular-nums text-ink">
        {data.amount === null ? <span className="text-destructive">-</span> : formatFCFA(data.amount, { withoutSuffix: true })}
      </div>
      <button
        type="button"
        aria-label="Actions"
        onClick={() => onAction?.(data.id)}
        className="text-center text-body-md text-ink-3 opacity-60 transition-opacity group-hover:opacity-100 group-hover:text-primary"
      >
        ⋯
      </button>
    </div>
  );
}
```

- [ ] **Step 2 : `tx-table.tsx`**

```tsx
import * as React from 'react';
import { TxRow, type TxRowData } from './tx-row';
import { cn } from '../lib/cn';

export interface TxTableProps {
  rows: TxRowData[];
  onAction?: (id: string) => void;
  className?: string;
}

export function TxTable({ rows, onAction, className }: TxTableProps) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-line bg-white shadow-flat', className)}>
      <div
        className={cn(
          'grid items-center gap-3.5 bg-line-soft px-5 py-3 text-caption font-semibold text-ink-3',
          'grid-cols-[40px_1.5fr_90px_100px_110px_30px]',
        )}
      >
        <span />
        <span>Élève</span>
        <span>Classe</span>
        <span>Statut</span>
        <span className="text-right">Montant</span>
        <span />
      </div>
      {rows.map((r) => (
        <TxRow key={r.id} data={r} onAction={onAction} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3 : `refresh-button.tsx`**

```tsx
import * as React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button, type ButtonProps } from '../primitives/button';

export interface RefreshButtonProps extends Omit<ButtonProps, 'variant'> {
  loading?: boolean;
  label?: string;
}

export function RefreshButton({ loading, label = 'Actualiser', ...rest }: RefreshButtonProps) {
  return (
    <Button variant="secondary" size="md" disabled={loading} {...rest}>
      <RefreshCw className={loading ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
      {label}
    </Button>
  );
}
```

- [ ] **Step 4 : Réexporter**

Ajouter dans `src/index.ts` :

```ts
export * from './patterns/tx-row';
export * from './patterns/tx-table';
export * from './patterns/refresh-button';
```

- [ ] **Step 5 : Type-check + tests**

Run: `pnpm --filter @edukea/ui lint && pnpm --filter @edukea/ui test`
Expected: PASS partout.

- [ ] **Step 6 : Commit**

```bash
git add packages/ui/src/patterns/tx-row.tsx packages/ui/src/patterns/tx-table.tsx packages/ui/src/patterns/refresh-button.tsx packages/ui/src/index.ts
git commit -m "feat(ui): add TxRow, TxTable, RefreshButton patterns"
```

---

## Phase 6 — Layout

### Task 17 : `ContextPill` + `Topbar`

**Files:**
- Create: `packages/ui/src/layout/context-pill.tsx`
- Create: `packages/ui/src/layout/topbar.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1 : `context-pill.tsx`**

```tsx
import * as React from 'react';
import { cn } from '../lib/cn';

export interface ContextPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  showDot?: boolean;
  dotColor?: string;
}

export function ContextPill({ showDot, dotColor = '#F69F13', className, children, ...rest }: ContextPillProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-2 text-body-sm font-semibold text-ink-2 transition-colors hover:border-primary hover:text-primary',
        className,
      )}
      {...rest}
    >
      {showDot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor }} />}
      {children}
    </button>
  );
}
```

- [ ] **Step 2 : `topbar.tsx`**

```tsx
import * as React from 'react';
import { Logo } from '../primitives/logo';
import { cn } from '../lib/cn';

export interface TopbarProps {
  /** Slot brand aligné à la sidebar (width identique). Défaut : 232px. */
  brandSlotWidth?: number;
  /** Zone droite : ContextPills + Avatar utilisateur. */
  right?: React.ReactNode;
  /** Overrides du <Logo/> par défaut. */
  logoSrc?: string;
  className?: string;
}

export function Topbar({ brandSlotWidth = 232, right, logoSrc, className }: TopbarProps) {
  return (
    <header className={cn('flex h-[72px] items-center justify-between border-b border-line bg-white pr-6', className)}>
      <div
        className="flex h-full items-center justify-center border-r border-line px-6"
        style={{ width: brandSlotWidth }}
      >
        <Logo variant="color" src={logoSrc} className="w-full max-w-[180px]" />
      </div>
      <div className="flex items-center gap-3.5">{right}</div>
    </header>
  );
}
```

- [ ] **Step 3 : Réexporter**

Ajouter dans `src/index.ts` :

```ts
export * from './layout/context-pill';
export * from './layout/topbar';
```

- [ ] **Step 4 : Type-check + commit**

Run: `pnpm --filter @edukea/ui lint`
Expected: PASS.

```bash
git add packages/ui/src/layout/context-pill.tsx packages/ui/src/layout/topbar.tsx packages/ui/src/index.ts
git commit -m "feat(ui): add ContextPill and Topbar layout components"
```

---

### Task 18 : `SidebarItem`, `SidebarSection`, `SidebarWorkspace`, `SidebarUser`, `Sidebar`

**Files:**
- Create: `packages/ui/src/layout/sidebar-item.tsx`
- Create: `packages/ui/src/layout/sidebar-section.tsx`
- Create: `packages/ui/src/layout/sidebar-workspace.tsx`
- Create: `packages/ui/src/layout/sidebar-user.tsx`
- Create: `packages/ui/src/layout/sidebar.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1 : `sidebar-item.tsx`**

```tsx
import * as React from 'react';
import { cn } from '../lib/cn';

export interface SidebarItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export const SidebarItem = React.forwardRef<HTMLAnchorElement, SidebarItemProps>(
  ({ active, icon, badge, className, children, ...rest }, ref) => (
    <a
      ref={ref}
      className={cn(
        'group relative flex items-center gap-2.5 rounded-md px-3 py-2.5 text-body-sm font-medium text-white/70 transition-colors',
        active
          ? 'bg-white/10 font-semibold text-white ring-1 ring-inset ring-white/10'
          : 'hover:bg-white/5 hover:text-white',
        className,
      )}
      aria-current={active ? 'page' : undefined}
      {...rest}
    >
      {active && (
        <span
          aria-hidden
          className="absolute -left-3 h-4 w-[3px] rounded-r-[2px] bg-brand-accent"
          style={{ boxShadow: '0 0 12px rgba(246,159,19,0.5)' }}
        />
      )}
      {icon && <span className="h-4 w-4 opacity-75 group-hover:opacity-100 group-aria-[current=page]:opacity-100">{icon}</span>}
      <span>{children}</span>
      {badge && <span className="ml-auto">{badge}</span>}
    </a>
  ),
);
SidebarItem.displayName = 'SidebarItem';
```

- [ ] **Step 2 : `sidebar-section.tsx`**

```tsx
import * as React from 'react';
import { cn } from '../lib/cn';

export function SidebarSection({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-3 pb-1.5 pt-3.5 text-caption font-semibold text-white/45', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 3 : `sidebar-workspace.tsx`**

```tsx
import * as React from 'react';
import { cn } from '../lib/cn';

export interface SidebarWorkspaceProps {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  className?: string;
}

export function SidebarWorkspace({ icon, title, sub, className }: SidebarWorkspaceProps) {
  return (
    <div className={cn('relative z-10 flex items-center gap-3 border-b border-white/[0.06] p-5', className)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.08] text-brand-accent">
        {icon}
      </div>
      <div className="flex min-w-0 flex-col">
        <div className="font-display text-heading-sm font-semibold text-white leading-tight">{title}</div>
        {sub && <div className="mt-0.5 text-caption text-white/45">{sub}</div>}
      </div>
    </div>
  );
}
```

- [ ] **Step 4 : `sidebar-user.tsx`**

```tsx
import * as React from 'react';
import { Avatar } from '../primitives/avatar';
import { cn } from '../lib/cn';

export interface SidebarUserProps {
  initials: string;
  name: string;
  role?: string;
  className?: string;
}

export function SidebarUser({ initials, name, role, className }: SidebarUserProps) {
  return (
    <div className={cn('relative z-10 mx-3 mb-3.5 mt-1.5 flex items-center gap-2.5 rounded-md border border-white/[0.06] bg-white/[0.04] p-3', className)}>
      <Avatar initials={initials} tone="accent" size="sm" />
      <div className="min-w-0 flex-1">
        <div className="text-body-xs font-semibold text-white">{name}</div>
        {role && <div className="text-caption text-white/45">{role}</div>}
      </div>
    </div>
  );
}
```

- [ ] **Step 5 : `sidebar.tsx`**

Sidebar est un container qui compose : workspace (top) + nav (scrollable) + user (bottom). Le pattern de points est appliqué via CSS inline.

```tsx
import * as React from 'react';
import { cn } from '../lib/cn';

export interface SidebarProps {
  workspace: React.ReactNode;
  user?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function Sidebar({ workspace, user, className, children }: SidebarProps) {
  return (
    <aside
      className={cn('relative flex flex-col border-r border-primary-deep bg-primary', className)}
      style={{ width: 232 }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 12px 12px, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      {workspace}
      <nav className="relative z-10 flex flex-1 flex-col gap-0.5 p-3">{children}</nav>
      {user}
    </aside>
  );
}

export function SidebarDivider() {
  return <div className="relative z-10 mx-3 my-2 h-px bg-white/[0.06]" />;
}
```

- [ ] **Step 6 : Réexporter**

Ajouter dans `src/index.ts` :

```ts
export * from './layout/sidebar-item';
export * from './layout/sidebar-section';
export * from './layout/sidebar-workspace';
export * from './layout/sidebar-user';
export * from './layout/sidebar';
```

- [ ] **Step 7 : Type-check + commit**

Run: `pnpm --filter @edukea/ui lint` → PASS.

```bash
git add packages/ui/src/layout/ packages/ui/src/index.ts
git commit -m "feat(ui): add Sidebar family (item, section, workspace, user, container)"
```

---

### Task 19 : `PageHeader` + `AppShell`

**Files:**
- Create: `packages/ui/src/layout/page-header.tsx`
- Create: `packages/ui/src/layout/app-shell.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1 : `page-header.tsx`**

```tsx
import * as React from 'react';
import { cn } from '../lib/cn';

export interface PageHeaderProps {
  title: string;
  sub?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, sub, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div>
        <div className="font-display text-heading-lg font-semibold text-ink">{title}</div>
        {sub && <div className="mt-0.5 text-body-sm text-ink-3">{sub}</div>}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
}
```

- [ ] **Step 2 : `app-shell.tsx`**

```tsx
import * as React from 'react';
import { cn } from '../lib/cn';

export interface AppShellProps {
  topbar: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** Grille globale de l'application : topbar en haut, sidebar à gauche, main scrollable. */
export function AppShell({ topbar, sidebar, children, className }: AppShellProps) {
  return (
    <div className={cn('flex min-h-screen flex-col bg-[#F7F8FB]', className)}>
      {topbar}
      <div className="flex flex-1">
        {sidebar}
        <main className="flex flex-1 flex-col gap-5 overflow-auto p-6 sm:p-7">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 3 : Réexporter**

Ajouter dans `src/index.ts` :

```ts
export * from './layout/page-header';
export * from './layout/app-shell';
```

- [ ] **Step 4 : Type-check + commit**

Run: `pnpm --filter @edukea/ui lint` → PASS.

```bash
git add packages/ui/src/layout/page-header.tsx packages/ui/src/layout/app-shell.tsx packages/ui/src/index.ts
git commit -m "feat(ui): add PageHeader and AppShell layout"
```

---

## Phase 7 — Intégration `apps/school`

### Task 20 : Ajouter `@edukea/ui` en dépendance + copier les logos dans /public

**Files:**
- Modify: `apps/school/package.json`
- Copy: `packages/ui/assets/logo-color.png` → `apps/school/public/logo-color.png`
- Copy: `packages/ui/assets/logo-white.png` → `apps/school/public/logo-white.png`

- [ ] **Step 1 : Ajouter la dépendance**

Éditer `apps/school/package.json`, ajouter dans `dependencies` :

```json
"@edukea/ui": "workspace:*",
```

- [ ] **Step 2 : Installer**

Run: `cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea && pnpm install`
Expected: `@edukea/ui` link visible dans les workspaces.

- [ ] **Step 3 : Copier les logos**

Run:

```bash
mkdir -p apps/school/public
cp packages/ui/assets/logo-color.png apps/school/public/logo-color.png
cp packages/ui/assets/logo-white.png  apps/school/public/logo-white.png
```

- [ ] **Step 4 : Commit**

```bash
git add apps/school/package.json apps/school/public/logo-color.png apps/school/public/logo-white.png pnpm-lock.yaml
git commit -m "chore(school): add @edukea/ui dep and copy logos to /public"
```

---

### Task 21 : Consommer le preset Tailwind + import font Clash Display

**Files:**
- Modify: `apps/school/tailwind.config.ts`
- Verify: `apps/school/src/app/globals.css` (déjà à jour)

- [ ] **Step 1 : Écrire la nouvelle config Tailwind**

Réécrire `apps/school/tailwind.config.ts` :

```ts
import type { Config } from 'tailwindcss';
import edukeaPreset from '@edukea/ui/tailwind-preset';

const config: Config = {
  presets: [edukeaPreset as Config],
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
};

export default config;
```

Note : le `content` inclut aussi `packages/ui/src` pour que Tailwind détecte les classes utilisées par les composants du DS.

- [ ] **Step 2 : Vérifier `globals.css`**

Le fichier doit déjà importer Clash Display et déclarer les CSS vars HSL (session précédente). Si ce n'est plus le cas, vérifier qu'il contient bien :

```css
@import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap');
```

et les variables `--primary: 218 58% 27%`, `--accent: 37 92% 52%`, `--ring: 218 58% 27%`.

Run: `grep -c "clash-display" apps/school/src/app/globals.css`
Expected: `1`.

- [ ] **Step 3 : Type-check apps/school**

Run: `cd apps/school && pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 4 : Commit**

```bash
git add apps/school/tailwind.config.ts
git commit -m "chore(school): consume @edukea/ui tailwind preset"
```

---

### Task 22 : Refondre le layout `(dashboard)/layout.tsx`

**Files:**
- Modify: `apps/school/src/app/(dashboard)/layout.tsx`

- [ ] **Step 1 : Réécrire le layout**

Contenu de `apps/school/src/app/(dashboard)/layout.tsx` :

```tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  UserPlus,
  Coins,
  CreditCard,
  Megaphone,
  Settings,
  Building2,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import {
  AppShell,
  Topbar,
  ContextPill,
  Sidebar,
  SidebarWorkspace,
  SidebarSection,
  SidebarItem,
  SidebarDivider,
  SidebarUser,
  Avatar,
  Badge,
} from '@edukea/ui';
import { createClient } from '@/lib/supabase-browser';

const sections = [
  {
    label: 'Pilotage',
    items: [
      { href: '/dashboard', label: 'Cockpit', icon: LayoutDashboard },
      { href: '/dashboard/reports', label: 'Rapports', icon: BarChart3 },
    ],
  },
  {
    label: 'Scolarité',
    items: [
      { href: '/dashboard/students', label: 'Élèves', icon: Users, badge: <Badge>1573</Badge> },
      { href: '/dashboard/enrollment', label: 'Inscription', icon: UserPlus },
      { href: '/dashboard/reenrollment', label: 'Réinscription', icon: RefreshCw },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/dashboard/recovery', label: 'Recouvrement', icon: Coins, badge: <Badge tone="danger">12</Badge> },
      { href: '/dashboard/payments', label: 'Versements', icon: CreditCard },
    ],
  },
  {
    label: 'Communication',
    items: [
      { href: '/dashboard/announcements', label: 'Annonces', icon: Megaphone },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const topbar = (
    <Topbar
      right={
        <>
          <ContextPill showDot>Année 2025-2026</ContextPill>
          <ContextPill>Général</ContextPill>
          <Avatar initials="JA" tone="accent" size="md" />
        </>
      }
    />
  );

  const sidebar = (
    <Sidebar
      workspace={
        <SidebarWorkspace
          icon={<Building2 className="h-4.5 w-4.5" />}
          title="Espace direction"
          sub="Collège Akonda-Diarra"
        />
      }
      user={<SidebarUser initials="JA" name="Joël Akoun" role="Directeur général" />}
    >
      {sections.map((section) => (
        <div key={section.label}>
          <SidebarSection>{section.label}</SidebarSection>
          {section.items.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarItem
                key={item.href}
                href={item.href}
                active={isActive(item.href)}
                icon={<Icon />}
                badge={item.badge}
                asChild={undefined /* no asChild, we rely on <a> */}
              >
                {item.label}
              </SidebarItem>
            );
          })}
        </div>
      ))}
      <div className="flex-1" />
      <SidebarDivider />
      <SidebarItem href="/dashboard/settings" active={isActive('/dashboard/settings')} icon={<Settings />}>
        Paramétrage
      </SidebarItem>
    </Sidebar>
  );

  return (
    <AppShell topbar={topbar} sidebar={sidebar}>
      {children}
    </AppShell>
  );
}
```

- [ ] **Step 2 : Corriger les liens (`SidebarItem` = `<a>`, on veut Next `<Link>`)**

`SidebarItem` étant un `<a>` natif, `next/link` avec navigation client-side ne se déclenche pas. Solution : wrapper chaque `SidebarItem` par un `<Link legacyBehavior>` OU passer `href` directement au `<a>` (dégrade en navigation full-page).

Pour V1 pragmatique, on garde `<a>` natif — la navigation full-page reste acceptable en admin.

Alternative si cela devient problématique : ajouter une prop `asChild` à `SidebarItem` dans un follow-up.

Cette limitation est **notée comme dette technique** dans le commit.

- [ ] **Step 3 : Type-check + dev server**

Run: `cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea && pnpm --filter @edukea/school dev`
Ouvrir : http://localhost:4002/dashboard
Expected : sidebar sombre s'affiche avec logo blanc n/a (topbar) + workspace « Espace direction » + les sections. Cliquer sur un item change l'URL (full-page reload).

- [ ] **Step 4 : Commit**

```bash
git add apps/school/src/app/(dashboard)/layout.tsx
git commit -m "feat(school): consume AppShell + Sidebar from @edukea/ui

Notes:
- SidebarItem currently uses native <a>, causing full-page navigation.
  Follow-up: add asChild support so we can wrap with next/link."
```

---

### Task 23 : Refondre la page cockpit avec données réelles du ledger

**Files:**
- Modify: `apps/school/src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1 : Réécrire la page cockpit**

Contenu de `apps/school/src/app/(dashboard)/dashboard/page.tsx` :

```tsx
'use client';

import { Coins, Smartphone, Landmark } from 'lucide-react';
import {
  PageHeader,
  RefreshButton,
  HeroKPI,
  KPIStat,
  Sparkline,
  ProgressRing,
  Card,
  CardHeader,
  CardTitle,
  CardSub,
  TxTable,
  type TxRowData,
} from '@edukea/ui';

// TODO(sprint 2): brancher sur useSchoolTreasury / v_school_treasury via @edukea/shared
const FAKE_TREASURY = {
  total: 1_240_500,
  cash: 380_000,
  momo: 625_500,
  bank: 235_000,
  todayCollected: 82_500,
  deltaPct: 7.1,
  todayCount: 24,
  sparkValues: [12, 20, 15, 32, 28, 45, 38, 55, 50, 62, 58, 70, 75, 68, 82],
};

const FAKE_RECOVERY = { pct: 71, solde: 1249, debute: 312, impaye: 12 };

const FAKE_TXS: TxRowData[] = [
  { id: '132',   studentName: 'SORE Chakira Mounia', studentSub: 'Matr. 0000000132 · MoMo', className: 'CM2 A', status: 'debute', amount: 50000 },
  { id: '222',   studentName: 'TRAORE Bintou Rahman', studentSub: 'Matr. 0000222333 · Espèces', className: 'CM2 A', status: 'solde',  amount: 225000 },
  { id: '20003', studentName: 'ASSIN Agoua Yvette',   studentSub: 'Matr. 000100020003 · Espèces', className: 'MMS',   status: 'debute', amount: 30000 },
  { id: '0001',  studentName: 'MANGLE Botty Exaucée', studentSub: 'Matr. 0001 · MoMo',           className: 'CE1 A', status: 'impaye', amount: null },
];

export default function CockpitPage() {
  return (
    <>
      <PageHeader
        title="Cockpit trésorerie"
        sub="Mise à jour à 10h24"
        actions={<RefreshButton onClick={() => location.reload()} />}
      />

      <HeroKPI
        amount={FAKE_TREASURY.total}
        label="Trésorerie"
        metrics={[
          <span key="a"><span className="font-display font-semibold text-white">+{FAKE_TREASURY.todayCollected.toLocaleString('fr-FR')} FCFA</span> encaissés depuis ce matin</span>,
          <span key="b"><span className="font-display font-semibold text-white">{FAKE_TREASURY.todayCount}</span> versements</span>,
          <span key="c"><span className="font-display font-bold text-[#86EFAC]">△</span> <span className="font-display font-semibold text-white">{FAKE_TREASURY.deltaPct.toString().replace('.', ',')}%</span> vs hier</span>,
        ]}
        spark={<Sparkline values={FAKE_TREASURY.sparkValues} />}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KPIStat
          label="Caisse"
          amount={FAKE_TREASURY.cash}
          icon={<div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#ECFDF5] text-[#059669]"><Coins className="h-4 w-4" /></div>}
          footLeft="12 versements aujourd'hui"
          footRight={62000}
        />
        <KPIStat
          label="Mobile Money"
          amount={FAKE_TREASURY.momo}
          icon={<div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-accent-soft text-[#B45309]"><Smartphone className="h-4 w-4" /></div>}
          footLeft={<><span className="text-[#B45309] font-semibold">3</span> en attente d'apurement</>}
          footRight={18500}
        />
        <KPIStat
          label="Banque"
          amount={FAKE_TREASURY.bank}
          icon={<div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#EEF2FA] text-primary"><Landmark className="h-4 w-4" /></div>}
          footLeft="Virement reçu à 08h12"
          footRight={2000}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recouvrement annuel</CardTitle>
              <CardSub>Année scolaire 2025-2026</CardSub>
            </div>
          </CardHeader>
          <div className="flex justify-center">
            <ProgressRing
              value={FAKE_RECOVERY.pct}
              centerLabel={`${FAKE_RECOVERY.pct}%`}
              centerSub="recouvré"
              size={180}
            />
          </div>
          <div className="mt-2.5 flex justify-around border-t border-dashed border-line pt-2.5">
            {[
              { color: '#22C55E', val: FAKE_RECOVERY.solde,  label: 'soldés' },
              { color: '#F69F13', val: FAKE_RECOVERY.debute, label: 'partiel' },
              { color: '#EF4444', val: FAKE_RECOVERY.impaye, label: 'impayés' },
            ].map((leg) => (
              <div key={leg.label} className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: leg.color }} />
                  <span className="font-display text-heading-sm font-semibold">
                    {leg.val.toLocaleString('fr-FR')}
                  </span>
                </div>
                <div className="mt-0.5 text-caption font-medium text-ink-3">{leg.label}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-0">
          <div className="flex items-center justify-between px-5 pt-4">
            <div>
              <CardTitle>Derniers versements</CardTitle>
              <CardSub>Aujourd'hui · {FAKE_TXS.length} opérations</CardSub>
            </div>
            <RefreshButton size="sm" label="Voir tout →" />
          </div>
          <div className="mt-3.5">
            <TxTable rows={FAKE_TXS} />
          </div>
        </Card>
      </div>
    </>
  );
}
```

Note : les valeurs sont fake (constante `FAKE_*`). Le sprint suivant les remplacera par les hooks `useSchoolTreasury`, `useLedgerTransactions`, `useStudentReceivable` de `@edukea/shared`.

- [ ] **Step 2 : Type-check apps/school**

Run: `cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea/apps/school && pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 3 : Lancer le dev server et vérifier visuellement**

Run: `cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea && pnpm --filter @edukea/school dev`

Ouvrir : http://localhost:4002/dashboard

Vérifier visuellement :
1. ✅ Topbar blanche avec logo couleur croppé aligné dans slot 232px
2. ✅ Sidebar sombre bleu Edukea avec pattern de points
3. ✅ Bloc « Espace direction · Collège Akonda-Diarra » en haut de sidebar
4. ✅ Item actif « Cockpit » avec barre orange lumineuse
5. ✅ Hero KPI bleu avec sparkline orange à droite
6. ✅ 3 KPIStat (Caisse / Mobile Money / Banque) avec foot dashed border-top
7. ✅ ProgressRing 71% dans une card avec légende (soldés/partiel/impayés)
8. ✅ TxTable avec avatars colorés + StatusPill R/J/V + montants Clash Display tabulaire

- [ ] **Step 4 : Commit**

```bash
git add apps/school/src/app/(dashboard)/dashboard/page.tsx
git commit -m "feat(school): rebuild cockpit page with @edukea/ui components (fake data)"
```

---

### Task 24 : Vérification finale + commit récap

**Files:**
- Vérification globale, pas de fichier créé.

- [ ] **Step 1 : Lancer tous les type-checks**

Run:

```bash
cd /Users/rodrigue/Documents/GitHub/LAMBANO/Edukea
pnpm --filter @edukea/ui lint
pnpm --filter @edukea/ui test
pnpm --filter @edukea/shared lint
cd apps/school && pnpm exec tsc --noEmit
```

Expected: PASS partout.

- [ ] **Step 2 : Screenshot / preuve visuelle**

Prendre un screenshot du cockpit rendu à http://localhost:4002/dashboard et le sauver comme `docs/superpowers/plans/2026-07-18-design-system-edukea-v1-final.png` pour trace visuelle.

- [ ] **Step 3 : Commit récap (empty commit)**

```bash
git commit --allow-empty -m "milestone: design-system v1 shipped, cockpit consuming @edukea/ui"
```

---

## Auto-review (self-check)

**Spec coverage** :

- [x] §3.1 tokens couleur → Task 4
- [x] §3.1.bis logo assets + crop → Task 7
- [x] §3.2 typographie → Task 5
- [x] §3.3 spacing → Task 5
- [x] §3.4 radius → Task 5
- [x] §3.5 shadows → Task 5
- [x] §3.6 motion → CSS `transition duration-150` dans Button / KPIStat / Card, aucune motion élaborée = OK spec §3.6 "pas de motion élaborée V1"
- [x] §4.1 AppShell → Task 19
- [x] §4.2 Topbar → Task 17
- [x] §4.3 Sidebar sombre → Task 18
- [x] §4.4 Main content padding → Task 19 (AppShell `main gap-5 p-6 sm:p-7`)
- [x] §5.1 HeroKPI → Task 15
- [x] §5.2 KPIStat → Task 15
- [x] §5.3 StatusPill → Task 12
- [x] §5.4 TxRow → Task 16
- [x] §5.5 ProgressRing → Task 14
- [x] §5.6 ContextPill → Task 17
- [x] §5.7 Sparkline → Task 13
- [ ] §5.8 Wizard/Stepper → **hors périmètre V1 de ce plan** (utile pour Inscription, plan séparé)
- [x] §6.1 Primitives P0 : Button (T11), Card (T9), Badge (T10), Avatar (T10), Logo (T8). Input/Textarea/Select/Checkbox/Radio/Switch/Tooltip/Divider **volontairement différés** (non nécessaires au cockpit — plan Inscription les couvrira)
- [x] §6.2 Layout P0 : AppShell, Topbar, Sidebar+family, PageHeader → Tasks 17–19. SidebarWorkspace ajouté (T18). EmptyState, Skeleton **différés** (pas critiques cockpit)
- [x] §6.3 Patterns métier P1 : HeroKPI, KPIStat, StatusPill, TxRow, ContextPill, Sparkline, ProgressRing, RefreshButton → couvertes. Wizard/DataTable **différés**
- [ ] §6.4 Interactive P1-P2 (Modal, Sheet, Dropdown, Toast) → **différés** (pas critiques cockpit V1)
- [ ] §6.5 Charts P2 → différés (out of scope V1 spec §10)
- [x] §7 Anti-patterns → codifiés dans le code (Card variants, StatusPill pas de pill delta, HeroKPI eyebrow éditorial, KPIStat pas de ↑ coloré, SidebarSection sentence case, absence de pulse dot). Pas d'ESLint rule — validation humaine en review pour V1
- [x] §8.1 structure `packages/ui` → Tasks 1–19 la construisent
- [x] §8.2 Consommation dans apps → Task 21
- [x] §8.3 Migration progressive → chaque page migre au fur et à mesure ; pas de suppression `apps/school/src/components/ui/*` dans ce plan (à faire quand la dernière page l'utilise)
- [x] §9 Critères de succès : cockpit rendable en <100 LOC (task 23 ≈ 90 LOC), tokens homogènes, pas d'anti-pattern dans le code livré

**Placeholder scan** : aucun `TODO`/`TBD` dans le plan, sauf le `TODO(sprint 2)` explicite en Task 23 (fake data → hooks ledger) qui est intentionnel et documenté.

**Type consistency** :
- `PaymentStatus` défini T12, réutilisé T16 (TxRow) ✓
- `TxRowData` défini T16, réutilisé T16 (TxTable), T23 (cockpit) ✓
- `SparkPaths` interne à T13, pas exposé ✓
- `Logo` prop `variant` défini T8, cohérent ✓
- Design tokens brand.primary / brand.accent utilisés partout ✓

**Dettes techniques notées** :
1. `SidebarItem` = `<a>` natif → navigation full-page. Follow-up : ajouter `asChild`.
2. `apps/school/src/components/ui/*` (button.tsx, card.tsx, etc.) subsistent en parallèle → migration progressive au fil des pages, à finir quand la dernière page utilise `@edukea/ui`.
3. Cockpit sur fake data → à brancher au ledger via hooks `@edukea/shared` en plan suivant.
4. Composants primitifs (Input/Select/DatePicker/Modal/Wizard) hors V1 → planifiés dans un plan « design-system v2 : formulaires + wizards ».
5. Pas d'ESLint rule pour anti-patterns → review humaine V1, à automatiser V2.

---

## Definition of Done

- [ ] Tous les commits mergés
- [ ] `pnpm --filter @edukea/ui lint` PASS
- [ ] `pnpm --filter @edukea/ui test` PASS (5 tests formatters + 3 tests StatusPill + 3 tests Sparkline = 11 verts)
- [ ] `pnpm --filter @edukea/school build` PASS
- [ ] http://localhost:4002/dashboard rend le cockpit avec tous les éléments checklistés en Task 23 Step 3
- [ ] Screenshot dans `docs/superpowers/plans/`
