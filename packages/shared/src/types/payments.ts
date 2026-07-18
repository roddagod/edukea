import type { Tables } from './database.types';

export interface TrancheWithPayments extends Tables<'classroom_school_fees_by_parts'> {
  amountPaid: number;
  status: 'paid' | 'overdue' | 'upcoming' | 'pending';
  remaining: number;
}

export interface PaymentSummary {
  totalFees: number;
  totalPaid: number;
  totalRemaining: number;
  discount: number;
  registrationFees: number;
  additionnalFees: number;
  schoolFees: number;
  schoolFeesNet: number;
  tranches: TrancheWithPayments[];
}

export interface PaymentHistoryItem extends Tables<'paiements'> {
  type_paiement?: Tables<'type_paiements'>;
}
