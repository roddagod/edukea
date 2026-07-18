'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';
import type { Tables } from '@edukea/shared';

type Student = Tables<'students'>;

export interface StudentWithDetails extends Student {
  school_name?: string;
  classroom_name?: string;
}

export function useStudents(search?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-students', search],
    queryFn: async (): Promise<StudentWithDetails[]> => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .is('deleted_at', null)
        .order('lastname')
        .limit(500);

      if (error) throw error;

      let results: StudentWithDetails[] = (data ?? []) as StudentWithDetails[];

      if (search) {
        const lower = search.toLowerCase();
        results = results.filter(s =>
          s.firstname?.toLowerCase().includes(lower) ||
          s.lastname?.toLowerCase().includes(lower) ||
          s.matricule?.toLowerCase().includes(lower)
        );
      }

      return results;
    },
  });
}

export function useStudent(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-student', id],
    queryFn: async (): Promise<Student | null> => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useStudentEnrollments(studentId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-student-enrollments', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_school_year_loggings')
        .select('*')
        .eq('student_id', studentId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as Tables<'student_school_year_loggings'>[];
    },
    enabled: !!studentId,
  });
}
