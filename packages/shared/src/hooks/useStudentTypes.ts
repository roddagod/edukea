import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface StudentType {
  id: string;
  school_id: string;
  code: string;
  label: string;
  order: number;
  is_default: boolean;
  created_at: string;
}

export function useStudentTypes(schoolId: string | undefined) {
  return useQuery<StudentType[]>({
    queryKey: ['student-types', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from('student_types')
        .select('*')
        .eq('school_id', schoolId)
        .order('order');
      if (error) throw error;
      return (data ?? []) as StudentType[];
    },
    enabled: !!schoolId,
  });
}
