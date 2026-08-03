import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { streamPdfResponse, schoolRowToInfo } from '@/lib/pdf-stream';
import { UnpaidReportDocument, type UnpaidReportData } from '@edukea/pdf-exports';

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

  const { data: recRaw } = await supabase
    .from('v_recovery_students')
    .select('matricule, student_full_name, classroom_name, billed_initial, collected, remaining')
    .eq('school_id', classroom.school_id)
    .eq('school_year_id', year.id)
    .eq('classroom_id', classroomId)
    .order('student_full_name', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = ((recRaw ?? []) as any[]).map((r) => ({
    matricule: r.matricule ?? '—',
    fullName: r.student_full_name ?? '—',
    classroom: r.classroom_name ?? classroom.name,
    inscription: 0,   // aggregation par categorie non disponible dans la vue -> 0 pour V1
    annexFees: 0,
    tuition: Number(r.billed_initial ?? 0),
    discount: 0,
    remaining: Number(r.remaining ?? 0),
  }));

  const data: UnpaidReportData = {
    school: schoolRowToInfo(classroom.school),
    year: { name: year.name ?? '—' },
    classroomName: classroom.name,
    date: new Date().toISOString(),
    rows,
  };

  return streamPdfResponse(
    <UnpaidReportDocument data={data} />,
    `impayes-${classroom.name.replace(/\s+/g, '-')}.pdf`,
  );
}
