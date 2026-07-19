import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface SchoolContextInfo {
  is_superadmin: boolean;
  schools: Array<{ id: string; name: string }>;
  years: Array<{ id: string; name: string; date_start: string | null; date_end?: string | null }>;
  current_school: { id: string; name: string } | null;
  current_year: { id: string; name: string } | null;
}

export interface UseSchoolContextParams {
  requestedSchoolId?: string | null;
  requestedYearId?: string | null;
}

const FIVE_MINUTES = 5 * 60 * 1000;

/**
 * Contexte multi-école. Un seul RPC roundtrip (get_user_school_context).
 * Cache 5 minutes (staleTime) — le contexte change rarement.
 */
export function useSchoolContext(params: UseSchoolContextParams = {}) {
  const requestedSchoolId = params.requestedSchoolId ?? null;
  const requestedYearId = params.requestedYearId ?? null;

  return useQuery<SchoolContextInfo | null>({
    queryKey: ['school-context', requestedSchoolId, requestedYearId],
    staleTime: FIVE_MINUTES,
    gcTime: FIVE_MINUTES,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_school_context', {
        p_requested_school_id: requestedSchoolId,
        p_requested_year_id: requestedYearId,
      });
      if (error) throw error;
      return (data as SchoolContextInfo | null) ?? null;
    },
  });
}
