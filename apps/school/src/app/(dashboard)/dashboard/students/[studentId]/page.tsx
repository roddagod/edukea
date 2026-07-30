'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useStudentWithCurrentEnrollment,
  useSsylInstallmentStatus,
  useStudentPaymentHistory,
} from '@edukea/shared';
import { supabase } from '@edukea/shared';
import { PageHeader, Card, Skeleton, Button, Badge } from '@edukea/ui';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Download,
  User,
  Wallet,
  Clock,
  GraduationCap,
} from 'lucide-react';
import { RecordPaymentDialog } from '@/components/RecordPaymentDialog';
import { EditStudentDialog } from './_components/EditStudentDialog';
import type { StudentPaymentHistoryRow } from '@edukea/shared';

// ─── Formatters ─────────────────────────────────────────────────────────────

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

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  paid:    { label: 'Soldé',      className: 'bg-green-100 text-green-700' },
  partial: { label: 'Partiel',    className: 'bg-amber-100 text-amber-700' },
  due:     { label: 'À échéance', className: 'bg-orange-100 text-orange-700' },
  overdue: { label: 'En retard',  className: 'bg-red-100 text-red-700' },
  future:  { label: 'Futur',      className: 'bg-slate-100 text-slate-600' },
};

type TabId = 'overview' | 'fees' | 'history' | 'grades';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: User },
  { id: 'fees',     label: 'Frais & paiements', icon: Wallet },
  { id: 'history',  label: 'Historique scolaire', icon: Clock },
  { id: 'grades',   label: 'Notes & bulletins', icon: GraduationCap },
];

// ─── Enrollment history row type ─────────────────────────────────────────────

interface EnrollmentHistoryRow {
  id: string;
  school_year_name: string;
  classroom_name: string;
  level_name: string;
  cycle_name: string;
  is_redoublant: boolean;
  created_at: string;
}

function useStudentEnrollmentHistory(studentId: string | undefined) {
  return useQuery<EnrollmentHistoryRow[]>({
    queryKey: ['student-enrollment-history', studentId],
    enabled: !!studentId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_school_year_loggings')
        .select(`
          id, is_redoublant, created_at,
          school_year:school_years(name),
          classroom:classrooms(name, level:levels(name, cycle:cycles(name)))
        `)
        .eq('student_id', studentId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ((data as unknown[]) ?? []).map((row: unknown) => {
        const r = row as {
          id: string;
          is_redoublant: boolean;
          created_at: string;
          school_year: { name?: string } | null;
          classroom: { name?: string; level?: { name?: string; cycle?: { name?: string } } } | null;
        };
        return {
          id: r.id,
          school_year_name: r.school_year?.name ?? '—',
          classroom_name: r.classroom?.name ?? '—',
          level_name: r.classroom?.level?.name ?? '—',
          cycle_name: r.classroom?.level?.cycle?.name ?? '—',
          is_redoublant: !!r.is_redoublant,
          created_at: r.created_at,
        };
      });
    },
  });
}

// ─── Tab: Vue d'ensemble ─────────────────────────────────────────────────────

function OverviewTab({ data }: { data: NonNullable<ReturnType<typeof useStudentWithCurrentEnrollment>['data']> }) {
  const { student, currentSsyl } = data;
  return (
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
            <dd className="mt-0.5 font-medium text-ink">{fmtDate(student.date_of_birth)}</dd>
          </div>
          <div>
            <dt className="text-body-xs text-ink-3">Lieu de naissance</dt>
            <dd className="mt-0.5 font-medium text-ink">{student.place_of_birth ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-body-xs text-ink-3">Nationalité</dt>
            <dd className="mt-0.5 font-medium text-ink">{student.nationality ?? '—'}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-body-xs text-ink-3">N° extrait de naissance</dt>
            <dd className="mt-0.5 font-mono text-xs text-ink">
              {student.birth_certificate_number ?? '—'}
            </dd>
          </div>
          {student.email && (
            <div className="col-span-2">
              <dt className="text-body-xs text-ink-3">Email</dt>
              <dd className="mt-0.5 text-xs text-ink">{student.email}</dd>
            </div>
          )}
          {student.student_type_label && (
            <div className="col-span-2">
              <dt className="text-body-xs text-ink-3">Type d'élève</dt>
              <dd className="mt-0.5">
                <Badge className="bg-blue-100 text-blue-800">{student.student_type_label}</Badge>
              </dd>
            </div>
          )}
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
                <dd className="mt-0.5 font-medium text-ink">{currentSsyl.lv2_subject_name}</dd>
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
          <p className="text-body-sm text-ink-3">Aucune inscription active cette année.</p>
        </Card>
      )}
    </div>
  );
}

// ─── Tab: Frais & paiements ───────────────────────────────────────────────────

