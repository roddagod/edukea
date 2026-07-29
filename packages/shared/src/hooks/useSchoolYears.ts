import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface SchoolYear {
  id: string;
  school_id: string;
  name: string;
  date_start: string | null;
  date_end: string | null;
  periode_type: 'trimestre' | 'semestre' | null;
  deleted_at: string | null;
  created_at: string;
}

export function useSchoolYears(schoolId: string | undefined) {
  return useQuery<SchoolYear[]>({
    queryKey: ['school-years', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from('school_years')
        .select('*')
        .eq('school_id', schoolId)
        .is('deleted_at', null)
        .order('date_start', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as SchoolYear[];
    },
    enabled: !!schoolId,
  });
}
