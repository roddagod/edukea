import { useSchoolContext } from './useSchoolContext';
import type { Currency } from '../lib/countries';

/**
 * Currency de l'ecole courante. Defaut XOF (CI) si contexte pas encore charge.
 * Passe les memes searchParams que useSchoolContext quand disponibles.
 */
export function useSchoolCurrency(params?: {
  requestedSchoolId?: string | null;
  requestedYearId?: string | null;
}): Currency {
  const { data: ctx } = useSchoolContext(params ?? {});
  return ctx?.current_school?.currency ?? 'XOF';
}