function FeesTab({
  currentSsylId,
  onNewPayment,
}: {
  currentSsylId: string | null | undefined;
  onNewPayment: () => void;
}) {
  const { data: installments } = useSsylInstallmentStatus(currentSsylId ?? undefined);
  const { data: history } = useStudentPaymentHistory(currentSsylId ?? undefined, 20);

  if (!currentSsylId) {
    return (
      <Card className="flex items-center justify-center py-10">
        <p className="text-body-sm text-ink-3">Aucune inscription active — pas de frais à afficher.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Echéancier */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-heading-sm font-semibold text-ink">Échéancier</h2>
          <button
            onClick={onNewPayment}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#E97423] px-3.5 py-2 text-body-sm font-semibold text-white transition-colors hover:bg-[#c9621d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E97423] focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" /> Nouveau versement
          </button>
        </div>
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

      {/* Historique paiements */}
      <Card className="space-y-3">
        <h2 className="font-display text-heading-sm font-semibold text-ink">
          Historique des versements
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
                  <th className="px-3 py-2 text-right">Reçu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(history as StudentPaymentHistoryRow[]).map((row) => (
                  <tr key={row.tx_id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-2.5 text-ink-3">{fmtDatetime(row.occurred_at)}</td>
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
                    <td className="px-3 py-2.5 text-body-xs text-ink-3">{row.memo ?? '—'}</td>
                    <td className="px-3 py-2.5 text-right">
                      {row.tx_id && (
                        <a
                          href={`/api/receipts/${row.tx_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                        >
                          <Download className="h-3 w-3" />
                          PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Tab: Historique scolaire ─────────────────────────────────────────────────

function SchoolHistoryTab({ studentId }: { studentId: string }) {
  const { data: enrollments, isLoading } = useStudentEnrollmentHistory(studentId);

  if (isLoading) {
    return (
      <Card className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <h2 className="font-display text-heading-sm font-semibold text-ink">
        Historique scolaire
      </h2>
      {!enrollments?.length ? (
        <p className="text-body-sm text-ink-3">Aucune inscription trouvée.</p>
      ) : (
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead className="bg-slate-50 text-body-xs uppercase text-ink-3">
              <tr>
                <th className="px-5 py-2 text-left">Année scolaire</th>
                <th className="px-3 py-2 text-left">Cycle</th>
                <th className="px-3 py-2 text-left">Niveau</th>
                <th className="px-3 py-2 text-left">Classe</th>
                <th className="px-3 py-2 text-left">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {enrollments.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-2.5 font-medium text-ink">{row.school_year_name}</td>
                  <td className="px-3 py-2.5 text-ink-3">{row.cycle_name}</td>
                  <td className="px-3 py-2.5 text-ink-3">{row.level_name}</td>
                  <td className="px-3 py-2.5 text-ink">{row.classroom_name}</td>
                  <td className="px-3 py-2.5">
                    {row.is_redoublant ? (
                      <Badge className="bg-amber-100 text-amber-800">Redoublant</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700">Normal</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ─── Tab: Notes & bulletins (placeholder) ────────────────────────────────────

function GradesTab() {
  return (
    <Card className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <GraduationCap className="h-10 w-10 text-ink-4" />
      <h2 className="font-display text-heading-sm font-semibold text-ink">Notes & bulletins</h2>
      <p className="max-w-sm text-body-sm text-ink-3">
        Cette fonctionnalité sera disponible prochainement (S3D.4 / S3D.6).
      </p>
    </Card>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function StudentPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const [showPayment, setShowPayment] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const { data, isLoading } = useStudentWithCurrentEnrollment(studentId);

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
      <Link
        href="/dashboard/students"
        className="inline-flex items-center gap-1 text-body-sm text-ink-3 hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Retour à la liste
      </Link>

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
              <Badge className="bg-blue-100 text-blue-800">{student.student_type_label}</Badge>
            )}
          </div>
        }
        actions={
          <div className="flex gap-2">
            {currentSsyl && (
              <button
                onClick={() => setShowPayment(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#E97423] px-3.5 py-2 text-body-sm font-semibold text-white transition-colors hover:bg-[#c9621d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E97423] focus-visible:ring-offset-2"
              >
                <Plus className="h-4 w-4" /> Nouveau versement
              </button>
            )}
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Editer
            </Button>
          </div>
        }
      />

      {/* Tab bar */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Onglets">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                  active
                    ? 'border-[#E97423] text-[#E97423]'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'overview' && <OverviewTab data={data} />}
        {activeTab === 'fees' && (
          <FeesTab
            currentSsylId={currentSsyl?.id}
            onNewPayment={() => setShowPayment(true)}
          />
        )}
        {activeTab === 'history' && <SchoolHistoryTab studentId={studentId} />}
        {activeTab === 'grades' && <GradesTab />}
      </div>

      {/* Payment dialog */}
      {currentSsyl && (
        <RecordPaymentDialog
          ssylId={currentSsyl.id}
          studentName={fullName}
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
        />
      )}

      {/* Edit student dialog */}
      <EditStudentDialog
        student={data.student}
        currentSsyl={
          data.currentSsyl
            ? {
                id: data.currentSsyl.id,
                classroom_id: data.currentSsyl.classroom_id,
                is_redoublant: data.currentSsyl.is_redoublant,
                lv2_subject_id: data.currentSsyl.lv2_subject_id,
                mat_secondaire_subject_id:
                  data.currentSsyl.mat_secondaire_subject_id,
                eps_exemption: data.currentSsyl.eps_exemption,
              }
            : null
        }
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </div>
  );
}
