import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface SchoolContextInfo {
  is_superadmin: boolean;
  /** Écoles auxquelles l'utilisateur a accès (superadmin = toutes, staff = les siennes) */
  schools: Array<{ id: string; name: string }>;
  /** Années scolaires disponibles pour la school_id sélectionnée */
  years: Array<{ id: string; name: string; date_start: string | null }>;
  /** École actuellement sélectionnée (celle demandée OU la première dispo) */
  current_school: { id: string; name: string } | null;
  /** Année actuellement sélectionnée (celle demandée OU la plus récente) */
  current_year: { id: string; name: string } | null;
}

export interface UseSchoolContextParams {
  /** ID d'école à sélectionner (URL param). Si absent, utilise la 1re accessible. */
  requestedSchoolId?: string | null;
  /** ID d'année à sélectionner (URL param). Si absent, utilise la plus récente. */
  requestedYearId?: string | null;
}

/**
 * Hook central pour tout le module school : détermine
 * - quelles écoles sont accessibles au user (superadmin voit tout,
 *   staff voit ses écoles rattachées),
 * - quelles années sont disponibles pour l'école sélectionnée,
 * - quelle école et quelle année sont "actuellement sélectionnées"
 *   (via `requestedSchoolId`/`requestedYearId`, sinon défaut = première/plus récente).
 *
 * Ne fait aucune écriture. Les hooks consommateurs (useSchoolTreasury,
 * useSchoolRecovery, useRecentPayments) prennent leurs args depuis
 * `current_school.id` et `current_year.id`.
 */
export function useSchoolContext(params: UseSchoolContextParams = {}) {
  const requestedSchoolId = params.requestedSchoolId ?? null;
  const requestedYearId = params.requestedYearId ?? null;

  return useQuery<SchoolContextInfo | null>({
    queryKey: ['school-context', requestedSchoolId, requestedYearId],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) return null;

      // 1. superadmin ?
      const { data: adminRow } = await supabase
        .from('admin_profiles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      const isSuperadmin = adminRow?.role === 'superadmin' || adminRow?.role === 'admin';

      // 2. Écoles accessibles
      let schools: Array<{ id: string; name: string }> = [];
      if (isSuperadmin) {
        const { data } = await supabase
          .from('schools')
          .select('id, name')
          .is('deleted_at', null)
          .order('name');
        schools = ((data as { id: string; name: string }[] | null) ?? []).map((s) => ({ id: s.id, name: s.name }));
      } else {
        // Rattachements school_staff
        const { data } = await supabase
          .from('school_staff_profiles')
          .select('school:schools(id, name)')
          .eq('user_id', userId);
        schools = ((data as { school: { id: string; name: string } | null }[] | null) ?? [])
          .map((r) => r.school)
          .filter((s): s is { id: string; name: string } => !!s);
      }

      if (schools.length === 0) {
        return { is_superadmin: isSuperadmin, schools: [], years: [], current_school: null, current_year: null };
      }

      // 3. École sélectionnée
      const currentSchool =
        (requestedSchoolId && schools.find((s) => s.id === requestedSchoolId)) || schools[0];

      // 4. Années scolaires de cette école
      const { data: yearsData } = await supabase
        .from('school_years')
        .select('id, name, date_start')
        .eq('school_id', currentSchool.id)
        .is('deleted_at', null)
        .order('date_start', { ascending: false });
      const years = ((yearsData as { id: string; name: string; date_start: string | null }[] | null) ?? []).map((y) => ({
        id: y.id,
        name: y.name,
        date_start: y.date_start,
      }));

      // 5. Année sélectionnée
      let currentYear = requestedYearId ? years.find((y) => y.id === requestedYearId) : undefined;
      if (!currentYear) {
        // Prendre l'année active si aujourd'hui est dans un range, sinon la plus récente
        const nowIso = new Date().toISOString();
        const { data: activeYear } = await supabase
          .from('school_years')
          .select('id, name, date_start')
          .eq('school_id', currentSchool.id)
          .is('deleted_at', null)
          .lte('date_start', nowIso)
          .gte('date_end', nowIso)
          .order('date_start', { ascending: false })
          .limit(1)
          .maybeSingle();
        currentYear = activeYear ? { id: (activeYear as { id: string }).id, name: (activeYear as { name: string }).name, date_start: (activeYear as { date_start: string | null }).date_start } : undefined;
      }
      if (!currentYear && years.length > 0) currentYear = years[0];

      return {
        is_superadmin: isSuperadmin,
        schools,
        years,
        current_school: currentSchool,
        current_year: currentYear ? { id: currentYear.id, name: currentYear.name } : null,
      };
    },
  });
}
