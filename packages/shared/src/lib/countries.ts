/**
 * Configuration par pays pour le lancement Edukea (Cote d'Ivoire + Gabon).
 * Extensible : ajouter un nouveau pays = ajouter une entree ici + migration CHECK.
 */

export type CountryCode = 'CI' | 'GA';
export type Currency = 'XOF' | 'XAF';

export interface CountryConfig {
  code: CountryCode;
  label: string;
  currency: Currency;
  /** Indicatif telephonique (sans le +) */
  phonePrefix: string;
  /** Nombre de chiffres du numero local (sans indicatif) */
  phoneLocalLength: number;
  /** Fuseau horaire IANA */
  timezone: string;
  /** Mobile money providers disponibles */
  paymentProviders: string[];
}

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  CI: {
    code: 'CI',
    label: "Cote d'Ivoire",
    currency: 'XOF',
    phonePrefix: '225',
    phoneLocalLength: 10,
    timezone: 'Africa/Abidjan',
    paymentProviders: ['orange_money', 'mtn_money', 'moov_money', 'wave'],
  },
  GA: {
    code: 'GA',
    label: 'Gabon',
    currency: 'XAF',
    phonePrefix: '241',
    phoneLocalLength: 8,
    timezone: 'Africa/Libreville',
    paymentProviders: ['airtel_money', 'moov_money'],
  },
};

export const COUNTRY_LIST: CountryConfig[] = Object.values(COUNTRIES);

export function getCountryConfig(code: string | undefined | null): CountryConfig {
  const key = (code ?? 'CI').toUpperCase() as CountryCode;
  return COUNTRIES[key] ?? COUNTRIES.CI;
}

/**
 * Formate un montant selon la devise du pays. Sans decimales (CFA est integer).
 * Retourne "1 234 567 XOF" ou "1 234 567 XAF" (fr-FR).
 */
export function formatMoney(amount: number, currency: Currency = 'XOF'): string {
  const n = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount);
  return `${n} ${currency}`;
}

/**
 * Formate un numero de telephone selon le pays.
 * Ex CI: "07 12 34 56 78" (10 chiffres groupes par 2)
 * Ex GA: "07 12 34 56" (8 chiffres groupes par 2)
 * Si le numero contient deja +XXX, on strip et on reformate.
 */
export function formatPhone(raw: string | null | undefined, country: CountryCode = 'CI'): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  const cfg = COUNTRIES[country];
  // Strip prefix pays si present
  const local = digits.startsWith(cfg.phonePrefix)
    ? digits.slice(cfg.phonePrefix.length)
    : digits;
  const truncated = local.slice(0, cfg.phoneLocalLength);
  // Groupes de 2 chiffres
  return truncated.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
}

/**
 * Valide qu'un numero (avec ou sans indicatif) est bien au format du pays.
 */
export function isValidPhone(raw: string | null | undefined, country: CountryCode = 'CI'): boolean {
  if (!raw) return false;
  const digits = raw.replace(/\D/g, '');
  const cfg = COUNTRIES[country];
  const local = digits.startsWith(cfg.phonePrefix)
    ? digits.slice(cfg.phonePrefix.length)
    : digits;
  return local.length === cfg.phoneLocalLength;
}
