'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';
import type { Tables } from '@edukea/shared';

type ParentProfile = Tables<'parent_profiles'>;

export interface ParentWithDetails extends ParentProfile {
  school_name?: string;
  family_name?: string;
  email?: string;
}

export function useParents(search?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-parents', search],
    queryFn: async (): Promise<ParentWithDetails[]> => {
      let query = supabase
        .from('parent_profiles')
        .select(`
          *,
          schools!inner(name)
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      let results: ParentWithDetails[] = (data ?? []).map((item) => {
        const row = item as any;
        return {
          ...row,
          school_name: row.schools?.name,
          schools: undefined,
        } as ParentWithDetails;
      });

      if (search) {
        const lower = search.toLowerCase();
        results = results.filter(p =>
          p.phone?.toLowerCase().includes(lower) ||
          p.school_name?.toLowerCase().includes(lower)
        );
      }

      return results;
    },
  });
}

export function useParent(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-parent', id],
    queryFn: async (): Promise<ParentWithDetails | null> => {
      const { data, error } = await supabase
        .from('parent_profiles')
        .select(`
          *,
          schools!inner(name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const row = data as any;
      return {
        ...row,
        school_name: row.schools?.name,
        schools: undefined,
      } as ParentWithDetails;
    },
    enabled: !!id,
  });
}

export function useInviteParent() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; school_id: string; phone?: string }) => {
      const { data: result, error } = await supabase.functions.invoke('parent-invitation', {
        body: { email: data.email, school_id: data.school_id },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      if (data.phone && result?.profile_id) {
        await (supabase.from('parent_profiles') as any)
          .update({ phone: data.phone })
          .eq('id', result.profile_id);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-parents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
  });
}

export function useUpdateParent() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; phone?: string; push_token?: string | null }) => {
      const { error } = await (supabase.from('parent_profiles') as any)
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-parents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-parent'] });
    },
  });
}

export function useDeleteParent() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: profile } = await supabase
        .from('parent_profiles')
        .select('user_id')
        .eq('id', id)
        .single();

      if (!profile) throw new Error('Profil non trouve');

      const { error } = await supabase
        .from('parent_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-parents'] });
    },
  });
}
