import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { streamPdfResponse, schoolRowToInfo } from '@/lib/pdf-stream';
import { ParentContactListDocument, type ParentContactListData } from '@edukea/pdf-exports';

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

  // Students with parent contacts via families FK
  const { data: ssylsRaw } = await supabase
    .from('student_school_year_loggings')
    .select(`
      student:students(
        matricule, firstname, lastname, sex,
        father:families!father_id(firstname, lastname, phone),
        mother:families!mother_id(firstname, lastname, phone),
        tutor:families!tutor_id(firstname, lastname, phone)
      )
    `)
    .eq('classroom_id', classroomId)
    .eq('school_year_id', year.id)
    .is('deleted_at', null)
    .order('student(lastname)', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ssyls = (ssylsRaw ?? []) as any[];

  const rows = ssyls.map((s) => {
    const st = s.student ?? {};
    const fullName = `${st.lastname ?? ''} ${st.firstname ?? ''}`.trim() || '—';

    const fatherRaw = Array.isArray(st.father) ? st.father[0] : st.father;
    const motherRaw = Array.isArray(st.mother) ? st.mother[0] : st.mother;
    const tutorRaw = Array.isArray(st.tutor) ? st.tutor[0] : st.tutor;

    return {
      matricule: st.matricule ?? '—',
      fullName,
      sex: st.sex ?? '—',
      classroom: classroom.name,
      father: fatherRaw
        ? {
            name: [fatherRaw.lastname, fatherRaw.firstname].filter(Boolean).join(' ') || undefined,
            phone: fatherRaw.phone ?? undefined,
          }
        : undefined,
      mother: motherRaw
        ? {
            name: [motherRaw.lastname, motherRaw.firstname].filter(Boolean).join(' ') || undefined,
            phone: motherRaw.phone ?? undefined,
          }
        : undefined,
      guardian: tutorRaw
        ? {
            name: [tutorRaw.lastname, tutorRaw.firstname].filter(Boolean).join(' ') || undefined,
            phone: tutorRaw.phone ?? undefined,
          }
        : undefined,
    };
  });

  const data: ParentContactListData = {
    school: schoolRowToInfo(classroom.school),
    year: { name: year.name ?? '—' },
    classroomName: classroom.name,
    rows,
  };

  return streamPdfResponse(
    <ParentContactListDocument data={data} />,
    `parents-${classroom.name.replace(/\s+/g, '-')}.pdf`,
  );
}
