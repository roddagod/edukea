import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface Periode {
  id: string;
  school_id: string;
  school_year_id: string;
  name: string;
  type: 'trimestre' | 'semestre' | null;
  order: number;
  start_date: string;
  end_date: string;
  is_published: boolean;
}

export function usePeriodes(schoolYearId: string | undefined) {
  return useQuery<Periode[]>({
    queryKey: ['periodes', schoolYearId],
    queryFn: async () => {
      if (!schoolYearId) return [];
      const { data, error } = await supabase
        .from('periodes')
        .select('*')
        .eq('school_year_id', schoolYearId)
        .order('order');
      if (error) throw error;
      return (data ?? []) as Periode[];
    },
    enabled: !!schoolYearId,
  });
}
