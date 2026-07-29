import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface EffectiveFee {
  classroom_id: string;
  student_type_id: string;
  category: string;
  label: string;
  amount: number;
  order: number;
  source: 'classroom_override' | 'level';
}

export function useClassroomEffectiveFees(classroomId: string | undefined, studentTypeId: string | undefined): ReturnType<typeof useQuery<EffectiveFee[]>> {
  return useQuery<EffectiveFee[]>({
    queryKey: ['classroom-effective-fees', classroomId, studentTypeId],
    queryFn: async () => {
      if (!classroomId || !studentTypeId) return [];
      const { data, error } = await supabase
        .from('v_classroom_effective_fees')
        .select('*')
        .eq('classroom_id', classroomId)
        .eq('student_type_id', studentTypeId)
        .order('order');
      if (error) throw error;
      return (data ?? []) as EffectiveFee[];
    },
    enabled: !!classroomId && !!studentTypeId,
  });
}
