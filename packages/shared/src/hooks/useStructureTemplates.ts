import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface StructureTemplate {
  template_key: string;
  cycle_code: string;
  cycle_name: string;
  level_code: string;
  level_name: string;
  level_order: number;
}

export interface GroupedTemplate {
  template_key: string;
  cycle_name: string;
  levels: { code: string; name: string; order: number }[];
}

export function useStructureTemplates() {
  return useQuery<GroupedTemplate[]>({
    queryKey: ['structure-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('structure_templates')
        .select('*')
        .order('template_key')
        .order('level_order');
      if (error) throw error;

      const rows = (data ?? []) as StructureTemplate[];
      const grouped = new Map<string, GroupedTemplate>();
      for (const r of rows) {
        if (!grouped.has(r.template_key)) {
          grouped.set(r.template_key, { template_key: r.template_key, cycle_name: r.cycle_name, levels: [] });
        }
        grouped.get(r.template_key)!.levels.push({ code: r.level_code, name: r.level_name, order: r.level_order });
      }
      return Array.from(grouped.values());
    },
  });
}
