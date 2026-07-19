import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface CurrentSchoolStaffProfile {
  id: string;
  user_id: string;
  school_id: string;
  role: 'director' | 'accountant' | 'staff';
  display_name: string | null;
  school: {
    id: string;
    name: string;
  } | null;
  current_year: {
    id: string;
    name: string;
  } | null;
}

/**
 * Hook school-side. Retourne le profil school_staff du user courant
 * (school + année scolaire courante inclus). null si non staff ou pas de session.
 */
export function useCurrentSchool() {
  return useQuery<CurrentSchoolStaffProfile | null>({
    queryKey: ['school-staff', 'current'],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) return null;

      const { data: profile, error } = await supabase
        .from('school_staff_profiles')
        .select('id, user_id, school_id, role, display_name, school:schools(id, name)')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      if (!profile) return null;

      // Trouver l'année scolaire "courante" pour l'école
      // Logique : la plus récente dont la date est aujourd'hui, sinon la plus récente
      const now = new Date().toISOString();
      const { data: activeYear } = await supabase
        .from('school_years')
        .select('id, name, date_start, date_end')
        .eq('school_id', profile.school_id)
        .is('deleted_at', null)
        .lte('date_start', now)
        .gte('date_end', now)
        .order('date_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      let currentYear = activeYear;
      if (!currentYear) {
        const { data: latestYear } = await supabase
          .from('school_years')
          .select('id, name, date_start, date_end')
          .eq('school_id', profile.school_id)
          .is('deleted_at', null)
          .order('date_start', { ascending: false })
          .limit(1)
          .maybeSingle();
        currentYear = latestYear ?? null;
      }

      const p = profile as unknown as {
        id: string;
        user_id: string;
        school_id: string;
        role: 'director' | 'accountant' | 'staff';
        display_name: string | null;
        school: { id: string; name: string } | null;
      };

      return {
        ...p,
        current_year: currentYear ? { id: currentYear.id, name: currentYear.name } : null,
      };
    },
  });
}
