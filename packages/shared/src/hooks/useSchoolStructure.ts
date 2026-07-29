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

export interface SchoolStructureData {
  tree: StructureCycle[];
  orphanClassrooms: StructureClassroom[];
}

export function useSchoolStructure(schoolId: string | undefined) {
  return useQuery<SchoolStructureData>({
    queryKey: ['school-structure', schoolId],
    queryFn: async () => {
      if (!schoolId) return { tree: [], orphanClassrooms: [] };
      const [cyclesRes, levelsRes, classroomsRes] = await Promise.all([
        supabase.from('cycles').select('*').eq('school_id', schoolId).order('name'),
        supabase.from('levels').select('*').eq('school_id', schoolId).order('order'),
        supabase.from('classrooms').select('*').eq('school_id', schoolId).order('name'),
      ]);
      if (cyclesRes.error) throw cyclesRes.error;
      if (levelsRes.error) throw levelsRes.error;
      if (classroomsRes.error) throw classroomsRes.error;

      const classrooms = (classroomsRes.data ?? []) as StructureClassroom[];
      const rawLevels = (levelsRes.data ?? []) as StructureLevel[];
      const schoolLevelIds = new Set(rawLevels.map((l) => l.id));

      // Orphelines : classrooms de school_id dont level_id n'est pas dans les levels de l'école
      const orphanClassrooms = classrooms.filter((c) => !schoolLevelIds.has(c.level_id));

      const attachedClassrooms = classrooms.filter((c) => schoolLevelIds.has(c.level_id));

      const levels = rawLevels
        .filter((l) => l.cycle_id) // exclut levels sans cycle (aussi orphelins)
        .map((l) => ({
          ...l,
          classrooms: attachedClassrooms.filter((c) => c.level_id === l.id),
        }));

      const tree = ((cyclesRes.data ?? []) as StructureCycle[]).map((c) => ({
        ...c,
        levels: levels.filter((l) => l.cycle_id === c.id),
      }));

      return { tree, orphanClassrooms };
    },
    enabled: !!schoolId,
  });
}
