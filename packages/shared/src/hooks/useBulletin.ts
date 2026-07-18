import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { BulletinFull } from '../types/grades';

export function useBulletin(studentId: string | undefined, periodeId: string | undefined) {
  return useQuery<BulletinFull | null>({
    queryKey: ['bulletin', studentId, periodeId],
    queryFn: async () => {
      if (!studentId || !periodeId) return null;

      const { data, error } = await supabase
        .from('bulletins')
        .select(`
          *,
          periode:periodes(*),
          student:students(*),
          classroom:classrooms(*),
          subjects:bulletin_subjects(
            *,
            subject:subjects(*, group:subject_groups(*))
          )
        `)
        .eq('student_id', studentId)
        .eq('periode_id', periodeId)
        .eq('is_published', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      return data as unknown as BulletinFull;
    },
    enabled: !!studentId && !!periodeId,
  });
}
