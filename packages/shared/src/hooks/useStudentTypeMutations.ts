import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface StudentTypeInput {
  id?: string;
  school_id: string;
  code: string;
  label: string;
  order: number;
  is_default: boolean;
}

export function useUpsertStudentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: StudentTypeInput) => {
      if (input.is_default) {
        await supabase
          .from('student_types')
          .update({ is_default: false })
          .eq('school_id', input.school_id)
          .neq('id', input.id ?? '00000000-0000-0000-0000-000000000000');
      }
      const { data, error } = await supabase.from('student_types').upsert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: ['student-types', input.school_id] });
      qc.invalidateQueries({ queryKey: ['pedagogy-setup-status', input.school_id] });
    },
  });
}

export function useDeleteStudentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, schoolId }: { id: string; schoolId: string }) => {
      const { count } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('student_type_id', id);
      if ((count ?? 0) > 0) {
        throw new Error(`Impossible de supprimer : ${count} élève(s) utilisent ce type`);
      }
      const { error } = await supabase.from('student_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['student-types', schoolId] });
      qc.invalidateQueries({ queryKey: ['pedagogy-setup-status', schoolId] });
    },
  });
}
