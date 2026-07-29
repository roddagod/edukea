import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export type StepStatus = 'done' | 'partial' | 'todo' | 'locked' | 'optional';

export interface PedagogySetupStatus {
  school_id: string;
  school_year_id: string | null;
  school_year_name: string | null;
  latest_school_year_name: string | null;
  periode_type: 'trimestre' | 'semestre' | null;
  step_year_done: boolean;
  step_grading_done: boolean;
  step_bulletin_customized: boolean;
  student_types_count: number;
  levels_count: number;
  classrooms_count: number;
  periodes_count: number;
  subjects_count: number;
  fee_lines_count: number;
  teachers_count: number;
  classroom_subjects_with_teacher_count: number;
  classrooms_with_principal_count: number;
}

export interface PedagogyStep {
  key: string;
  order: number;
  label: string;
  status: StepStatus;
  detail: string;
  route: string;
}

export interface PedagogyStepsMap {
  year: PedagogyStep;
  grading: PedagogyStep;
  bulletin_customization: PedagogyStep;
  student_types: PedagogyStep;
  structure: PedagogyStep;
  periods: PedagogyStep;
  subjects: PedagogyStep;
  fees: PedagogyStep;
  teachers_assignments: PedagogyStep;
}

function computeSteps(data: PedagogySetupStatus): PedagogyStepsMap {
  const structureDone = data.levels_count > 0 && data.classrooms_count > 0;
  const typesDone = data.student_types_count >= 1;
  const subjectsDone = data.subjects_count > 0;

  return {
    year: {
      key: 'year',
      order: 1,
      label: 'Année scolaire',
      status: data.step_year_done ? 'done' : 'todo',
      detail: data.step_year_done
        ? (data.school_year_name ?? '—')
        : data.latest_school_year_name
          ? `Dernière : ${data.latest_school_year_name} — nouvelle année à créer`
          : 'Aucune année · À créer',
      route: '/dashboard/pedagogy/school-year',
    },
    grading: {
      key: 'grading',
      order: 2,
      label: 'Barème école',
      status: data.step_grading_done ? 'done' : 'todo',
      detail: 'Notation sur /20 (défaut)',
      route: '/dashboard/pedagogy/grading',
    },
    bulletin_customization: {
      key: 'bulletin_customization',
      order: 3,
      label: 'Personnalisation bulletin',
      status: data.step_bulletin_customized ? 'done' : 'optional',
      detail: data.step_bulletin_customized ? 'Logo + signatures uploadés' : 'Facultatif',
      route: '/dashboard/pedagogy/bulletin-template',
    },
    student_types: {
      key: 'student_types',
      order: 4,
      label: "Types d'élèves",
      status: typesDone ? 'done' : 'todo',
      detail: `${data.student_types_count} type(s) défini(s)`,
      route: '/dashboard/pedagogy/student-types',
    },
    structure: {
      key: 'structure',
      order: 5,
      label: 'Structure école',
      status: structureDone ? 'done' : 'todo',
      detail: `${data.levels_count} niveaux · ${data.classrooms_count} classes`,
      route: '/dashboard/pedagogy/structure',
    },
    periods: {
      key: 'periods',
      order: 6,
      label: "Périodes de l'année",
      status: !data.step_year_done
        ? 'locked'
        : data.periodes_count === 0
          ? 'todo'
          : data.periode_type === 'trimestre' && data.periodes_count < 3
            ? 'partial'
            : data.periode_type === 'semestre' && data.periodes_count < 2
              ? 'partial'
              : 'done',
      detail: `${data.periodes_count} période(s) configurée(s)`,
      route: '/dashboard/pedagogy/periods',
    },
    subjects: {
      key: 'subjects',
      order: 7,
      label: 'Matières & coefficients',
      status: !structureDone ? 'locked' : subjectsDone ? 'done' : 'todo',
      detail: subjectsDone ? `${data.subjects_count} matières` : 'À définir (templates dispo)',
      route: '/dashboard/pedagogy/subjects',
    },
    fees: {
      key: 'fees',
      order: 8,
      label: 'Frais & échéances',
      status: !(typesDone && structureDone)
        ? 'locked'
        : data.fee_lines_count === 0
          ? 'todo'
          : 'done',
      detail: `${data.fee_lines_count} lignes de frais`,
      route: '/dashboard/pedagogy/fees',
    },
    teachers_assignments: {
      key: 'teachers_assignments',
      order: 9,
      label: 'Enseignants & affectations',
      status: !(structureDone && subjectsDone)
        ? 'locked'
        : data.teachers_count === 0
          ? 'todo'
          : data.classroom_subjects_with_teacher_count === 0
            ? 'partial'
            : data.classrooms_with_principal_count < data.classrooms_count
              ? 'partial'
              : 'done',
      detail: `${data.teachers_count} enseignants · ${data.classroom_subjects_with_teacher_count} affectations · ${data.classrooms_with_principal_count} profs principaux`,
      route: '/dashboard/pedagogy/teachers',
    },
  };
}

export function usePedagogySetupStatus(schoolId: string | undefined) {
  const query = useQuery<PedagogySetupStatus | null>({
    queryKey: ['pedagogy-setup-status', schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const { data, error } = await supabase
        .from('v_pedagogy_setup_status')
        .select('*')
        .eq('school_id', schoolId)
        .maybeSingle();
      if (error) throw error;
      return data as PedagogySetupStatus | null;
    },
    enabled: !!schoolId,
  });

  return {
    ...query,
    steps: query.data ? computeSteps(query.data) : undefined,
  };
}
