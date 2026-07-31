import { PAYMENT_STATUS } from './constants';

export function formatCurrency(amount: number, currency = 'XOF'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', options ?? { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatShortDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function getPaymentTrancheStatus(dueDate: string, paidAmount: number, totalAmount: number): string {
  if (paidAmount >= totalAmount) return PAYMENT_STATUS.PAID;
  const now = new Date();
  const due = new Date(dueDate);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (due < now) return PAYMENT_STATUS.OVERDUE;
  if (due <= sevenDaysFromNow) return PAYMENT_STATUS.UPCOMING;
  return PAYMENT_STATUS.PENDING;
}

export function calculateAverage(scores: { value: number; coefficient: number }[]): number {
  if (scores.length === 0) return 0;
  const totalWeighted = scores.reduce((sum, s) => sum + s.value * s.coefficient, 0);
  const totalCoeff = scores.reduce((sum, s) => sum + s.coefficient, 0);
  return totalCoeff === 0 ? 0 : Math.round((totalWeighted / totalCoeff) * 100) / 100;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
