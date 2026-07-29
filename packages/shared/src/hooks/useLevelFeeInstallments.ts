import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface LevelFeeInstallment {
  id: string;
  level_id: string;
  student_type_id: string;
  order: number;
  label: string;
  category: string;
  due_date_offset_days: number;
  amount: number | null;
  amount_percentage: number | null;
}

export function useLevelFeeInstallments(levelId: string | undefined, studentTypeId: string | undefined): ReturnType<typeof useQuery<LevelFeeInstallment[]>> {
  return useQuery<LevelFeeInstallment[]>({
    queryKey: ['level-fee-installments', levelId, studentTypeId],
    queryFn: async () => {
      if (!levelId || !studentTypeId) return [];
      const { data, error } = await supabase
        .from('level_fee_installments')
        .select('*')
        .eq('level_id', levelId)
        .eq('student_type_id', studentTypeId)
        .order('order');
      if (error) throw error;
      return (data ?? []) as LevelFeeInstallment[];
    },
    enabled: !!levelId && !!studentTypeId,
  });
}

export interface LevelFeeInstallmentInput extends Omit<LevelFeeInstallment, 'id'> {
  id?: string;
}

export function useUpsertLevelFeeInstallment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LevelFeeInstallmentInput) => {
      const { data, error } = await supabase.from('level_fee_installments').upsert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: ['level-fee-installments', input.level_id, input.student_type_id] });
    },
  });
}

export function useDeleteLevelFeeInstallment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; levelId: string; studentTypeId: string }) => {
      const { error } = await supabase.from('level_fee_installments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { levelId, studentTypeId }) => {
      qc.invalidateQueries({ queryKey: ['level-fee-installments', levelId, studentTypeId] });
    },
  });
}
