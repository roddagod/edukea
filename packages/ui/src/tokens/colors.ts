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
