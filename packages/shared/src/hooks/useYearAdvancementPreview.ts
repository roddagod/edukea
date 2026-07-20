import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface AdvancementPreviewRow {
  from_ssyl_id: string;
  school_id: string;
  student_id: string;
  matricule: string | null;
  student_name: string;
  from_year_id: string;
  from_classroom_id: string | null;
  from_classroom_name: string | null;
  from_level_id: string | null;
  from_level_name: string | null;
  from_level_order: number | null;
  suggested_level_id: string | null;
  avg_yearly_grade: number | null;
}

/** Pré-calcul du passage d'année : une ligne par élève de l'année source. */
export function useYearAdvancementPreview(schoolId: string | undefined, fromYearId: string | undefined) {
  return useQuery<AdvancementPreviewRow[]>({
    queryKey: ['year-advancement-preview', schoolId, fromYearId],
    enabled: !!schoolId && !!fromYearId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_year_advancement_preview')
        .select('*')
        .eq('school_id', schoolId!)
        .eq('from_year_id', fromYearId!)
        .order('from_level_order', { ascending: true, nullsFirst: false })
        .order('student_name', { ascending: true });
      if (error) throw error;
      return (data as AdvancementPreviewRow[] | null) ?? [];
    },
  });
}
