export interface FormatFCFAOptions {
  withoutSuffix?: boolean;
}

const NBSP_RE = /[  ]/g;
const NUM_FMT = new Intl.NumberFormat('fr-FR');

export function formatFCFA(amount: number, opts: FormatFCFAOptions = {}): string {
  const grouped = NUM_FMT.format(amount).replace(NBSP_RE, ' ');
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
