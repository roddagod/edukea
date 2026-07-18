'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';
import type { Tables } from '@edukea/shared';

type Family = Tables<'families'>;

export interface FamilyWithDetails extends Family {
  school_name?: string;
  type_name?: string;
}

export function useFamilies(search?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-families', search],
    queryFn: async (): Promise<FamilyWithDetails[]> => {
      const { data, error } = await supabase
        .from('families')
        .select(`
          *,
          schools!inner(name),
          type_families(name)
        `)
        .is('deleted_at', null)
        .order('lastname');

      if (error) throw error;

      let results: FamilyWithDetails[] = (data ?? []).map((item) => {
        const row = item as any;
        return {
          ...row,
          school_name: row.schools?.name,
          type_name: row.type_families?.name,
          schools: undefined,
          type_families: undefined,
        } as FamilyWithDetails;
      });

      if (search) {
        const lower = search.toLowerCase();
        results = results.filter(f =>
          f.firstname?.toLowerCase().includes(lower) ||
          f.lastname?.toLowerCase().includes(lower) ||
          f.phone?.toLowerCase().includes(lower) ||
          f.email?.toLowerCase().includes(lower)
        );
      }

      return results;
    },
  });
}
