import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface EffectiveInstallment {
  classroom_id: string;
  student_type_id: string;
  order: number;
  label: string;
  category: string;
  due_date: string;
  amount: number;
  source: 'classroom_override' | 'level';
}

export function useClassroomEffectiveInstallments(classroomId: string | undefined, studentTypeId: string | undefined): ReturnType<typeof useQuery<EffectiveInstallment[]>> {
  return useQuery<EffectiveInstallment[]>({
    queryKey: ['classroom-effective-installments', classroomId, studentTypeId],
    queryFn: async () => {
      if (!classroomId || !studentTypeId) return [];
      const { data, error } = await supabase
        .from('v_classroom_effective_installments')
        .select('*')
        .eq('classroom_id', classroomId)
        .eq('student_type_id', studentTypeId)
        .order('order');
      if (error) throw error;
      return (data ?? []) as EffectiveInstallment[];
    },
    enabled: !!classroomId && !!studentTypeId,
  });
}
