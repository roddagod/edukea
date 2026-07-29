import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useCopyFeesFromType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ levelId, sourceTypeId, targetTypeId }: {
      levelId: string; sourceTypeId: string; targetTypeId: string;
    }): Promise<number> => {
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string, args: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>)('copy_fees_between_student_types', {
        p_level_id: levelId, p_source_type_id: sourceTypeId, p_target_type_id: targetTypeId,
      });
      if (error) throw error;
      return (data as number) ?? 0;
    },
    onSuccess: (_, { levelId, targetTypeId }) => {
      qc.invalidateQueries({ queryKey: ['level-fee-lines', levelId, targetTypeId] });
      qc.invalidateQueries({ queryKey: ['level-fee-installments', levelId, targetTypeId] });
      qc.invalidateQueries({ queryKey: ['fees-overview-matrix'] });
    },
  });
}
