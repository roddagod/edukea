import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface EnrollmentDraft {
  id: string;
  user_id: string;
  school_id: string;
  school_year_id: string;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Liste des brouillons d'inscription de l'utilisateur courant sur
 * une école + année scolaire données. RLS filtre déjà par user_id.
 */
export function useEnrollmentDrafts(
  schoolId: string | undefined,
  schoolYearId: string | undefined,
) {
  return useQuery<EnrollmentDraft[]>({
    queryKey: ['enrollment-drafts', schoolId, schoolYearId],
    enabled: !!schoolId && !!schoolYearId,
    staleTime: 10 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollment_drafts')
        .select('*')
        .eq('school_id', schoolId!)
        .eq('school_year_id', schoolYearId!)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data as EnrollmentDraft[] | null) ?? [];
    },
  });
}

/**
 * Upsert d'un brouillon. Si `id` fourni → update ; sinon insert et
 * retourne le nouvel id (que le wizard doit conserver pour les saves
 * suivants).
 */
export function useUpsertEnrollmentDraft() {
  const qc = useQueryClient();
  return useMutation<
    { id: string },
    Error,
    { id?: string; schoolId: string; schoolYearId: string; payload: Record<string, unknown> }
  >({
    mutationFn: async ({ id, schoolId, schoolYearId, payload }) => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;
      if (!userId) throw new Error('Not authenticated');
      if (id) {
        const { data, error } = await supabase
          .from('enrollment_drafts')
          .update({ payload, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select('id')
          .single();
        if (error) throw error;
        return data as { id: string };
      }
      const { data, error } = await supabase
        .from('enrollment_drafts')
        .insert({ user_id: userId, school_id: schoolId, school_year_id: schoolYearId, payload })
        .select('id')
        .single();
      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enrollment-drafts'] }),
  });
}

/**
 * Suppression d'un brouillon (par ex. après un submit réussi du wizard).
 */
export function useDeleteEnrollmentDraft() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from('enrollment_drafts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enrollment-drafts'] }),
  });
}
