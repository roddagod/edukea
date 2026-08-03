import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { streamPdfResponse, schoolRowToInfo } from '@/lib/pdf-stream';
import { ClassRollCallDocument, type ClassRollCallData } from '@edukea/pdf-exports';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: classroomRaw } = await supabase
    .from('classrooms')
    .select(`
      id, name, school_id,
      school:schools(name, display_name, logo_url, address, postal_address,
        phone, email, director_signature_url, country_code, currency)
    `)
    .eq('id', classroomId)
    .maybeSingle();
  if (!classroomRaw) return NextResponse.json({ error: 'classroom not found' }, { status: 404 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const classroom = classroomRaw as any;

  // Active year
  const { data: yearRow } = await supabase
    .from('school_years')
    .select('id, name')
    .eq('school_id', classroom.school_id)
    .is('deleted_at', null)
    .gte('date_end', new Date().toISOString().slice(0, 10))
    .order('date_start', { ascending: true })
    .limit(1)
    .maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const year = yearRow as any;
  if (!year) return NextResponse.json({ error: 'no active year' }, { status: 404 });

  // Students in this classroom for active year
  const { data: ssylsRaw } = await supabase
    .from('student_school_year_loggings')
    .select(`
      id, is_redoublant, created_at,
      student:students(
        matricule, firstname, lastname, sex, date_of_birth, place_of_birth,
        nationality,
        student_type:student_types(label)
      ),
      lv2_subject:subjects!lv2_subject_id(name),
      mat_secondaire_subject:subjects!mat_secondaire_subject_id(name)
    `)
    .eq('classroom_id', classroomId)
    .eq('school_year_id', year.id)
    .is('deleted_at', null)
    .order('student(lastname)', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ssyls = (ssylsRaw ?? []) as any[];

  const students = ssyls.map((s) => {
    const st = s.student ?? {};
    const fullName = `${st.lastname ?? ''} ${st.firstname ?? ''}`.trim() || '—';
    return {
      matricule: st.matricule ?? '—',
      fullName,
      sex: st.sex as 'M' | 'F' | null,
      birthDate: st.date_of_birth ?? null,
      birthPlace: st.place_of_birth ?? null,
      nationality: st.nationality ?? null,
      studentTypeLabel: st.student_type?.label ?? null,
      isRepeat: !!s.is_redoublant,
      lv2: s.lv2_subject?.name ?? null,
      secondarySubject: s.mat_secondaire_subject?.name ?? null,
      enrollmentDate: s.created_at ?? null,
    };
  });

  const data: ClassRollCallData = {
    school: schoolRowToInfo(classroom.school),
    year: { name: year.name ?? '—' },
    classroomName: classroom.name,
    students,
  };

  return streamPdfResponse(
    <ClassRollCallDocument data={data} />,
    `liste-appel-${classroom.name.replace(/\s+/g, '-')}.pdf`,
  );
}
