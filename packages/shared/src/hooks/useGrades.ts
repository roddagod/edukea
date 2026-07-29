import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Tables } from '../types/database.types';

export function useGrades(studentId: string | undefined, periodeId?: string) {
  return useQuery<any[]>({
    queryKey: ['grades', studentId, periodeId],
    queryFn: async () => {
      if (!studentId) return [];

      let query = supabase
        .from('notes')
        .select(`
          *,
          evaluation:evaluations(
            *,
            classroom_subject:classroom_subjects(
              subject:subjects(*, group:subject_groups(*)),
              classroom:classrooms(*)
            )
          )
        `)
        .eq('student_id', studentId)
        .eq('evaluation.is_published', true);

      if (periodeId) {
        query = query.eq('evaluation.periode_id', periodeId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });
}
