import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { LoginCredentials, ParentProfile } from '../types/auth';
import type { Session } from '@supabase/supabase-js';

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: session, isLoading: isSessionLoading } = useQuery<Session | null>({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  const { data: profile, isLoading: isProfileLoading } = useQuery<ParentProfile | null>({
    queryKey: ['parent-profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from('parent_profiles')
        .select('*, father:families!parent_profiles_father_id_fkey(*), mother:families!parent_profiles_mother_id_fkey(*), tutor:families!parent_profiles_tutor_id_fkey(*)')
        .eq('user_id', session.user.id)
        .single();
      if (error) throw error;
      return data as unknown as ParentProfile;
    },
    enabled: !!session?.user?.id,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });

  return {
    user: session?.user ?? null,
    profile: profile ?? null,
    isLoading: isSessionLoading || isProfileLoading,
    isAuthenticated: !!session?.user,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
  };
}
