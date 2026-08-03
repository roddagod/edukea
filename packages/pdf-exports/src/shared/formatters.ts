// Autonome : pas d'import @edukea/shared (evite de tirer les hooks React dans le bundle server PDF)
export type Currency = 'XOF' | 'XAF';

const NUM = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const DATE_LONG = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
const DATE_SHORT = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const DATETIME = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function fmtNumber(n: number | null | undefined): string {
  if (n == null) return '—';
  return NUM.format(n);
}

/**
 * Formate un montant avec la devise. Impl local (pas d'import @edukea/shared).
 * Exemple : formatMoney(25000, 'XOF') -> "25 000 XOF"
 */
export function formatMoney(amount: number | null | undefined, currency: Currency = 'XOF'): string {
  if (amount == null) return '—';
  return `${NUM.format(amount)} ${currency}`;
}

export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '—';
  return DATE_SHORT.format(date);
}

export function fmtDateLong(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '—';
  return DATE_LONG.format(date);
}

export function fmtDateTime(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '—';
  return DATETIME.format(date);
}

export function fmtSex(sex: string | null | undefined): string {
  if (!sex) return '—';
  return sex.toUpperCase() === 'M' ? 'M' : sex.toUpperCase() === 'F' ? 'F' : sex;
}

export function fmtBool(b: boolean | null | undefined): string {
  if (b == null) return '—';
  return b ? 'Oui' : 'Non';
}
