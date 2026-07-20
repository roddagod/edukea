import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface RecoveryClassSummary {
  school_id: string;
  school_year_id: string;
  classroom_id: string;
  level_id: string | null;
  cycle_id: string | null;
  classroom_name: string | null;
  level_name: string | null;
  cycle_name: string | null;
  n_students: number;
  solde_count: number;
  debute_count: number;
  impaye_count: number;
  billed_total: number;
  collected_total: number;
  remaining_total: number;
}

/**
 * Agrégats par classe (école × année). Filtrage optionnel par level_id
 * pour le drill-down 2e étape (niveau -> ses classes).
 */
export function useRecoveryClasses(
  schoolId: string | undefined,
  schoolYearId: string | undefined,
  levelId?: string,
) {
  return useQuery<RecoveryClassSummary[]>({
    queryKey: ['recovery-classes', schoolId, schoolYearId, levelId ?? null],
    enabled: !!schoolId && !!schoolYearId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      let q = supabase
        .from('v_recovery_class_summary')
        .select('*')
        .eq('school_id', schoolId!)
        .eq('school_year_id', schoolYearId!);
      if (levelId) q = q.eq('level_id', levelId);
      const { data, error } = await q.order('remaining_total', { ascending: false });
      if (error) throw error;
      return ((data as RecoveryClassSummary[] | null) ?? []).map((r) => ({
        ...r,
        billed_total: Number(r.billed_total),
        collected_total: Number(r.collected_total),
        remaining_total: Number(r.remaining_total),
      }));
    },
  });
}
