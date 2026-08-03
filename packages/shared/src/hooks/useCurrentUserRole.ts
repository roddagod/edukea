import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export type UserRole = 'superadmin' | 'manager' | 'director' | 'censor' | 'teacher' | 'unknown';

export interface CurrentUserRoleInfo {
  role: UserRole;
  userId: string;
  isAdmin: boolean;
  displayName: string | null;
  email: string | null;
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

      const email = user.email ?? null;

      // 1. Check admin_profiles (superadmin)
      const { data: admin } = await supabase
        .from('admin_profiles')
        .select('role, display_name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (admin) {
        const a = admin as { role?: string; display_name?: string | null };
        return {
          role: (a.role as UserRole) ?? 'superadmin',
          userId: user.id,
          isAdmin: true,
          displayName: a.display_name ?? null,
          email,
        };
      }

      // 2. Check school_staff_profiles
      const { data: staff } = await supabase
        .from('school_staff_profiles')
        .select('role, display_name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (staff) {
        const s = staff as { role?: string; display_name?: string | null };
        return {
          role: (s.role as UserRole) ?? 'manager',
          userId: user.id,
          isAdmin: false,
          displayName: s.display_name ?? null,
          email,
        };
      }

      // 3. Check teacher_profiles
      const { data: teacher } = await supabase
        .from('teacher_profiles')
        .select('id, display_name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (teacher) {
        const t = teacher as { display_name?: string | null };
        return {
          role: 'teacher' as UserRole,
          userId: user.id,
          isAdmin: false,
          displayName: t.display_name ?? null,
          email,
        };
      }

      return {
        role: 'unknown' as UserRole,
        userId: user.id,
        isAdmin: false,
        displayName: null,
        email,
      };
    },
  });
}

/** Fabrique des initiales max 2 lettres depuis un nom complet ou un email. */
export function computeInitials(displayName: string | null, email: string | null): string {
  const src = (displayName ?? email ?? '').trim();
  if (!src) return '?';
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase() || src[0]?.toUpperCase() || '?';
}

/** Label lisible du rôle en francais. */
export function labelForRole(role: UserRole): string {
  switch (role) {
    case 'superadmin': return 'Superadmin';
    case 'manager':    return 'Manager';
    case 'director':   return 'Directeur';
    case 'censor':     return 'Censeur';
    case 'teacher':    return 'Enseignant';
    default:           return 'Utilisateur';
  }
}
