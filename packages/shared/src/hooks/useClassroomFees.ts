import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface ClassroomFees {
  id: string;
  classroom_id: string;
  school_year_id: string;
  type_student_id: string | null;
  registration_fees: number;
  additionnal_fees: number;
  school_fees: number;
  school_fees_discount: number;
  school_fees_net: number;
}

export interface FeePart {
  id: string;
  name: string | null;
  amount: number;
  due_date: string | null;
  order: number;
}

/** Barème d'une classe × année × type d'élève. */
export function useClassroomFees(
  classroomId: string | undefined,
  schoolYearId: string | undefined,
  typeStudentId?: string | null,
) {
  return useQuery<{ fees: ClassroomFees | null; parts: FeePart[] }>({
    queryKey: ['classroom-fees', classroomId, schoolYearId, typeStudentId ?? null],
    enabled: !!classroomId && !!schoolYearId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      let q = supabase
        .from('classroom_school_fees')
        .select('*')
        .eq('classroom_id', classroomId!)
        .eq('school_year_id', schoolYearId!)
        .is('deleted_at', null);
      if (typeStudentId) q = q.eq('type_student_id', typeStudentId);
      const { data, error } = await q.limit(1).maybeSingle();
      if (error) throw error;
      const fees = data as ClassroomFees | null;
      if (!fees) return { fees: null, parts: [] };

      const { data: partsData } = await supabase
        .from('classroom_school_fees_by_parts')
        .select('id, name, amount, due_date, order')
        .eq('school_fees_id', fees.id)
        .is('deleted_at', null)
        .order('order');
      return {
        fees: {
          ...fees,
          registration_fees: Number(fees.registration_fees ?? 0),
          additionnal_fees: Number(fees.additionnal_fees ?? 0),
          school_fees: Number(fees.school_fees ?? 0),
          school_fees_discount: Number(fees.school_fees_discount ?? 0),
          school_fees_net: Number(fees.school_fees_net ?? 0),
        },
        parts: ((partsData as FeePart[] | null) ?? []).map((p) => ({ ...p, amount: Number(p.amount) })),
      };
    },
  });
}
