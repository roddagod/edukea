import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { streamPdfResponse, schoolRowToInfo } from '@/lib/pdf-stream';
import {
  StudentPaymentDetailDocument,
  type StudentPaymentDetailData,
  SOURCE_LABEL,
  type PaymentSource,
} from '@edukea/pdf-exports';

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

  // Get installment status (one row per installment)
  const { data: installments } = await supabase
    .from('v_ssyl_installment_status')
    .select('installment_id, label, billed_initial, collected')
    .eq('ssyl_id', ssylId)
    .order('order_index', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const installmentRows = (installments ?? []) as any[];

  // For each installment, fetch its payment history
  const feeLines = await Promise.all(
    installmentRows.map(async (inst) => {
      const totalDue = Number(inst.billed_initial ?? 0);
      const paid = Number(inst.collected ?? 0);
      const remaining = Math.max(0, totalDue - paid);
      const label: string = inst.label ?? '—';
      const category = label.toLowerCase().includes('inscription') ? 'inscription' : 'tuition';

      const { data: paymentsRaw } = await supabase
        .from('payment_allocations')
        .select(`
          allocated_amount,
          ledger_transactions!payment_tx_id(occurred_at, source)
        `)
        .eq('installment_id', inst.installment_id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payments = ((paymentsRaw ?? []) as any[]).map((pa) => {
        const tx = Array.isArray(pa.ledger_transactions) ? pa.ledger_transactions[0] : pa.ledger_transactions;
        const source: PaymentSource = tx?.source ?? 'cash';
        return {
          date: tx?.occurred_at ?? new Date().toISOString(),
          amount: Number(pa.allocated_amount ?? 0),
          method: SOURCE_LABEL[source] ?? source,
        };
      });

      return { category, label, totalDue, paid, remaining, payments };
    }),
  );

  const fullName = `${ssyl.student.firstname ?? ''} ${ssyl.student.lastname ?? ''}`.trim() || '—';

  const data: StudentPaymentDetailData = {
    school: schoolRowToInfo(ssyl.school),
    year: { name: ssyl.school_year?.name ?? '—' },
    student: {
      matricule: ssyl.student.matricule,
      fullName,
      sex: ssyl.student.sex,
      studentTypeLabel: ssyl.student.student_type?.label ?? null,
      classroomName: ssyl.classroom?.name ?? null,
    },
    classroomName: ssyl.classroom?.name ?? '—',
    generatedAt: new Date().toISOString(),
    feeLines,
    reduction: 0,
  };

  return streamPdfResponse(
    <StudentPaymentDetailDocument data={data} />,
    `detail-versements-${ssyl.student.matricule ?? ssylId}.pdf`,
  );
}
