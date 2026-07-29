import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { SchoolYear } from './useSchoolYears';

export interface SchoolYearInput {
  id?: string;
  school_id: string;
  name: string;
  date_start: string;
  date_end: string;
  periode_type: 'trimestre' | 'semestre';
}

export function useUpsertSchoolYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SchoolYearInput): Promise<SchoolYear> => {
      const { data, error } = await supabase
        .from('school_years')
        .upsert({
          id: input.id,
          school_id: input.school_id,
          name: input.name,
          date_start: input.date_start,
          date_end: input.date_end,
          periode_type: input.periode_type,
        })
        .select()
        .single();
      if (error) throw error;
      return data as SchoolYear;
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: ['school-years', input.school_id] });
      qc.invalidateQueries({ queryKey: ['pedagogy-setup-status', input.school_id] });
    },
  });
}

export function useDeleteSchoolYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, schoolId }: { id: string; schoolId: string }) => {
      const { error } = await supabase
        .from('school_years')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['school-years', schoolId] });
      qc.invalidateQueries({ queryKey: ['pedagogy-setup-status', schoolId] });
    },
  });
}
