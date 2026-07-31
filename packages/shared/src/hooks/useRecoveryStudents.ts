import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export type RecoveryStatus = 'solde' | 'debute' | 'impaye';

export interface RecoveryStudentRow {
  ssyl_id: string;
  school_id: string;
  school_year_id: string;
  student_id: string;
  student_name: string;
  matricule: string | null;
  classroom_id: string | null;
  classroom_name: string | null;
  level_name: string | null;
  cycle_name: string | null;
  billed_initial: number;
  collected: number;
  remaining: number;
  overdue_amount: number;
  status: RecoveryStatus;
}

export interface RecoveryStudentsPage {
  rows: RecoveryStudentRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UseRecoveryStudentsParams {
  schoolId: string | undefined;
  schoolYearId: string | undefined;
  status?: RecoveryStatus | 'all';
  classroomId?: string | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: 'remaining_desc' | 'remaining_asc' | 'name_asc';
}

const THIRTY_SECONDS = 30 * 1000;
const DEFAULT_PAGE_SIZE = 25;

/**
 * Liste paginee des elèves d'une école × année, avec filtres et tri.
 * Utilise la view `v_recovery_students` (déjà indexée sur school_id/year).
 *
 * Le total est retourne pour permettre la pagination coté client.
 */
export function useRecoveryStudents(params: UseRecoveryStudentsParams) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const status = params.status ?? 'all';
  const classroomId = params.classroomId ?? 'all';
  const search = (params.search ?? '').trim();
  const sort = params.sort ?? 'remaining_desc';

  return useQuery<RecoveryStudentsPage>({
    queryKey: ['recovery-students', params.schoolId, params.schoolYearId, status, classroomId, search, sort, page, pageSize],
    enabled: !!params.schoolId && !!params.schoolYearId,
    staleTime: THIRTY_SECONDS,
    gcTime: THIRTY_SECONDS * 4,
    queryFn: async () => {
      let q = supabase
        .from('v_recovery_students')
        .select('*', { count: 'exact' })
        .eq('school_id', params.schoolId!)
        .eq('school_year_id', params.schoolYearId!);

      if (status !== 'all') q = q.eq('status', status);
      if (classroomId !== 'all') q = q.eq('classroom_id', classroomId);
      if (search.length > 0) {
        // Recherche sur nom OU matricule (ILIKE case-insensitive)
        const like = `%${search}%`;
        q = q.or(`student_name.ilike.${like},matricule.ilike.${like}`);
      }

      switch (sort) {
        case 'remaining_asc':
          q = q.order('remaining', { ascending: true });
          break;
        case 'name_asc':
          q = q.order('student_name', { ascending: true });
          break;
        default:
          q = q.order('remaining', { ascending: false });
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      q = q.range(from, to);

      const { data, error, count } = await q;
      if (error) throw error;

      return {
        rows: ((data as RecoveryStudentRow[] | null) ?? []).map((r) => ({
          ...r,
          billed_initial: Number(r.billed_initial),
          collected: Number(r.collected),
          remaining: Number(r.remaining),
          overdue_amount: Number(r.overdue_amount),
        })),
        total: count ?? 0,
        page,
        pageSize,
      };
    },
  });
}

/**
 * Liste des classes d'une école × année (pour peupler le filtre classroomId).
 * Change rarement — cache 5 minutes.
 */
export function useSchoolClassrooms(schoolId: string | undefined, schoolYearId: string | undefined) {
  return useQuery<Array<{ id: string; name: string }>>({
    queryKey: ['school-classrooms', schoolId, schoolYearId],
    enabled: !!schoolId && !!schoolYearId,
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classrooms')
        .select('id, name')
        .eq('school_id', schoolId!)
        .eq('school_year_id', schoolYearId!)
        .is('deleted_at', null)
        .order('name');
      if (error) throw error;
      return ((data as Array<{ id: string; name: string }> | null) ?? []).map((c) => ({ id: c.id, name: c.name }));
    },
  });
}
