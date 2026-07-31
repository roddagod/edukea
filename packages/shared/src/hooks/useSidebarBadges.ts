import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface SidebarBadges {
  students_enrolled_year: number;
  recovery_students_count: number;
}

/**
 * Counts scopes ecole x annee courante pour badges sidebar.
 * - students_enrolled_year : nombre d'eleves ayant un SSYL actif sur l'annee
 * - recovery_students_count : nombre d'eleves avec un montant en retard > 0
 */
export function useSidebarBadges(
  schoolId: string | undefined,
  schoolYearId: string | undefined,
) {
  return useQuery<SidebarBadges>({
    queryKey: ['sidebar-badges', schoolId, schoolYearId],
    enabled: !!schoolId && !!schoolYearId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const [enrollRes, recRes] = await Promise.all([
        supabase
          .from('student_school_year_loggings')
          .select('id', { count: 'exact', head: true })
          .eq('school_year_id', schoolYearId!)
          .is('deleted_at', null),
        supabase
          .from('v_recovery_students')
          .select('ssyl_id', { count: 'exact', head: true })
          .eq('school_id', schoolId!)
          .eq('school_year_id', schoolYearId!)
          .gt('overdue_amount', 0),
      ]);

      return {
        students_enrolled_year: enrollRes.count ?? 0,
        recovery_students_count: recRes.count ?? 0,
      };
    },
  });
}