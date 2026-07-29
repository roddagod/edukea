import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface LevelFeeLine {
  id: string;
  level_id: string;
  student_type_id: string;
  category: string;
  label: string;
  amount: number;
  order: number;
  is_optional: boolean;
}

export function useLevelFeeLines(levelId: string | undefined, studentTypeId: string | undefined): ReturnType<typeof useQuery<LevelFeeLine[]>> {
  return useQuery<LevelFeeLine[]>({
    queryKey: ['level-fee-lines', levelId, studentTypeId],
    queryFn: async () => {
      if (!levelId || !studentTypeId) return [];
      const { data, error } = await supabase
        .from('level_fee_lines')
        .select('*')
        .eq('level_id', levelId)
        .eq('student_type_id', studentTypeId)
        .order('order');
      if (error) throw error;
      return (data ?? []) as LevelFeeLine[];
    },
    enabled: !!levelId && !!studentTypeId,
  });
}

export interface LevelFeeLineInput {
  id?: string;
  level_id: string;
  student_type_id: string;
  category: string;
  label: string;
  amount: number;
  order: number;
  is_optional: boolean;
}

export function useUpsertLevelFeeLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LevelFeeLineInput) => {
      const { data, error } = await supabase.from('level_fee_lines').upsert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: ['level-fee-lines', input.level_id, input.student_type_id] });
      qc.invalidateQueries({ queryKey: ['fees-overview-matrix'] });
      qc.invalidateQueries({ queryKey: ['pedagogy-setup-status'] });
    },
  });
}

export function useDeleteLevelFeeLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; levelId: string; studentTypeId: string }) => {
      const { error } = await supabase.from('level_fee_lines').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { levelId, studentTypeId }) => {
      qc.invalidateQueries({ queryKey: ['level-fee-lines', levelId, studentTypeId] });
      qc.invalidateQueries({ queryKey: ['fees-overview-matrix'] });
    },
  });
}
