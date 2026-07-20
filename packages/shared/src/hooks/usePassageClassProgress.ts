import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface PassageClassProgress {
  school_id: string;
  from_year_id: string;
  classroom_id: string;
  classroom_name: string | null;
  level_name: string | null;
  cycle_name: string | null;
  level_order: number | null;
  n_students: number;
  n_decided: number;
  n_advance: number;
  n_repeat: number;
  n_leave: number;
  n_pending: number;
}

/** Progression du passage class-by-class : compteurs par classe de l'année source. */
export function usePassageClassProgress(schoolId: string | undefined, fromYearId: string | undefined) {
  return useQuery<PassageClassProgress[]>({
    queryKey: ['passage-progress', schoolId, fromYearId],
    enabled: !!schoolId && !!fromYearId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_passage_progress_by_class')
        .select('*')
        .eq('school_id', schoolId!)
        .eq('from_year_id', fromYearId!)
        .order('level_order', { ascending: true, nullsFirst: false })
        .order('classroom_name', { ascending: true });
      if (error) throw error;
      return ((data as PassageClassProgress[] | null) ?? []).map((r) => ({
        ...r,
        n_students: Number(r.n_students ?? 0),
        n_decided: Number(r.n_decided ?? 0),
        n_advance: Number(r.n_advance ?? 0),
        n_repeat: Number(r.n_repeat ?? 0),
        n_leave: Number(r.n_leave ?? 0),
        n_pending: Number(r.n_pending ?? 0),
      }));
    },
  });
}

export interface SaveTransitionsEntry {
  ssyl_id: string;
  decision: 'advance' | 'repeat' | 'leave' | 'pending';
  target_classroom_id?: string;
  note?: string;
}

export function useSaveClassTransitions() {
  const qc = useQueryClient();
  return useMutation<
    { saved: number },
    Error,
    { schoolId: string; fromYearId: string; toYearId: string; entries: SaveTransitionsEntry[] }
  >({
    mutationFn: async ({ schoolId, fromYearId, toYearId, entries }) => {
      const { data, error } = await supabase.rpc('save_class_transitions', {
        p_school_id: schoolId,
        p_from_year_id: fromYearId,
        p_to_year_id: toYearId,
        p_entries: entries,
      });
      if (error) throw error;
      return data as { saved: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['passage-progress'] });
      qc.invalidateQueries({ queryKey: ['year-advancement-preview'] });
    },
  });
}

export function useFinalizeYearAdvancement() {
  const qc = useQueryClient();
  return useMutation<
    { advance: number; repeat: number; leave: number; pending: number },
    Error,
    { schoolId: string; fromYearId: string; toYearId: string }
  >({
    mutationFn: async ({ schoolId, fromYearId, toYearId }) => {
      const { data, error } = await supabase.rpc('finalize_year_advancement', {
        p_school_id: schoolId,
        p_from_year_id: fromYearId,
        p_to_year_id: toYearId,
      });
      if (error) throw error;
      return data as { advance: number; repeat: number; leave: number; pending: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['passage-progress'] });
      qc.invalidateQueries({ queryKey: ['enrollment-stats'] });
      qc.invalidateQueries({ queryKey: ['recovery-students'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
    },
  });
}
