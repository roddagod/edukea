import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface RecoveryLevelSummary {
  school_id: string;
  school_year_id: string;
  level_id: string;
  level_name: string | null;
  cycle_name: string | null;
  level_order: number | null;
  n_students: number;
  n_classrooms: number;
  solde_count: number;
  debute_count: number;
  impaye_count: number;
  billed_total: number;
  collected_total: number;
  remaining_total: number;
}

/**
 * Agrégats par niveau (école × année). Utilisé par le hub recovery pour
 * le drill-down : niveau -> classes du niveau -> élèves de la classe.
 */
export function useRecoveryLevels(schoolId: string | undefined, schoolYearId: string | undefined) {
  return useQuery<RecoveryLevelSummary[]>({
    queryKey: ['recovery-levels', schoolId, schoolYearId],
    enabled: !!schoolId && !!schoolYearId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_recovery_level_summary')
        .select('*')
        .eq('school_id', schoolId!)
        .eq('school_year_id', schoolYearId!)
        .order('level_order', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return ((data as RecoveryLevelSummary[] | null) ?? []).map((r) => ({
        ...r,
        billed_total: Number(r.billed_total),
        collected_total: Number(r.collected_total),
        remaining_total: Number(r.remaining_total),
      }));
    },
  });
}
