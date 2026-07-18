'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';
import type { Tables } from '@edukea/shared';

type Classroom = Tables<'classrooms'>;

export interface ClassroomWithDetails extends Classroom {
  school_name?: string;
  level_name?: string;
  school_year_name?: string;
  student_count?: number;
}

export function useClassroomsByYear(schoolYearId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-classrooms-by-year', schoolYearId],
    queryFn: async (): Promise<ClassroomWithDetails[]> => {
      const { data, error } = await supabase
        .from('classrooms')
        .select(`
          *,
          schools!inner(name),
          levels(name),
          school_years(name)
        `)
        .eq('school_year_id', schoolYearId)
        .is('deleted_at', null)
        .order('order_by');

      if (error) throw error;

      return (data ?? []).map((item) => {
        const row = item as any;
        return {
          ...row,
          school_name: row.schools?.name,
          level_name: row.levels?.name,
          school_year_name: row.school_years?.name,
          schools: undefined,
          levels: undefined,
          school_years: undefined,
        } as ClassroomWithDetails;
      });
    },
    enabled: !!schoolYearId,
  });
}

export function useClassrooms(search?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-classrooms', search],
    queryFn: async (): Promise<ClassroomWithDetails[]> => {
      const { data, error } = await supabase
        .from('classrooms')
        .select(`
          *,
          schools!inner(name),
          levels(name),
          school_years(name)
        `)
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;

      let results: ClassroomWithDetails[] = (data ?? []).map((item) => {
        const row = item as any;
        return {
          ...row,
          school_name: row.schools?.name,
          level_name: row.levels?.name,
          school_year_name: row.school_years?.name,
          schools: undefined,
          levels: undefined,
          school_years: undefined,
        } as ClassroomWithDetails;
      });

      if (search) {
        const lower = search.toLowerCase();
        results = results.filter(c =>
          c.name?.toLowerCase().includes(lower) ||
          c.school_name?.toLowerCase().includes(lower) ||
          c.level_name?.toLowerCase().includes(lower)
        );
      }

      return results;
    },
  });
}

export function useClassroom(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-classroom', id],
    queryFn: async (): Promise<ClassroomWithDetails | null> => {
      const { data, error } = await supabase
        .from('classrooms')
        .select(`
          *,
          schools!inner(name),
          levels(name),
          school_years(name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const row = data as any;
      return {
        ...row,
        school_name: row.schools?.name,
        level_name: row.levels?.name,
        school_year_name: row.school_years?.name,
        schools: undefined,
        levels: undefined,
        school_years: undefined,
      } as ClassroomWithDetails;
    },
    enabled: !!id,
  });
}

export function useClassroomStudents(classroomId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-classroom-students', classroomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_school_year_loggings')
        .select(`
          id,
          student_id,
          paiement_status,
          school_fees_total,
          school_fees_paid,
          students!inner(firstname, lastname, matricule, sex)
        `)
        .eq('classroom_id', classroomId)
        .is('deleted_at', null);

      if (error) throw error;
      return (data ?? []).map((item) => {
        const row = item as any;
        return {
          id: row.id,
          student_id: row.student_id,
          firstname: row.students?.firstname,
          lastname: row.students?.lastname,
          matricule: row.students?.matricule,
          sex: row.students?.sex,
          paiement_status: row.paiement_status,
          school_fees_total: row.school_fees_total,
          school_fees_paid: row.school_fees_paid,
        };
      });
    },
    enabled: !!classroomId,
  });
}
