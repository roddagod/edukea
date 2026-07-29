import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface StructureClassroom {
  id: string;
  school_id: string;
  level_id: string;
  name: string;
  principal_teacher_id: string | null;
}
export interface StructureLevel {
  id: string;
  school_id: string;
  cycle_id: string;
  name: string;
  order: number;
  classrooms: StructureClassroom[];
}
export interface StructureCycle {
  id: string;
  school_id: string;
  name: string;
  levels: StructureLevel[];
}

export function useSchoolStructure(schoolId: string | undefined) {
  return useQuery<StructureCycle[]>({
    queryKey: ['school-structure', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const [cyclesRes, levelsRes, classroomsRes] = await Promise.all([
        supabase.from('cycles').select('*').eq('school_id', schoolId).order('name'),
        supabase.from('levels').select('*').eq('school_id', schoolId).order('order'),
        supabase.from('classrooms').select('*').eq('school_id', schoolId).order('name'),
      ]);
      if (cyclesRes.error) throw cyclesRes.error;
      if (levelsRes.error) throw levelsRes.error;
      if (classroomsRes.error) throw classroomsRes.error;

      const classrooms = (classroomsRes.data ?? []) as StructureClassroom[];
      const levels = ((levelsRes.data ?? []) as StructureLevel[]).map((l) => ({
        ...l,
        classrooms: classrooms.filter((c) => c.level_id === l.id),
      }));
      return ((cyclesRes.data ?? []) as StructureCycle[]).map((c) => ({
        ...c,
        levels: levels.filter((l) => l.cycle_id === c.id),
      }));
    },
    enabled: !!schoolId,
  });
}
