import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface StudentWithEnrollment {
  student: {
    id: string;
    matricule: string | null;
    firstname: string | null;
    lastname: string | null;
    sex: string | null;
    birthdate: string | null;
    birthplace: string | null;
    nationality: string | null;
    numero_extrait: string | null;
    photo_url: string | null;
    student_type_id: string | null;
    student_type_label: string | null;
    school_id: string;
  };
  currentSsyl: {
    id: string;
    school_year_id: string;
    school_year_name: string;
    classroom_id: string;
    classroom_name: string;
    level_name: string;
    cycle_name: string;
    is_redoublant: boolean;
    lv2_subject_id: string | null;
    lv2_subject_name: string | null;
    mat_secondaire_subject_id: string | null;
    mat_secondaire_subject_name: string | null;
    eps_exemption: boolean;
  } | null;
}

export function useStudentWithCurrentEnrollment(studentId: string | undefined) {
  return useQuery<StudentWithEnrollment | null>({
    queryKey: ['student-with-enrollment', studentId],
    queryFn: async () => {
      if (!studentId) return null;

      // Fetch student + student_type join
      const { data: studentRaw, error: sErr } = await supabase
        .from('students')
        .select(`
          id, matricule, firstname, lastname, sex, birthdate, birthplace,
          nationality, numero_extrait, photo_url, student_type_id, school_id,
          student_type:student_types(label)
        `)
        .eq('id', studentId)
        .maybeSingle();
      if (sErr) throw sErr;
      if (!studentRaw) return null;

      const s = studentRaw as any;
      const student = {
        id: s.id,
        matricule: s.matricule,
        firstname: s.firstname,
        lastname: s.lastname,
        sex: s.sex,
        birthdate: s.birthdate,
        birthplace: s.birthplace,
        nationality: s.nationality,
        numero_extrait: s.numero_extrait,
        photo_url: s.photo_url,
        student_type_id: s.student_type_id,
        student_type_label: (s.student_type as { label?: string } | null)?.label ?? null,
        school_id: s.school_id,
      };

      // Fetch current enrollment (most recent ssyl)
      const { data: ssylRaw } = await supabase
        .from('student_school_year_loggings')
        .select(`
          id, school_year_id, classroom_id, is_redoublant, lv2_subject_id,
          mat_secondaire_subject_id, eps_exemption,
          school_year:school_years(name),
          classroom:classrooms(name, level:levels(name, cycle:cycles(name))),
          lv2:subjects!lv2_subject_id(name),
          mat_secondaire:subjects!mat_secondaire_subject_id(name)
        `)
        .eq('student_id', studentId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const sy = ssylRaw as any;
      const currentSsyl = sy
        ? {
            id: sy.id,
            school_year_id: sy.school_year_id,
            school_year_name: (sy.school_year as { name?: string } | null)?.name ?? '—',
            classroom_id: sy.classroom_id,
            classroom_name: (sy.classroom as { name?: string } | null)?.name ?? '—',
            level_name:
              (sy.classroom as { level?: { name?: string } } | null)?.level?.name ?? '—',
            cycle_name:
              (sy.classroom as { level?: { cycle?: { name?: string } } } | null)?.level?.cycle
                ?.name ?? '—',
            is_redoublant: !!sy.is_redoublant,
            lv2_subject_id: sy.lv2_subject_id,
            lv2_subject_name: (sy.lv2 as { name?: string } | null)?.name ?? null,
            mat_secondaire_subject_id: sy.mat_secondaire_subject_id,
            mat_secondaire_subject_name:
              (sy.mat_secondaire as { name?: string } | null)?.name ?? null,
            eps_exemption: !!sy.eps_exemption,
          }
        : null;

      return { student, currentSsyl };
    },
    enabled: !!studentId,
  });
}
