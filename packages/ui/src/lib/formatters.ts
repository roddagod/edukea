export interface FormatFCFAOptions {
  withoutSuffix?: boolean;
}

const NBSP_RE = /[  ]/g;

export function formatFCFA(amount: number, opts: FormatFCFAOptions = {}): string {
  const grouped = new Intl.NumberFormat('fr-FR').format(amount).replace(NBSP_RE, ' ');
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
