import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export type ReenrollStatus = 'solde' | 'debute' | 'impaye' | 'no_data';

export interface StudentReenrollStatusRow {
  student_id: string;
  last_school_year_id: string | null;
  last_school_year_name: string | null;
  last_classroom_name: string | null;
  billed: number;
  paid: number;
  remaining: number;
  status: ReenrollStatus;
}

export function useStudentReenrollStatus(studentIds: string[]) {
  return useQuery<Map<string, StudentReenrollStatusRow>>({
    queryKey: ['student-reenroll-status', ...studentIds.slice().sort()],
    enabled: studentIds.length > 0,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const map = new Map<string, StudentReenrollStatusRow>();
      if (studentIds.length === 0) return map;

      // Pour chaque student, chercher son dernier ssyl (par created_at DESC)
      const { data, error } = await supabase
        .from('student_school_year_loggings')
        .select(`
          id, student_id, school_year_id, created_at,
          school_year:school_years(name),
          classroom:classrooms(name)
        `)
        .in('student_id', studentIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Pour chaque student, prendre le premier ssyl (le plus récent)
      const seenStudents = new Set<string>();
      const ssylIds: string[] = [];
      const ssylById = new Map<string, { studentId: string; year: string | null; classroom: string | null }>();
      for (const row of ((data ?? []) as any[])) {
        if (seenStudents.has(row.student_id)) continue;
        seenStudents.add(row.student_id);
        ssylIds.push(row.id);
        ssylById.set(row.id, {
          studentId: row.student_id,
          year: (row.school_year as { name?: string } | null)?.name ?? null,
          classroom: (row.classroom as { name?: string } | null)?.name ?? null,
        });
      }

      // Fetch recovery status pour ces ssyl depuis v_recovery_students
      if (ssylIds.length > 0) {
        const { data: rec } = await supabase
          .from('v_recovery_students')
          .select('ssyl_id, billed_initial, collected, remaining, status')
          .in('ssyl_id', ssylIds);

        for (const r of ((rec ?? []) as any[])) {
          const info = ssylById.get(r.ssyl_id);
          if (!info) continue;
          map.set(info.studentId, {
            student_id: info.studentId,
            last_school_year_id: null,
            last_school_year_name: info.year,
            last_classroom_name: info.classroom,
            billed: Number(r.billed_initial ?? 0),
            paid: Number(r.collected ?? 0),
            remaining: Number(r.remaining ?? 0),
            status: r.status as ReenrollStatus,
          });
        }
      }

      // Fallback : students sans ssyl ou sans entrée dans v_recovery_students → status no_data
      for (const sid of studentIds) {
        if (!map.has(sid)) {
          map.set(sid, {
            student_id: sid,
            last_school_year_id: null,
            last_school_year_name: null,
            last_classroom_name: null,
            billed: 0,
            paid: 0,
            remaining: 0,
            status: 'no_data',
          });
        }
      }

      return map;
    },
  });
}

export function reenrollStatusColor(status: ReenrollStatus): { label: string; className: string } {
  switch (status) {
    case 'solde':   return { label: 'Soldé',          className: 'bg-green-100 text-green-700' };
    case 'debute':  return { label: 'Partiel',         className: 'bg-amber-100 text-amber-700' };
    case 'impaye':  return { label: 'Impayé',          className: 'bg-red-100 text-red-700' };
    case 'no_data': return { label: 'Aucune donnée',   className: 'bg-slate-100 text-slate-500' };
  }
}
