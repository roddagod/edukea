import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { streamPdfResponse, schoolRowToInfo } from '@/lib/pdf-stream';
import { PaymentStatusDocument, type PaymentStatusData } from '@edukea/pdf-exports';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ ssylId: string }> }) {
  const { ssylId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: ssylRaw } = await supabase
    .from('student_school_year_loggings')
    .select(`
      id,
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

  const { data: status } = await supabase
    .from('v_ssyl_installment_status')
    .select('label, billed_initial, collected')
    .eq('ssyl_id', ssylId)
    .order('order_index', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lines = ((status ?? []) as any[]).map((r) => {
    const billed = Number(r.billed_initial ?? 0);
    const paid = Number(r.collected ?? 0);
    return { label: r.label ?? '—', paid, remaining: Math.max(0, billed - paid) };
  });

  const fullName = `${ssyl.student.firstname ?? ''} ${ssyl.student.lastname ?? ''}`.trim() || '—';

  const data: PaymentStatusData = {
    school: schoolRowToInfo(ssyl.school),
    year: { name: ssyl.school_year?.name ?? '—' },
    student: {
      matricule: ssyl.student.matricule,
      fullName,
      classroomName: ssyl.classroom?.name ?? null,
      studentTypeLabel: ssyl.student.student_type?.label ?? null,
    },
    generatedAt: new Date().toISOString(),
    lines,
  };

  return streamPdfResponse(
    <PaymentStatusDocument data={data} />,
    `statut-paiement-${ssyl.student.matricule ?? ssylId}.pdf`,
  );
}
