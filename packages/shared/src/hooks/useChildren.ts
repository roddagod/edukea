import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Tables } from '../types/database.types';

export interface ChildWithClassroom extends Tables<'students'> {
  current_classroom?: Tables<'classrooms'> & {
    level?: Tables<'levels'>;
  };
  current_logging?: Tables<'student_school_year_loggings'>;
}

export function useChildren() {
  return useQuery<ChildWithClassroom[]>({
    queryKey: ['children'],
    queryFn: async () => {
      // Get student IDs via RPC
      const { data: studentIds } = (await supabase.rpc('get_parent_student_ids')) as unknown as { data: string[] | null };
      if (!studentIds || studentIds.length === 0) return [];

      // Get students
      const { data: students, error } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds)
        .is('deleted_at', null) as any;
      if (error) throw error;
      if (!students || students.length === 0) return [];

      // Get the most recent school year for the student's school
      const schoolId = students[0].school_id;
      const { data: schoolYears } = await supabase
        .from('school_years')
        .select('id')
        .eq('school_id', schoolId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1) as any;

      if (!schoolYears || schoolYears.length === 0) return students as ChildWithClassroom[];
      const currentYearId = schoolYears[0].id;

      // Get classroom assignments for current year
      const { data: loggings } = await supabase
        .from('student_school_year_loggings')
        .select('*, classroom:classrooms(*, level:levels(*))')
        .in('student_id', studentIds)
        .eq('school_year_id', currentYearId)
        .is('deleted_at', null) as any;

      return (students as any[]).map((student: any) => {
        const logging = loggings?.find((l: any) => l.student_id === student.id);
        return {
          ...student,
          current_classroom: logging?.classroom ?? undefined,
          current_logging: logging ? { ...logging, classroom: undefined } : undefined,
        } as ChildWithClassroom;
      });
    },
  });
}
