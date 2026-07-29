import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface HydrateResult {
  combos_hydrated: number;
  lines_created: number;
  installments_created: number;
}

export function useHydrateFeesFromTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ schoolId }: { schoolId: string }): Promise<HydrateResult> => {
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string, args: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>)('hydrate_fees_from_school_template', {
        p_school_id: schoolId,
      });
      if (error) throw error;
      return data as HydrateResult;
    },
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['fees-overview-matrix', schoolId] });
      qc.invalidateQueries({ queryKey: ['level-fee-lines'] });
      qc.invalidateQueries({ queryKey: ['level-fee-installments'] });
      qc.invalidateQueries({ queryKey: ['pedagogy-setup-status', schoolId] });
    },
  });
}
