export const COLORS = {
  primary: '#1D3A6B',
  primaryLight: '#E8EDF5',
  accent: '#F69F13',
  accentLight: '#FEF1E0',
  background: '#FFFFFF',
  textPrimary: '#030303',
  textSecondary: '#6B7280',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#F59E0B',
  muted: '#9CA3AF',
  border: '#E5E7EB',
} as const;

export const PAYMENT_STATUS = {
  PAID: 'paid',
  OVERDUE: 'overdue',
  UPCOMING: 'upcoming',
  PENDING: 'pending',
} as const;

export const PERIODE_TYPES = {
  TRIMESTRE: 'trimestre',
  SEMESTRE: 'semestre',
} as const;

export const EVALUATION_TYPES = {
  DEVOIR: 'devoir',
  COMPOSITION: 'composition',
  EXAMEN: 'examen',
} as const;
