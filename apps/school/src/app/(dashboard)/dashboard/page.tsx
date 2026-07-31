'use client';

import {
  useSchoolContext,
  useCurrentUserRole,
  useSchoolKpis,
  useRecentEnrollments,
  useRecentPayments,
  type RecentEnrollmentRow,
  type RecentPaymentRow,
} from '@edukea/shared';
import {
  Card,
  Skeleton,
} from '@edukea/ui';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Users, UserPlus, Wallet, AlertTriangle } from 'lucide-react';

const XAF = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const DATETIME = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

// ---------------------------------------------------------------------------
// Page root
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const { data: ctx } = useSchoolContext({
    requestedSchoolId: searchParams.get('school'),
    requestedYearId: searchParams.get('year'),
  });
  const { data: userRole, isLoading: roleLoading } = useCurrentUserRole();

  const schoolId = ctx?.current_school?.id;
  const schoolYearId = ctx?.current_year?.id;

  if (roleLoading || !userRole) {
    return (
      <div className="p-6">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const role = userRole.role;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">Cockpit</h1>
        <p className="text-sm text-slate-600">
          {ctx?.current_school?.name ?? '—'} · Année {ctx?.current_year?.name ?? '—'}
          <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
            {role}
          </span>
        </p>
      </div>

      {/* Contenu selon rôle */}
      {['superadmin', 'manager', 'director', 'censor'].includes(role) && (
        <StaffDashboard schoolId={schoolId} schoolYearId={schoolYearId} role={role} />
      )}
      {role === 'teacher' && <TeacherDashboardPlaceholder />}
      {role === 'unknown' && <UnknownRoleView />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Staff dashboard (superadmin / manager / director / censor)
// ---------------------------------------------------------------------------

function StaffDashboard({
  schoolId,
  schoolYearId,
  role,
}: {
  schoolId: string | undefined;
  schoolYearId: string | undefined;
  role: string;
}) {
  const { data: kpis, isLoading: kpisLoading } = useSchoolKpis(schoolId, schoolYearId);
  const { data: recentEnroll } = useRecentEnrollments(schoolId, schoolYearId, 5);
  const { data: recentPay } = useRecentPayments(schoolId, 5, schoolYearId);

  if (kpisLoading || !kpis) {
    return <Skeleton className="h-96 w-full" />;
  }

  const rate =
    kpis.billed_total > 0
      ? Math.round((kpis.collected_total / kpis.billed_total) * 100)
      : 0;

  // Censor voit uniquement les KPI financiers (même chose en V1, différencier plus tard)
  void role;

  return (
    <>
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Users}
          label="Élèves inscrits"
          value={kpis.total_students.toString()}
          color="text-blue-600"
        />
        <KpiCard
          icon={UserPlus}
          label="Nouvelles inscriptions (mois)"
          value={kpis.new_enrollments.toString()}
          color="text-green-600"
        />
        <KpiCard
          icon={Wallet}
          label="Encaissé"
          value={`${XAF.format(kpis.collected_total)} XAF`}
          sub={`${rate}% du dû`}
          color="text-orange-600"
        />
        <KpiCard
          icon={AlertTriangle}
          label="En retard"
          value={`${XAF.format(kpis.overdue_total)} XAF`}
          color="text-red-600"
        />
      </div>

      {/* Listes récentes */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inscriptions récentes */}
        <Card className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Inscriptions récentes</h2>
            <Link
              href="/dashboard/enrollment"
              className="text-xs text-orange-600 hover:underline"
            >
              Voir tout →
            </Link>
          </div>
          <div className="space-y-2">
            {(recentEnroll ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">Aucune inscription récente.</p>
            ) : (
              (recentEnroll ?? []).map((e: RecentEnrollmentRow) => (
                <div
                  key={e.ssyl_id}
                  className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{e.student_name ?? '—'}</p>
                    <p className="text-xs text-slate-500">{e.classroom_name ?? '—'}</p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {e.created_at ? DATETIME.format(new Date(e.created_at)) : '—'}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Paiements récents */}
        <Card className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Paiements récents</h2>
            <Link
              href="/dashboard/recovery"
              className="text-xs text-orange-600 hover:underline"
            >
              Voir tout →
            </Link>
          </div>
          <div className="space-y-2">
            {(recentPay ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">Aucun paiement récent.</p>
            ) : (
              (recentPay ?? []).map((p: RecentPaymentRow) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{p.student_name ?? '—'}</p>
                    <p className="text-xs text-slate-500">{p.source ?? '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold">{XAF.format(p.amount ?? 0)} XAF</p>
                    <p className="text-xs text-slate-400">
                      {p.occurred_at ? DATETIME.format(new Date(p.occurred_at)) : '—'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <Card className="space-y-2 p-5">
      <div className="flex items-center gap-2 text-xs uppercase text-slate-500">
        <Icon className={`h-4 w-4 ${color}`} />
        {label}
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </Card>
  );
}

function TeacherDashboardPlaceholder() {
  return (
    <Card className="p-6 text-center">
      <p className="text-sm text-slate-600">
        Espace enseignant en cours de développement (S3D.3 + S3D.4).
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Vous pourrez bientôt consulter vos classes, saisir des notes et gérer vos bulletins.
      </p>
    </Card>
  );
}

function UnknownRoleView() {
  return (
    <Card className="p-6 text-center">
      <p className="text-sm text-slate-600">
        Votre profil n&apos;est pas encore associé à un rôle dans cette école.
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Contactez l&apos;administrateur de votre établissement.
      </p>
    </Card>
  );
}
