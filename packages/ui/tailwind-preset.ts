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
        'status-solde-bg':    paymentStatus.solde.bg,
        'status-solde-text':  paymentStatus.solde.text,
        'status-solde-dot':   paymentStatus.solde.dot,
        'status-debute-bg':   paymentStatus.debute.bg,
        'status-debute-text': paymentStatus.debute.text,
        'status-debute-dot':  paymentStatus.debute.dot,
        'status-impaye-bg':   paymentStatus.impaye.bg,
        'status-impaye-text': paymentStatus.impaye.text,
        'status-impaye-dot':  paymentStatus.impaye.dot,
        success: feedback.success,
        warning: feedback.warning,
        destructive: {
          DEFAULT: feedback.danger,
          foreground: '#FFFFFF',
        },
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
      fontFamily: fontFamily as unknown as Record<string, string[]>,
      fontSize: fontSize as unknown as Record<string, [string, { lineHeight?: string; letterSpacing?: string }]>,
      spacing,
      borderRadius: {
        ...radius,
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
