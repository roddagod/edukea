'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import {
  useStudentWithCurrentEnrollment,
  useSsylInstallmentStatus,
  useStudentPaymentHistory,
} from '@edukea/shared';
import { PageHeader, Card, Skeleton, Button, Badge } from '@edukea/ui';
import { ArrowLeft, Plus, Pencil } from 'lucide-react';
import { RecordPaymentDialog } from '@/components/RecordPaymentDialog';
import type { StudentPaymentHistoryRow } from '@edukea/shared';

const XAF = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

function fmtDatetime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  paid:    { label: 'Soldé',      className: 'bg-green-100 text-green-700' },
  partial: { label: 'Partiel',    className: 'bg-amber-100 text-amber-700' },
  due:     { label: 'À échéance', className: 'bg-orange-100 text-orange-700' },
  overdue: { label: 'En retard',  className: 'bg-red-100 text-red-700' },
  future:  { label: 'Futur',      className: 'bg-slate-100 text-slate-600' },
};

export default function StudentPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const [showPayment, setShowPayment] = useState(false);

  const { data, isLoading } = useStudentWithCurrentEnrollment(studentId);
  const currentSsylId = data?.currentSsyl?.id;
  const { data: installments } = useSsylInstallmentStatus(currentSsylId);
  const { data: history } = useStudentPaymentHistory(currentSsylId, 20);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Link
          href="/dashboard/students"
          className="mb-4 inline-flex items-center gap-1 text-body-sm text-ink-3 hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Retour à la liste
        </Link>
        <p className="text-body-sm text-ink-3">Élève introuvable.</p>
      </div>
    );
  }

  const { student, currentSsyl } = data;
  const fullName =
    [student.firstname, student.lastname].filter(Boolean).join(' ') || '—';

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/dashboard/students"
          className="inline-flex items-center gap-1 text-body-sm text-ink-3 hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Retour à la liste
        </Link>
      </div>

      {/* Header */}
      <PageHeader
        title={fullName}
        sub={
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {student.matricule && (
              <>
                <span className="text-body-xs text-ink-3">Matricule</span>
                <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-ink">
                  {student.matricule}
                </code>
              </>
            )}
            {currentSsyl && (
              <>
                <span className="text-ink-3">·</span>
                <Badge className="bg-primary/10 text-primary font-semibold">
                  {currentSsyl.classroom_name} · {currentSsyl.school_year_name}
                </Badge>
              </>
            )}
            {student.student_type_label && (
              <Badge className="bg-blue-100 text-blue-800">
                {student.student_type_label}
              </Badge>
            )}
          </div>
        }
        actions={
          <div className="flex gap-2">
            {currentSsyl && (
              <Button variant="primary" onClick={() => setShowPayment(true)}>
                <Plus className="h-4 w-4" /> Nouveau versement
              </Button>
            )}
            <Button variant="secondary" disabled title="Bientôt disponible">
              <Pencil className="h-4 w-4" /> Éditer
            </Button>
          </div>
        }
      />

      {/* Identity + Current enrollment (2 cols) */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Identité */}
        <Card className="space-y-3">
          <h2 className="font-display text-heading-sm font-semibold text-ink">Identité</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-body-sm">
            <div>
              <dt className="text-body-xs text-ink-3">Sexe</dt>
              <dd className="mt-0.5 font-medium text-ink">
                {student.sex === 'M' ? 'Masculin' : student.sex === 'F' ? 'Féminin' : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-body-xs text-ink-3">Né(e) le</dt>
              <dd className="mt-0.5 font-medium text-ink">{fmtDate(student.birthdate)}</dd>
            </div>
            <div>
              <dt className="text-body-xs text-ink-3">Lieu de naissance</dt>
              <dd className="mt-0.5 font-medium text-ink">{student.birthplace ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-body-xs text-ink-3">Nationalité</dt>
              <dd className="mt-0.5 font-medium text-ink">{student.nationality ?? '—'}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-body-xs text-ink-3">N° extrait de naissance</dt>
              <dd className="mt-0.5 font-mono text-xs text-ink">
                {student.numero_extrait ?? '—'}
              </dd>
            </div>
          </dl>
        </Card>

        {/* Inscription courante */}
        {currentSsyl ? (
          <Card className="space-y-3">
            <h2 className="font-display text-heading-sm font-semibold text-ink">
              Inscription courante
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-body-sm">
              <div>
                <dt className="text-body-xs text-ink-3">Année scolaire</dt>
                <dd className="mt-0.5 font-medium text-ink">{currentSsyl.school_year_name}</dd>
              </div>
              <div>
                <dt className="text-body-xs text-ink-3">Cycle</dt>
                <dd className="mt-0.5 font-medium text-ink">{currentSsyl.cycle_name}</dd>
              </div>
              <div>
                <dt className="text-body-xs text-ink-3">Niveau</dt>
                <dd className="mt-0.5 font-medium text-ink">{currentSsyl.level_name}</dd>
              </div>
              <div>
                <dt className="text-body-xs text-ink-3">Classe</dt>
                <dd className="mt-0.5 font-medium text-ink">{currentSsyl.classroom_name}</dd>
              </div>
              {currentSsyl.lv2_subject_name && (
                <div>
                  <dt className="text-body-xs text-ink-3">LV2</dt>
                  <dd className="mt-0.5 font-medium text-ink">
                    {currentSsyl.lv2_subject_name}
                  </dd>
                </div>
              )}
              {currentSsyl.mat_secondaire_subject_name && (
                <div>
                  <dt className="text-body-xs text-ink-3">Mat. secondaire</dt>
                  <dd className="mt-0.5 font-medium text-ink">
                    {currentSsyl.mat_secondaire_subject_name}
                  </dd>
                </div>
              )}
              {(currentSsyl.is_redoublant || currentSsyl.eps_exemption) && (
                <div className="col-span-2 flex flex-wrap gap-2">
                  {currentSsyl.is_redoublant && (
                    <Badge className="bg-amber-100 text-amber-800">Redoublant</Badge>
                  )}
                  {currentSsyl.eps_exemption && (
                    <Badge className="bg-orange-100 text-orange-800">Dispensé EPS</Badge>
                  )}
                </div>
              )}
            </dl>
          </Card>
        ) : (
          <Card className="flex items-center justify-center">
            <p className="text-body-sm text-ink-3">Aucune inscription active.</p>
          </Card>
        )}
      </div>

      {/* Échéancier */}
      {currentSsyl && (
        <Card className="space-y-3">
          <h2 className="font-display text-heading-sm font-semibold text-ink">Échéancier</h2>
          {!installments?.length ? (
            <p className="text-body-sm text-ink-3">
              Aucune échéance configurée pour cette inscription.
            </p>
          ) : (
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full text-body-sm">
                <thead className="bg-slate-50 text-body-xs uppercase text-ink-3">
                  <tr>
                    <th className="px-5 py-2 text-left w-10">#</th>
                    <th className="px-3 py-2 text-left">Libellé</th>
                    <th className="px-3 py-2 text-left">Échéance</th>
                    <th className="px-3 py-2 text-right">Dû</th>
                    <th className="px-3 py-2 text-right">Payé</th>
                    <th className="px-3 py-2 text-right">Reste</th>
                    <th className="px-3 py-2 text-left">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {installments.map((inst, idx) => {
                    const remaining = inst.amount_due - inst.amount_paid;
                    const sc =
                      STATUS_CONFIG[inst.status] ?? {
                        label: inst.status,
                        className: 'bg-slate-100 text-slate-600',
                      };
                    return (
                      <tr key={inst.installment_id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-2.5 text-ink-3">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-medium text-ink">{inst.label}</td>
                        <td className="px-3 py-2.5 text-ink-3">{fmtDate(inst.due_date)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-ink">
                          {XAF.format(inst.amount_due)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-green-700">
                          {XAF.format(inst.amount_paid)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-ink">
                          {XAF.format(remaining)}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-body-xs font-semibold ${sc.className}`}
                          >
                            {sc.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Historique paiements */}
      {currentSsyl && (
        <Card className="space-y-3">
          <h2 className="font-display text-heading-sm font-semibold text-ink">
            Historique paiements
          </h2>
          {!history?.length ? (
            <p className="text-body-sm text-ink-3">Aucun paiement enregistré.</p>
          ) : (
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full text-body-sm">
                <thead className="bg-slate-50 text-body-xs uppercase text-ink-3">
                  <tr>
                    <th className="px-5 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-right">Montant</th>
                    <th className="px-3 py-2 text-left">Méthode</th>
                    <th className="px-3 py-2 text-left">Mémo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {(history as StudentPaymentHistoryRow[]).map((row) => (
                    <tr key={row.tx_id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-2.5 text-ink-3">
                        {fmtDatetime(row.occurred_at)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-ink">
                        {XAF.format(row.amount)} FCFA
                      </td>
                      <td className="px-3 py-2.5 text-ink">
                        {row.source === 'cash'
                          ? 'Espèces'
                          : row.source === 'bank_transfer'
                          ? 'Virement'
                          : row.source === 'internal'
                          ? 'Interne'
                          : row.source ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 text-body-xs text-ink-3">
                        {row.memo ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Payment dialog */}
      {currentSsyl && (
        <RecordPaymentDialog
          ssylId={currentSsyl.id}
          studentName={fullName}
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
}
