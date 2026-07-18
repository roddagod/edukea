'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';
import type { Tables } from '@edukea/shared';

type SchoolYear = Tables<'school_years'>;

export interface SchoolYearWithDetails extends SchoolYear {
  school_name?: string;
}

export function useSchoolYear(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-school-year', id],
    queryFn: async (): Promise<SchoolYearWithDetails | null> => {
      const { data, error } = await supabase
        .from('school_years')
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
      } as SchoolYearWithDetails;
    },
    enabled: !!id,
  });
}

export function useSchoolYears(search?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-school-years', search],
    queryFn: async (): Promise<SchoolYearWithDetails[]> => {
      const { data, error } = await supabase
        .from('school_years')
        .select(`
          *,
          schools!inner(name)
        `)
        .is('deleted_at', null)
        .order('date_start', { ascending: false });

      if (error) throw error;

      let results: SchoolYearWithDetails[] = (data ?? []).map((item) => {
        const row = item as any;
        return {
          ...row,
          school_name: row.schools?.name,
          schools: undefined,
        } as SchoolYearWithDetails;
      });

      if (search) {
        const lower = search.toLowerCase();
        results = results.filter(sy =>
          sy.name?.toLowerCase().includes(lower) ||
          sy.school_name?.toLowerCase().includes(lower)
        );
      }

      return results;
    },
  });
}
