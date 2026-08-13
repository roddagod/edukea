import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface StudentListRow {
  id: string;
  matricule: string | null;
  firstname: string | null;
  lastname: string | null;
  sex: string | null;
  student_type_id: string | null;
  student_type_label: string | null;
  current_classroom_id: string | null;
  current_classroom_name: string | null;
  current_school_year_name: string | null;
  current_ssyl_id: string | null;
}

export interface StudentsFilters {
  schoolId: string | undefined;
  search?: string;
  classroomId?: string;
  studentTypeId?: string;
  limit?: number;
}

export function useStudentsList(filters: StudentsFilters) {
  return useQuery<StudentListRow[]>({
    queryKey: ['students-list', filters],
    queryFn: async () => {
      if (!filters.schoolId) return [];

      // Base query: students of this school with joins on student_type + latest ssyl
      // NOTE : le join sur ssyl est côté client car on veut le "dernier"
      let q = supabase
        .from('students')
        .select(`
          id, matricule, firstname, lastname, sex,
          student_type_id,
          student_type:student_types(label),
          school_year_loggings:student_school_year_loggings(
            id, classroom_id, created_at, deleted_at,
            school_year:school_years(name),
            classroom:classrooms(name)
          )
        `)
        .eq('school_id', filters.schoolId)
        .is('deleted_at', null)
        .limit(filters.limit ?? 100);

      if (filters.search) {
        // Search on matricule OR firstname OR lastname
        q = q.or(`matricule.ilike.%${filters.search}%,firstname.ilike.%${filters.search}%,lastname.ilike.%${filters.search}%`);
      }
      if (filters.studentTypeId) {
        q = q.eq('student_type_id', filters.studentTypeId);
      }

      const { data, error } = await q;
      if (error) throw error;

      const rows = (data ?? []) as any[];

      // Compute current ssyl côté client (le plus récent, en excluant les archivés)
      let list: StudentListRow[] = rows.map((s) => {
        const loggings = ((s.school_year_loggings ?? []) as any[]).filter((l) => !l.deleted_at);
        const latest = loggings.length > 0
          ? loggings.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))[0]
          : null;
        return {
          id: s.id,
          matricule: s.matricule,
          firstname: s.firstname,
          lastname: s.lastname,
          sex: s.sex,
          student_type_id: s.student_type_id,
          student_type_label: s.student_type?.label ?? null,
          current_ssyl_id: latest?.id ?? null,
          current_classroom_id: latest?.classroom_id ?? null,
          current_classroom_name: latest?.classroom?.name ?? null,
          current_school_year_name: latest?.school_year?.name ?? null,
        };
      });

      // Client-side classroom filter
      if (filters.classroomId) {
        list = list.filter((r) => r.current_classroom_id === filters.classroomId);
      }

      // Sort by lastname then firstname
      list.sort((a, b) => (a.lastname ?? '').localeCompare(b.lastname ?? '') || (a.firstname ?? '').localeCompare(b.firstname ?? ''));

      return list;
    },
    enabled: !!filters.schoolId,
  });
}
