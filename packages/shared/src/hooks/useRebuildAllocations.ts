import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface RebuildResult {
  ssyl_id: string;
  transactions_processed: number;
  total_reallocated: number;
  installments_available: number;
}

/**
 * Reventile tous les paiements d'un SSYL selon les installments actuels.
 * Utile quand les frais/echeances ont ete configures APRES les paiements
 * (paiements orphelins qui apparaissent comme 'trop-percus').
 */
export function useRebuildSsylAllocations() {
  const qc = useQueryClient();
  return useMutation<RebuildResult, Error, { ssylId: string }>({
    mutationFn: async ({ ssylId }) => {
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>)('rebuild_ssyl_allocations', {
        p_ssyl_id: ssylId,
      });
      if (error) throw error as Error;
      return data as RebuildResult;
    },
    onSuccess: (_, { ssylId }) => {
      qc.invalidateQueries({ queryKey: ['ssyl-installment-status', ssylId] });
      qc.invalidateQueries({ queryKey: ['student-with-enrollment'] });
      qc.invalidateQueries({ queryKey: ['student-payment-history', ssylId] });
      qc.invalidateQueries({ queryKey: ['student-detail', ssylId] });
      qc.invalidateQueries({ queryKey: ['recovery-students'] });
    },
  });
}
