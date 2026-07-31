import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface StudentUpdateInput {
  id: string;
  matricule?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  sex?: 'M' | 'F' | null;
  date_of_birth?: string | null;
  place_of_birth?: string | null;
  nationality?: string | null;
  birth_certificate_number?: string | null;
  email?: string | null;
  student_type_id?: string | null;
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: StudentUpdateInput) => {
      const { id, ...patch } = input;
      const { error } = await supabase.from('students').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: ['student-with-enrollment', input.id] });
      qc.invalidateQueries({ queryKey: ['students-list'] });
    },
  });
}

export interface SsylUpdateInput {
  id: string;
  classroom_id?: string;
  is_redoublant?: boolean;
  lv2_subject_id?: string | null;
  mat_secondaire_subject_id?: string | null;
  eps_exemption?: boolean;
}

export function useUpdateSsyl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SsylUpdateInput) => {
      const { id, ...patch } = input;
      const { error } = await supabase
        .from('student_school_year_loggings')
        .update(patch)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: ['ssyl-detail', input.id] });
      qc.invalidateQueries({ queryKey: ['student-with-enrollment'] });
      qc.invalidateQueries({ queryKey: ['students-list'] });
    },
  });
}

export function useArchiveStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from('students')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students-list'] });
      qc.invalidateQueries({ queryKey: ['student-with-enrollment'] });
    },
  });
}

export function useRestoreStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from('students')
        .update({ deleted_at: null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students-list'] });
      qc.invalidateQueries({ queryKey: ['student-with-enrollment'] });
    },
  });
}
