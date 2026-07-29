import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface FeesMatrixRow {
  level_id: string;
  level_name: string;
  level_order: number;
  school_id: string;
  student_type_id: string;
  student_type_code: string;
  student_type_label: string;
  student_type_order: number;
  total_mandatory: number;
  total_with_options: number;
  lines_count: number;
  installments_count: number;
}

export function useFeesOverviewMatrix(schoolId: string | undefined): ReturnType<typeof useQuery<FeesMatrixRow[]>> {
  return useQuery<FeesMatrixRow[]>({
    queryKey: ['fees-overview-matrix', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from('v_fees_overview_matrix')
        .select('*')
        .eq('school_id', schoolId)
        .order('level_order')
        .order('student_type_order');
      if (error) throw error;
      return (data ?? []) as FeesMatrixRow[];
    },
    enabled: !!schoolId,
  });
}
