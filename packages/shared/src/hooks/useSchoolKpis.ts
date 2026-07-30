import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface SchoolKpis {
  total_students: number;
  new_enrollments: number;
  billed_total: number;
  collected_total: number;
  overdue_total: number;
  installments_due_next_30days: number;
}

/**
 * KPI cards pour le cockpit school :
 *  - total élèves actifs sur l'école
 *  - nouvelles inscriptions (mois courant)
 *  - montants facturés / encaissés / en retard (via v_recovery_students)
 * Cache 60 s.
 */
export function useSchoolKpis(
  schoolId: string | undefined,
  schoolYearId: string | undefined,
) {
  return useQuery<SchoolKpis>({
    queryKey: ['school-kpis', schoolId, schoolYearId],
    enabled: !!schoolId && !!schoolYearId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const [countRes, recRes] = await Promise.all([
        supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('school_id', schoolId!)
          .is('deleted_at', null),
        supabase
          .from('v_recovery_students')
          .select('billed_initial, collected, remaining, overdue_amount')
          .eq('school_id', schoolId!)
          .eq('school_year_id', schoolYearId!),
      ]);

      const totalStudents = countRes.count ?? 0;
      const recRows = (recRes.data ?? []) as {
        billed_initial: unknown;
        collected: unknown;
        remaining: unknown;
        overdue_amount: unknown;
      }[];
      const billed = recRows.reduce((s, r) => s + Number(r.billed_initial ?? 0), 0);
      const collected = recRows.reduce((s, r) => s + Number(r.collected ?? 0), 0);
      const overdue = recRows.reduce((s, r) => s + Number(r.overdue_amount ?? 0), 0);

      // Nouvelles inscriptions ce mois
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const { count: newEnrollCount } = await supabase
        .from('student_school_year_loggings')
        .select('id', { count: 'exact', head: true })
        .eq('school_year_id', schoolYearId!)
        .gte('created_at', monthStart.toISOString())
        .is('deleted_at', null);

      return {
        total_students: totalStudents,
        new_enrollments: newEnrollCount ?? 0,
        billed_total: billed,
        collected_total: collected,
        overdue_total: overdue,
        installments_due_next_30days: 0, // non calculé V1
      };
    },
  });
}
