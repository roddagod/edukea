import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface SchoolStaffRow {
  id: string;
  user_id: string;
  school_id: string;
  role: 'manager' | 'director' | 'censor';
  display_name: string | null;
  created_at: string;
}

export function useSchoolStaff(schoolId: string | undefined) {
  return useQuery<SchoolStaffRow[]>({
    queryKey: ['school-staff', schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('school_staff_profiles')
        .select('id, user_id, school_id, role, display_name, created_at')
        .eq('school_id', schoolId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SchoolStaffRow[];
    },
  });
}
