import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { streamPdfResponse, schoolRowToInfo } from '@/lib/pdf-stream';
import { EnrollmentReceiptDocument, type EnrollmentReceiptData } from '@edukea/pdf-exports';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ ssylId: string }> }) {
  const { ssylId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: ssylRaw } = await supabase
    .from('student_school_year_loggings')
    .select(`
      id, created_at,
      student:students(matricule, firstname, lastname, sex,
        student_type:student_types(label)),
      classroom:classrooms(name),
      school_year:school_years(name),
      school:schools(name, display_name, logo_url, address, postal_address,
        phone, email, director_signature_url, country_code, currency)
    `)
    .eq('id', ssylId)
    .maybeSingle();

  if (!ssylRaw) return NextResponse.json({ error: 'ssyl not found' }, { status: 404 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ssyl = ssylRaw as any;

  // Get totals via v_ssyl_installment_status
  const { data: status } = await supabase
    .from('v_ssyl_installment_status')
    .select('billed_initial, collected')
    .eq('ssyl_id', ssylId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalDue = ((status ?? []) as any[]).reduce((sum, r) => sum + Number(r.billed_initial ?? 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const amountPaid = ((status ?? []) as any[]).reduce((sum, r) => sum + Number(r.collected ?? 0), 0);

  const fullName = `${ssyl.student.firstname ?? ''} ${ssyl.student.lastname ?? ''}`.trim() || '—';

  const data: EnrollmentReceiptData = {
    school: schoolRowToInfo(ssyl.school),
    year: { name: ssyl.school_year?.name ?? '—' },
    student: {
      matricule: ssyl.student.matricule,
      fullName,
      sex: ssyl.student.sex,
      studentTypeLabel: ssyl.student.student_type?.label ?? null,
      classroomName: ssyl.classroom?.name ?? null,
    },
    totalDue,
    amountPaid,
    paymentDate: ssyl.created_at,
  };

  return streamPdfResponse(
    <EnrollmentReceiptDocument data={data} />,
    `recu-inscription-${ssyl.student.matricule ?? ssylId}.pdf`,
  );
}
