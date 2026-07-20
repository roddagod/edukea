import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface RecentEnrollmentRow {
  ssyl_id: string;
  school_id: string;
  school_year_id: string;
  created_at: string;
  student_name: string;
  matricule: string | null;
  classroom_name: string | null;
  billed_total: number;
  enrollment_type: 'new' | 'reenroll';
}

/**
 * Dernières inscriptions (SSYL) sur une école + année scolaire données.
 * Utilisé par le hub /dashboard/enrollment.
 */
export function useRecentEnrollments(
  schoolId: string | undefined,
  schoolYearId: string | undefined,
  limit = 10,
) {
  return useQuery<RecentEnrollmentRow[]>({
    queryKey: ['recent-enrollments', schoolId, schoolYearId, limit],
    enabled: !!schoolId && !!schoolYearId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_recent_enrollments')
        .select('*')
        .eq('school_id', schoolId!)
        .eq('school_year_id', schoolYearId!)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return ((data as RecentEnrollmentRow[] | null) ?? []).map((r) => ({
        ...r,
        billed_total: Number(r.billed_total),
      }));
    },
  });
}
