'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ChevronLeft, Plus, Coins } from 'lucide-react';
import {
  PageHeader,
  Card,
  CardTitle,
  CardSub,
  Skeleton,
  Avatar,
  toneFromSeed,
  StatusPill,
  ProgressRing,
  Modal,
  Input,
  Button,
} from '@edukea/ui';
import {
  useSchoolContext,
  useStudentDetail,
  useStudentPaymentHistory,
  useRecordPayment,
} from '@edukea/shared';

function fmtNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ');
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

const SOURCES: Array<{ value: 'cash' | 'bank_transfer' | 'internal'; label: string }> = [
  { value: 'cash', label: 'Espèces' },
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'internal', label: 'Autre' },
];

export default function StudentDetailPage() {
  const params = useParams<{ ssylId: string }>();
  const searchParams = useSearchParams();
  const { data: ctx } = useSchoolContext({
    requestedSchoolId: searchParams.get('school'),
    requestedYearId: searchParams.get('year'),
  });

  const { data: student, isLoading: studentLoading } = useStudentDetail(params.ssylId);
  const { data: history, isLoading: historyLoading } = useStudentPaymentHistory(params.ssylId, 50);
  const record = useRecordPayment();

  const [open, setOpen] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [source, setSource] = useState<'cash' | 'bank_transfer' | 'internal'>('cash');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    const school = searchParams.get('school');
    const year = searchParams.get('year');
    if (school) p.set('school', school);
    if (year) p.set('year', year);
    return p.toString() ? `?${p.toString()}` : '';
  }, [searchParams]);

  const pctSolde = student && student.billed_initial > 0
    ? Math.round((student.collected / student.billed_initial) * 100)
    : 0;

  const backHref = student?.classroom_id
    ? `/dashboard/recovery/class/${student.classroom_id}${qs}`
    : `/dashboard/recovery${qs}`;

  const handleSubmit = async () => {
    setError(null);
    const raw = amountInput.replace(/[\s,]/g, '').trim();
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Montant invalide.');
      return;
    }
    if (student && amount > student.remaining && student.remaining > 0) {
      setError(`Le montant dépasse le restant dû (${fmtNumber(student.remaining)} FCFA).`);
      return;
    }
    try {
      await record.mutateAsync({
        ssylId: params.ssylId,
        amount,
        source,
        memo: memo || undefined,
      });
      setOpen(false);
      setAmountInput('');
      setMemo('');
      setSource('cash');
    } catch (e) {
      setError((e as Error).message ?? 'Erreur lors de l\'enregistrement.');
    }
  };

  return (
    <>
      <div>
        <Link href={backHref} className="mb-2 inline-flex items-center gap-1 text-body-sm font-semibold text-primary hover:opacity-80">
          <ChevronLeft className="h-4 w-4" /> Retour
        </Link>
        <PageHeader
          title={studentLoading ? <Skeleton className="h-6 w-64" /> : student?.student_name ?? '—'}
          sub={
            student
              ? [student.classroom_name, student.matricule ? `Matr. ${student.matricule}` : null, ctx?.current_year?.name]
                  .filter(Boolean)
                  .join(' · ')
              : undefined
          }
          actions={
            <Button variant="primary" size="md" onClick={() => setOpen(true)} disabled={!student}>
              <Plus className="h-4 w-4" /> Nouveau versement
            </Button>
          }
        />
      </div>

      {studentLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : student ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
          <Card>
            <div className="flex flex-col items-center gap-3">
              <Avatar
                initials={student.student_name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? '').join('')}
                tone={toneFromSeed(student.ssyl_id)}
                size="lg"
              />
              <StatusPill status={student.status} />
              <ProgressRing
                value={pctSolde}
                centerLabel={`${pctSolde}%`}
                centerSub="payé"
                size={140}
                strokeWidth={12}
              />
            </div>
          </Card>

          <Card>
            <CardTitle>Situation financière</CardTitle>
            <CardSub>Année scolaire {ctx?.current_year?.name ?? ''}</CardSub>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <div className="text-caption text-ink-3">Facturé</div>
                <div className="mt-1 font-display text-heading-md font-semibold tabular-nums text-ink">
                  {fmtNumber(student.billed_initial)}
                  <span className="ml-1 text-body-xs font-medium text-ink-3">FCFA</span>
                </div>
              </div>
              <div>
                <div className="text-caption text-ink-3">Encaissé</div>
                <div className="mt-1 font-display text-heading-md font-semibold tabular-nums text-[#059669]">
                  {fmtNumber(student.collected)}
                  <span className="ml-1 text-body-xs font-medium text-ink-3">FCFA</span>
                </div>
              </div>
              <div>
                <div className="text-caption text-ink-3">Restant dû</div>
                <div className="mt-1 font-display text-heading-md font-semibold tabular-nums text-ink">
                  {fmtNumber(student.remaining)}
                  <span className="ml-1 text-body-xs font-medium text-ink-3">FCFA</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Card>
          <div className="text-center text-body-sm text-ink-3">Élève introuvable.</div>
        </Card>
      )}

      <div>
        <div className="mb-3 font-display text-heading-md font-semibold text-ink">Historique des versements</div>
        {historyLoading ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : (history?.length ?? 0) === 0 ? (
          <Card>
            <div className="text-center text-body-sm text-ink-3">Aucun versement enregistré.</div>
          </Card>
        ) : (
          <Card className="p-0">
            {history!.map((h) => (
              <div key={h.tx_id} className="flex items-center gap-3 border-b border-line-soft px-4 py-3 last:border-b-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#ECFDF5] text-[#059669]">
                  <Coins className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="truncate font-semibold text-ink">{fmtDate(h.occurred_at)}</div>
                    <div className="shrink-0 font-display text-body-md font-semibold tabular-nums text-[#059669]">
                      +{fmtNumber(h.amount)}
                    </div>
                  </div>
                  <div className="mt-0.5 truncate text-caption text-ink-3">
                    {h.source ?? '—'}
                    {h.memo && <> · {h.memo}</>}
                  </div>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Modal Nouveau versement */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nouveau versement"
        description={student ? `Restant dû : ${fmtNumber(student.remaining)} FCFA` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={record.isPending}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={record.isPending}>
              {record.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Montant"
            type="text"
            inputMode="numeric"
            placeholder="Ex : 50 000"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            suffix={<span className="text-body-xs">FCFA</span>}
            autoFocus
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-body-xs font-semibold text-ink-2">Mode de paiement</label>
            <div className="grid grid-cols-3 gap-2">
              {SOURCES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSource(s.value)}
                  className={`rounded-md border px-3 py-2 text-body-sm font-semibold transition-colors ${
                    source === s.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-line bg-white text-ink-2 hover:border-ink-4'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Mémo (optionnel)"
            type="text"
            placeholder="Ex : reçu 2026/03"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
          {error && <div className="text-caption text-destructive">{error}</div>}
        </div>
      </Modal>
    </>
  );
}
