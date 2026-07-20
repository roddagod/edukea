import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface EnrollmentStats {
  school_id: string;
  school_year_id: string;
  total_enrolled: number;
  new_enrollments: number;
  reenrollments: number;
  not_reenrolled_previous: number;
}

/** KPIs du hub Inscription. */
export function useEnrollmentStats(schoolId: string | undefined, schoolYearId: string | undefined) {
  return useQuery<EnrollmentStats | null>({
    queryKey: ['enrollment-stats', schoolId, schoolYearId],
    enabled: !!schoolId && !!schoolYearId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_enrollment_stats')
        .select('*')
        .eq('school_id', schoolId!)
        .eq('school_year_id', schoolYearId!)
        .maybeSingle();
      if (error) throw error;
      return (data as EnrollmentStats | null) ?? null;
    },
  });
}
