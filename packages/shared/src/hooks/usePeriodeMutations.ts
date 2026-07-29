import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface PeriodeInput {
  id?: string;
  school_id: string;
  school_year_id: string;
  name: string;
  type: 'trimestre' | 'semestre';
  order: number;
  start_date: string;
  end_date: string;
}

export function useUpsertPeriode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PeriodeInput) => {
      const { data, error } = await supabase.from('periodes').upsert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: ['periodes', input.school_year_id] });
      qc.invalidateQueries({ queryKey: ['pedagogy-setup-status', input.school_id] });
    },
  });
}

export function useDeletePeriode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, schoolYearId, schoolId }: { id: string; schoolYearId: string; schoolId: string }) => {
      const { error } = await supabase.from('periodes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { schoolYearId, schoolId }) => {
      qc.invalidateQueries({ queryKey: ['periodes', schoolYearId] });
      qc.invalidateQueries({ queryKey: ['pedagogy-setup-status', schoolId] });
    },
  });
}

export function useGenerateDefaultPeriodes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      schoolYearId,
      schoolId,
    }: {
      schoolYearId: string;
      schoolId: string;
    }): Promise<number> => {
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>)('generate_default_periodes', {
        p_school_year_id: schoolYearId,
      });
      if (error) throw error;
      return (data as number) ?? 0;
    },
    onSuccess: (_, { schoolYearId, schoolId }) => {
      qc.invalidateQueries({ queryKey: ['periodes', schoolYearId] });
      qc.invalidateQueries({ queryKey: ['pedagogy-setup-status', schoolId] });
    },
  });
}
