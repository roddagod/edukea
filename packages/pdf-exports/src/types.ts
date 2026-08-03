import type { Currency } from '@edukea/shared';

// =============================================================================
// Types communs a tous les documents PDF
// =============================================================================

export interface SchoolInfo {
  name: string;
  displayName?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  postalAddress?: string | null;
  phone?: string | null;
  email?: string | null;
  directorSignatureUrl?: string | null;
  countryLabel?: string | null; // "Cote d'Ivoire", "Gabon"
  motto?: string | null;         // "Union-Discipline-Travail"
  currency: Currency;
}

export interface StudentRef {
  matricule: string | null;
  fullName: string;
  sex?: 'M' | 'F' | null;
  birthDate?: string | null;
  birthPlace?: string | null;
  nationality?: string | null;
  studentTypeLabel?: string | null;
  classroomName?: string | null;
  isRepeat?: boolean;
  lv2?: string | null;
  secondarySubject?: string | null;
  enrollmentDate?: string | null;
}

export interface ClassroomRef {
  name: string;
  levelName?: string | null;
  cycleName?: string | null;
  principalTeacher?: string | null;
  educator?: string | null;
  discipline?: string | null;
}

export interface YearRef {
  name: string; // "2026-2027"
}

export interface AllocationLine {
  installmentLabel: string | null;
  amount: number;
}

export interface FeeLineDetail {
  category: string;      // 'inscription' | 'tuition' | 'annex' | 'other'
  label: string;
  totalDue: number;
  paid: number;
  remaining: number;
  payments?: Array<{
    date: string;
    amount: number;
    method: string; // "Espèce" | "Chèque" | "Virement"
  }>;
}

export type PaymentSource = 'cash' | 'bank_transfer' | 'internal' | 'mobile_money' | 'check';
export const SOURCE_LABEL: Record<PaymentSource, string> = {
  cash:          'Espèces',
  bank_transfer: 'Virement bancaire',
  internal:      'Interne',
  mobile_money:  'Mobile Money',
  check:         'Chèque',
};
