'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import type { Tables } from '@edukea/shared';

type AdminProfile = Tables<'admin_profiles'>;

export function useAdminAuth() {
  const supabase = createClient();
  const router = useRouter();
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ['admin-session'],
    queryFn: async (): Promise<{ user: { id: string; email: string } } | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      return { user: { id: user.id, email: user.email ?? '' } };
    },
  });

  const profileQuery = useQuery({
    queryKey: ['admin-profile'],
    queryFn: async (): Promise<AdminProfile | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      return data;
    },
    enabled: !!sessionQuery.data,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await supabase.auth.signOut();
    },
    onSuccess: () => {
      queryClient.clear();
      router.push('/auth/login');
    },
  });

  return {
    session: sessionQuery.data,
    profile: profileQuery.data,
    isLoading: sessionQuery.isLoading || profileQuery.isLoading,
    logout: logoutMutation.mutate,
  };
}
