import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { streamPdfResponse, schoolRowToInfo } from '@/lib/pdf-stream';
import { ClassEntryTicketDocument, type ClassEntryTicketData } from '@edukea/pdf-exports';

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
      id, created_at,
      student:students(matricule, firstname, lastname, date_of_birth)
    `)
    .eq('classroom_id', classroomId)
    .eq('school_year_id', year.id)
    .is('deleted_at', null)
    .order('student(lastname)', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ssyls = (ssylsRaw ?? []) as any[];

  const cards = ssyls.map((s) => {
    const st = s.student ?? {};
    return {
      matricule: st.matricule ?? '—',
      lastName: st.lastname ?? '—',
      firstName: st.firstname ?? '—',
      birthDate: st.date_of_birth ?? '',
      enrollmentDate: s.created_at ?? undefined,
      classroomName: classroom.name,
    };
  });

  const data: ClassEntryTicketData = {
    school: schoolRowToInfo(classroom.school),
    year: { name: year.name ?? '—' },
    cards,
  };

  return streamPdfResponse(
    <ClassEntryTicketDocument data={data} />,
    `billets-entree-${classroom.name.replace(/\s+/g, '-')}.pdf`,
  );
}
