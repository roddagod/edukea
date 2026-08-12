import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface CycleInput {
  id?: string;
  school_id: string;
  name: string;
}

export interface LevelInput {
  id?: string;
  school_id: string;
  cycle_id: string;
  name: string;
  order_by: number;
}

export interface ClassroomInput {
  id?: string;
  school_id: string;
  level_id: string;
  name: string;
}

const invalidateStructure = (qc: ReturnType<typeof useQueryClient>, schoolId: string) => {
  qc.invalidateQueries({ queryKey: ['school-structure', schoolId] });
  qc.invalidateQueries({ queryKey: ['pedagogy-setup-status', schoolId] });
};

export function useUpsertCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CycleInput) => {
      const payload = { id: input.id ?? crypto.randomUUID(), school_id: input.school_id, name: input.name };
      const { data, error } = await supabase.from('cycles').upsert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, input) => invalidateStructure(qc, input.school_id),
  });
}

export function useDeleteCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, schoolId }: { id: string; schoolId: string }) => {
      const { error } = await supabase.from('cycles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { schoolId }) => invalidateStructure(qc, schoolId),
  });
}

export function useUpsertLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LevelInput) => {
      const payload = {
        id: input.id ?? `${input.school_id}-${crypto.randomUUID().slice(0, 8)}`,
        school_id: input.school_id,
        cycle_id: input.cycle_id,
        name: input.name,
        order_by: input.order_by,
      };
      const { data, error } = await supabase.from('levels').upsert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, input) => invalidateStructure(qc, input.school_id),
  });
}

export function useDeleteLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, schoolId }: { id: string; schoolId: string }) => {
      void schoolId;
      const { error } = await supabase.from('levels').delete().eq('id', id);
      if (error) {
        // Trigger DB : message clair si des SSYL sont rattaches aux classes
        // (cascade classroom_fee_lines/_installments + fee_lines fait automatiquement)
        const msg = error.message ?? '';
        if (msg.includes('Impossible de supprimer la classe') || msg.includes('eleve(s) inscrit(s)')) {
          throw new Error(msg);
        }
        if (error.code === '23503') {
          throw new Error(
            'Impossible de supprimer ce niveau : il contient encore des donnees liees. Supprimez d\'abord les inscriptions.',
          );
        }
        throw error;
      }
    },
    onSuccess: (_, { schoolId }) => invalidateStructure(qc, schoolId),
  });
}

export function useUpsertClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClassroomInput) => {
      const payload: Record<string, unknown> = {
        id: input.id ?? `${input.school_id}-cr-${crypto.randomUUID().slice(0, 8)}`,
        school_id: input.school_id,
        level_id: input.level_id,
        name: input.name,
      };
      const { data, error } = await supabase.from('classrooms').upsert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, input) => invalidateStructure(qc, input.school_id),
  });
}

export function useDeleteClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, schoolId }: { id: string; schoolId: string }) => {
      const { error } = await supabase.from('classrooms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { schoolId }) => invalidateStructure(qc, schoolId),
  });
}

export function useSeedStructureFromTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      schoolId,
      templateKey,
    }: {
      schoolId: string;
      templateKey: string;
    }): Promise<number> => {
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>)('seed_structure_for_school', {
        p_school_id: schoolId,
        p_template_key: templateKey,
      });
      if (error) throw error;
      return (data as number) ?? 0;
    },
    onSuccess: (_, { schoolId }) => invalidateStructure(qc, schoolId),
  });
}
