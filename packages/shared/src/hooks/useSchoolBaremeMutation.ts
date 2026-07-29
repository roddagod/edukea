import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useUpdateSchoolBareme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ schoolId, maxScore }: { schoolId: string; maxScore: number }) => {
      const { error } = await supabase
        .from('schools')
        .update({ default_max_score: maxScore })
        .eq('id', schoolId);
      if (error) throw error;
    },
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['pedagogy-setup-status', schoolId] });
    },
  });
}
