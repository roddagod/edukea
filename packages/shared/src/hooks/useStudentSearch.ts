import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface StudentSearchResult {
  id: string;
  firstname: string | null;
  lastname: string | null;
  matricule: string | null;
  school_id: string;
}

/**
 * Recherche d'élèves par nom/prénom/matricule pour l'anti-doublon
 * dans l'Étape 1 du wizard inscription. Debounce à faire côté consommateur.
 */
export function useStudentSearch(schoolId: string | undefined, query: string) {
  const q = query.trim();
  return useQuery<StudentSearchResult[]>({
    queryKey: ['student-search', schoolId, q],
    enabled: !!schoolId && q.length >= 2,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const like = `%${q}%`;
      const { data, error } = await supabase
        .from('students')
        .select('id, firstname, lastname, matricule, school_id')
        .eq('school_id', schoolId!)
        .is('deleted_at', null)
        .or(`firstname.ilike.${like},lastname.ilike.${like},matricule.ilike.${like}`)
        .limit(10);
      if (error) throw error;
      return (data as StudentSearchResult[] | null) ?? [];
    },
  });
}
