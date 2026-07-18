'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';
import type { Tables } from '@edukea/shared';

type School = Tables<'schools'>;

export function useSchools(search?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-schools', search],
    queryFn: async (): Promise<School[]> => {
      let query = supabase
        .from('schools')
        .select('*')
        .is('deleted_at', null)
        .order('name');

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSchool(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-school', id],
    queryFn: async (): Promise<School | null> => {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useSchoolStats(schoolId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-school-stats', schoolId],
    queryFn: async () => {
      const [studentsRes, classroomsRes, parentsRes, familiesRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).is('deleted_at', null),
        supabase.from('classrooms').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).is('deleted_at', null),
        supabase.from('parent_profiles').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
        supabase.from('families').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).is('deleted_at', null),
      ]);

      return {
        students: studentsRes.count ?? 0,
        classrooms: classroomsRes.count ?? 0,
        parents: parentsRes.count ?? 0,
        families: familiesRes.count ?? 0,
      };
    },
    enabled: !!schoolId,
  });
}

export function useCreateSchool() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; email?: string; phone?: string; adress?: string; slogan?: string; bp?: string }) => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { error } = await (supabase.from('schools') as any)
        .insert({ id, ...data, created_at: now, updated_at: now });

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schools'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
  });
}

export function useUpdateSchool() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<School>) => {
      const { error } = await (supabase
        .from('schools') as any)
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schools'] });
      queryClient.invalidateQueries({ queryKey: ['admin-school'] });
    },
  });
}

export function useDeleteSchool() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('schools') as any)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schools'] });
    },
  });
}
