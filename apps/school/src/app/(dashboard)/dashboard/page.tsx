'use client';

import { Coins, Smartphone, Landmark } from 'lucide-react';
import {
  PageHeader,
  RefreshButton,
  HeroKPI,
  KPIStat,
  Sparkline,
  ProgressRing,
  Card,
  CardHeader,
  CardTitle,
  CardSub,
  TxTable,
  type TxRowData,
} from '@edukea/ui';
import { useSearchParams } from 'next/navigation';
import {
  useSchoolContext,
  useSchoolTreasury,
  useSchoolRecovery,
  useRecentPayments,
} from '@edukea/shared';

// Sparkline placeholder — a remplacer par une agregat quotidien (sprint 3)
const PLACEHOLDER_SPARK = [12, 20, 15, 32, 28, 45, 38, 55, 50, 62, 58, 70, 75, 68, 82];

function formatTime(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}h${d.getMinutes().toString().padStart(2, '0')}`;
}

function fmtNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ');
}

export default function CockpitPage() {
  const searchParams = useSearchParams();
  const { data: ctx, refetch: refetchCtx } = useSchoolContext({
    requestedSchoolId: searchParams.get('school'),
    requestedYearId: searchParams.get('year'),
  });
  const schoolId = ctx?.current_school?.id;
  const schoolYearId = ctx?.current_year?.id;

  const { data: treasury, refetch: refetchTreasury } = useSchoolTreasury(schoolId);
  const { data: recovery, refetch: refetchRecovery } = useSchoolRecovery(schoolId, schoolYearId);
  const { data: recentPayments, refetch: refetchRecent } = useRecentPayments(schoolId, 8);

  const handleRefresh = async () => {
    await Promise.all([refetchCtx(), refetchTreasury(), refetchRecovery(), refetchRecent()]);
  };

  const total = Number(treasury?.total_treasury ?? 0);
  const cash = Number(treasury?.cash_balance ?? 0);
  const momo = Number(treasury?.momo_pending_balance ?? 0) + Number(treasury?.momo_settled_balance ?? 0);
  const bank = Number(treasury?.bank_balance ?? 0);

  const rows: TxRowData[] = (recentPayments ?? []).map((p) => ({
    id: p.id,
    studentName: p.student_name,
    studentSub: [p.matricule ? `Matr. ${p.matricule}` : null, p.source ? p.source : null]
      .filter(Boolean)
      .join(' · '),
    className: p.class_name || '—',
    status: p.status,
    amount: p.amount,
  }));

  return (
    <>
      <PageHeader
        title="Cockpit tresorerie"
        sub={ctx?.current_school?.name ? `${ctx.current_school.name} · mise a jour a ${formatTime()}` : `Mise a jour a ${formatTime()}`}
        actions={<RefreshButton onClick={handleRefresh} />}
      />

      <HeroKPI
        amount={total}
        label="Tresorerie"
        metrics={[
          <span key="collected">
            <span className="font-display font-semibold text-white">{fmtNumber(Number(recovery?.collected_total ?? 0))} FCFA</span>{' '}
            encaisses cette annee
          </span>,
          <span key="count">
            <span className="font-display font-semibold text-white">{recentPayments?.length ?? 0}</span> versements recents
          </span>,
          recovery ? (
            <span key="pct">
              <span className="font-display font-bold text-[#86EFAC]">△</span>{' '}
              <span className="font-display font-semibold text-white">
                {Number(recovery.recovery_pct).toString().replace('.', ',')}%
              </span>{' '}
              recouvre
            </span>
          ) : null,
        ]}
        spark={<Sparkline values={PLACEHOLDER_SPARK} />}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KPIStat
          label="Caisse"
          amount={cash}
          icon={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#ECFDF5] text-[#059669]">
              <Coins className="h-4 w-4" />
            </div>
          }
          footLeft="Especes recues"
        />
        <KPIStat
          label="Mobile Money"
          amount={momo}
          icon={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-accent-soft text-[#B45309]">
              <Smartphone className="h-4 w-4" />
            </div>
          }
          footLeft={
            treasury && Number(treasury.momo_pending_balance) > 0 ? (
              <>
                <span className="font-semibold text-[#B45309]">
                  {fmtNumber(Number(treasury.momo_pending_balance))} FCFA
                </span>{' '}
                en attente d'apurement
              </>
            ) : (
              'Apure'
            )
          }
        />
        <KPIStat
          label="Banque"
          amount={bank}
          icon={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#EEF2FA] text-primary">
              <Landmark className="h-4 w-4" />
            </div>
          }
          footLeft="Virements bancaires"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recouvrement annuel</CardTitle>
              <CardSub>{ctx?.current_year?.name ? `Annee scolaire ${ctx.current_year.name}` : '—'}</CardSub>
            </div>
          </CardHeader>
          <div className="flex justify-center">
            <ProgressRing
              value={Number(recovery?.recovery_pct ?? 0)}
              centerLabel={recovery ? `${Number(recovery.recovery_pct).toString().replace('.', ',')}%` : '—'}
              centerSub="recouvre"
              size={180}
            />
          </div>
          <div className="mt-2.5 flex justify-around border-t border-dashed border-line pt-2.5">
            {[
              { color: '#22C55E', val: recovery?.solde_count ?? 0, label: 'soldes' },
              { color: '#F69F13', val: recovery?.debute_count ?? 0, label: 'partiel' },
              { color: '#EF4444', val: recovery?.impaye_count ?? 0, label: 'impayes' },
            ].map((leg) => (
              <div key={leg.label} className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: leg.color }} />
                  <span className="font-display text-heading-sm font-semibold">{fmtNumber(leg.val)}</span>
                </div>
                <div className="mt-0.5 text-caption font-medium text-ink-3">{leg.label}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-0">
          <div className="flex items-center justify-between px-5 pt-4">
            <div>
              <CardTitle>Derniers versements</CardTitle>
              <CardSub>{rows.length} operations</CardSub>
            </div>
            <RefreshButton size="sm" label="Voir tout →" />
          </div>
          <div className="mt-3.5">
            {rows.length === 0 ? (
              <div className="px-5 pb-5 text-body-sm text-ink-3">Aucun versement recent.</div>
            ) : (
              <TxTable rows={rows} />
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
