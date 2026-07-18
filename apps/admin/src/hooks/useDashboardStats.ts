'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';

export function useDashboardStats() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const [schoolsRes, parentsRes, studentsRes, classroomsRes] = await Promise.all([
        supabase.from('schools').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('parent_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('students').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('classrooms').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      ]);

      return {
        schools: schoolsRes.count ?? 0,
        parents: parentsRes.count ?? 0,
        students: studentsRes.count ?? 0,
        classrooms: classroomsRes.count ?? 0,
      };
    },
  });
}

export function useRecentSchools() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-recent-schools'],
    queryFn: async (): Promise<{ id: string; name: string; email: string | null; phone: string | null }[]> => {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name, email, phone')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return (data ?? []) as { id: string; name: string; email: string | null; phone: string | null }[];
    },
  });
}
