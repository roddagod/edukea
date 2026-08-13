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

/**
 * Retourne les échéances effectives pour un couple (classe, type d'élève).
 * Si `schoolYearId` est fourni, les échéances non matérialisées (source 'level')
 * sont calculées avec les dates de cette année scolaire. Sinon la vue fallback
 * utilise la dernière année scolaire de l'école (ancien comportement).
 */
export function useClassroomEffectiveInstallments(
  classroomId: string | undefined,
  studentTypeId: string | undefined,
  schoolYearId?: string | undefined,
): ReturnType<typeof useQuery<EffectiveInstallment[]>> {
  return useQuery<EffectiveInstallment[]>({
    queryKey: ['classroom-effective-installments', classroomId, studentTypeId, schoolYearId ?? null],
    queryFn: async () => {
      if (!classroomId || !studentTypeId) return [];
      if (schoolYearId) {
        const { data, error } = await (supabase.rpc as unknown as (
          fn: string,
          args: Record<string, unknown>,
        ) => Promise<{ data: unknown; error: unknown }>)('get_effective_installments_for_year', {
          p_classroom_id: classroomId,
          p_student_type_id: studentTypeId,
          p_school_year_id: schoolYearId,
        });
        if (error) throw error as Error;
        return ((data as EffectiveInstallment[] | null) ?? []).slice().sort((a, b) => a.order - b.order);
      }
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
