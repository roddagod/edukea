import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface FamilySearchResult {
  id: string;
  firstname: string | null;
  lastname: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  school_id: string;
}

/** Recherche parents par nom/téléphone pour Étape 2 wizard. */
export function useFamilySearch(schoolId: string | undefined, query: string) {
  const q = query.trim();
  return useQuery<FamilySearchResult[]>({
    queryKey: ['family-search', schoolId, q],
    enabled: !!schoolId && q.length >= 2,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const like = `%${q}%`;
      const { data, error } = await supabase
        .from('families')
        .select('id, firstname, lastname, phone, email, address, school_id')
        .eq('school_id', schoolId!)
        .is('deleted_at', null)
        .or(`firstname.ilike.${like},lastname.ilike.${like},phone.ilike.${like}`)
        .limit(10);
      if (error) throw error;
      return (data as FamilySearchResult[] | null) ?? [];
    },
  });
}
