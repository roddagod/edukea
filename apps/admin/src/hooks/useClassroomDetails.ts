'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';

export function useClassroomSubjects(classroomId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-classroom-subjects', classroomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classroom_subjects')
        .select(`
          *,
          subjects!inner(name, coefficient, max_score, group_id,
            subject_groups(name)
          ),
          teacher_profiles(id, personel_id, user_id)
        `)
        .eq('classroom_id', classroomId);

      if (error) throw error;

      return (data ?? []).map((item) => {
        const row = item as any;
        return {
          id: row.id,
          classroom_id: row.classroom_id,
          subject_id: row.subject_id,
          teacher_id: row.teacher_id,
          coefficient_override: row.coefficient_override,
          subject_name: row.subjects?.name ?? '',
          coefficient: row.coefficient_override ?? row.subjects?.coefficient ?? 1,
          max_score: row.subjects?.max_score ?? 20,
          group_name: row.subjects?.subject_groups?.name ?? '',
          teacher_profile_id: row.teacher_profiles?.id ?? null,
          teacher_user_id: row.teacher_profiles?.user_id ?? null,
        };
      });
    },
    enabled: !!classroomId,
  });
}

export function useClassroomEvaluations(classroomId: string, periodeId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-classroom-evaluations', classroomId, periodeId],
    queryFn: async () => {
      let query = supabase
        .from('evaluations')
        .select(`
          *,
          classroom_subjects!inner(classroom_id, subject_id,
            subjects(name)
          )
        `)
        .eq('classroom_subjects.classroom_id', classroomId)
        .order('date', { ascending: false });

      if (periodeId) {
        query = query.eq('periode_id', periodeId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((item) => {
        const row = item as any;
        return {
          id: row.id,
          name: row.name,
          type: row.type as string,
          max_score: row.max_score,
          weight: row.weight,
          date: row.date,
          is_published: row.is_published,
          periode_id: row.periode_id,
          classroom_subject_id: row.classroom_subject_id,
          subject_name: row.classroom_subjects?.subjects?.name ?? '',
        };
      });
    },
    enabled: !!classroomId,
  });
}

export function useStudentNotes(classroomId: string, periodeId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-student-notes', classroomId, periodeId],
    queryFn: async () => {
      let query = supabase
        .from('notes')
        .select(`
          *,
          evaluations!inner(
            name, type, max_score, date, periode_id,
            classroom_subjects!inner(classroom_id, subject_id,
              subjects(name)
            )
          ),
          students!inner(firstname, lastname, matricule)
        `)
        .eq('evaluations.classroom_subjects.classroom_id', classroomId);

      if (periodeId) {
        query = query.eq('evaluations.periode_id', periodeId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((item) => {
        const row = item as any;
        return {
          id: row.id,
          score: row.score,
          is_absent: row.is_absent,
          comment: row.comment,
          student_id: row.student_id,
          student_name: `${row.students?.lastname ?? ''} ${row.students?.firstname ?? ''}`.trim(),
          student_matricule: row.students?.matricule ?? '',
          evaluation_name: row.evaluations?.name ?? '',
          evaluation_type: row.evaluations?.type ?? '',
          max_score: row.evaluations?.max_score ?? 20,
          subject_name: row.evaluations?.classroom_subjects?.subjects?.name ?? '',
          date: row.evaluations?.date ?? '',
        };
      });
    },
    enabled: !!classroomId,
  });
}

export function usePeriodes(schoolId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-periodes', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('periodes')
        .select('*')
        .eq('school_id', schoolId)
        .order('order');

      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        name: string;
        type: string;
        order: number;
        is_published: boolean;
        school_year_id: string;
      }>;
    },
    enabled: !!schoolId,
  });
}
