import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { renderToStream } from '@react-pdf/renderer';
import { PaymentReceiptDocument } from '@/pdf/PaymentReceiptDocument';
import type { PaymentReceiptData } from '@/pdf/PaymentReceiptDocument';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ txId: string }> }
) {
  const { txId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Fetch transaction
  const { data: tx } = await supabase
    .from('ledger_transactions')
    .select('id, amount, source, memo, occurred_at, ref_id, school_id')
    .eq('id', txId)
    .maybeSingle();

  if (!tx) {
    return NextResponse.json({ error: 'tx not found' }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = tx as any;
  const ssylId = t.ref_id;

  // Fetch enrollment + student + classroom + year + school
  const { data: ssylRaw } = await supabase
    .from('student_school_year_loggings')
    .select(`
      id,
      student:students(id, matricule, firstname, lastname),
      classroom:classrooms(name),
      school_year:school_years(name),
      school:schools(id, name, display_name, logo_url, address, phone, email, accent_color, director_signature_url, currency)
    `)
    .eq('id', ssylId)
    .maybeSingle();

  if (!ssylRaw) {
    return NextResponse.json({ error: 'enrollment not found' }, { status: 404 });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ssyl = ssylRaw as any;

  // Fetch allocations for this transaction
  const { data: allocs } = await supabase
    .from('payment_allocations')
    .select('allocated_amount, installment:classroom_fee_installments(label)')
    .eq('payment_tx_id', txId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allocations = ((allocs ?? []) as any[]).map((a) => ({
    installmentLabel: a.installment?.label ?? null,
    amount: a.allocated_amount,
  }));

  // Build deterministic receipt number from tx id + year
  const shortId = txId.replace(/-/g, '').slice(0, 8).toUpperCase();
  const receiptYear = new Date(t.occurred_at || Date.now()).getFullYear();
  const receiptNumber = `REC-${receiptYear}-${shortId}`;

  const student = ssyl.student;
  const fullName =
    `${student.firstname ?? ''} ${student.lastname ?? ''}`.trim() || '—';

  const data: PaymentReceiptData = {
    receiptNumber,
    paymentDate: t.occurred_at,
    school: {
      name: ssyl.school.name,
      displayName: ssyl.school.display_name,
      logoUrl: ssyl.school.logo_url,
      address: ssyl.school.address,
      phone: ssyl.school.phone,
      email: ssyl.school.email,
      accentColor: ssyl.school.accent_color,
      directorSignatureUrl: ssyl.school.director_signature_url,
    },
    student: {
      matricule: student.matricule,
      fullName,
      classroomName: ssyl.classroom?.name ?? '—',
      schoolYearName: ssyl.school_year?.name ?? '—',
    },
    payment: {
      totalAmount: t.amount,
      source: t.source,
      memo: t.memo,
      occurredAt: t.occurred_at,
    },
    allocations,
  };

  const schoolCurrency = (ssyl.school.currency as 'XOF' | 'XAF') ?? 'XOF';
  const stream = await renderToStream(<PaymentReceiptDocument data={data} currency={schoolCurrency} />);

  // Convert Node.js Readable to web ReadableStream
  const webStream = new ReadableStream({
    start(controller) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (stream as any).on('data', (chunk: Buffer) => controller.enqueue(chunk));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (stream as any).on('end', () => controller.close());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (stream as any).on('error', (err: Error) => controller.error(err));
    },
  });

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${receiptNumber}.pdf"`,
    },
  });
}
