import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export type UserRole = 'superadmin' | 'manager' | 'director' | 'censor' | 'teacher' | 'unknown';

export interface CurrentUserRoleInfo {
  role: UserRole;
  userId: string;
  isAdmin: boolean;
}

/**
 * Résout le rôle de l'utilisateur courant en interrogeant successivement :
 *  1. admin_profiles  → superadmin (ou rôle explicite)
 *  2. school_staff_profiles → manager / director / censor
 *  3. teacher_profiles → teacher
 * Cache 5 min (le rôle ne change pas en cours de session).
 */
export function useCurrentUserRole() {
  return useQuery<CurrentUserRoleInfo | null>({
    queryKey: ['current-user-role'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      // 1. Check admin_profiles (superadmin)
      const { data: admin } = await supabase
        .from('admin_profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      if (admin) {
        const role = ((admin as { role?: string }).role as UserRole) ?? 'superadmin';
        return { role, userId: user.id, isAdmin: true };
      }

      // 2. Check school_staff_profiles
      const { data: staff } = await supabase
        .from('school_staff_profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      if (staff) {
        const role = ((staff as { role?: string }).role as UserRole) ?? 'manager';
        return { role, userId: user.id, isAdmin: false };
      }

      // 3. Check teacher_profiles
      const { data: teacher } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (teacher) return { role: 'teacher' as UserRole, userId: user.id, isAdmin: false };

      return { role: 'unknown' as UserRole, userId: user.id, isAdmin: false };
    },
  });
}
