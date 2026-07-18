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

// TODO(sprint 2): brancher sur useSchoolTreasury / v_school_treasury via @edukea/shared
const FAKE_TREASURY = {
  total: 1_240_500,
  cash: 380_000,
  momo: 625_500,
  bank: 235_000,
  todayCollected: 82_500,
  deltaPct: 7.1,
  todayCount: 24,
  sparkValues: [12, 20, 15, 32, 28, 45, 38, 55, 50, 62, 58, 70, 75, 68, 82],
};

const FAKE_RECOVERY = { pct: 71, solde: 1249, debute: 312, impaye: 12 };

const FAKE_TXS: TxRowData[] = [
  { id: '132',   studentName: 'SORE Chakira Mounia', studentSub: 'Matr. 0000000132 · MoMo', className: 'CM2 A', status: 'debute', amount: 50000 },
  { id: '222',   studentName: 'TRAORE Bintou Rahman', studentSub: 'Matr. 0000222333 · Especes', className: 'CM2 A', status: 'solde',  amount: 225000 },
  { id: '20003', studentName: 'ASSIN Agoua Yvette',   studentSub: 'Matr. 000100020003 · Especes', className: 'MMS',   status: 'debute', amount: 30000 },
  { id: '0001',  studentName: 'MANGLE Botty Exaucee', studentSub: 'Matr. 0001 · MoMo',           className: 'CE1 A', status: 'impaye', amount: null },
];

export default function CockpitPage() {
  return (
    <>
      <PageHeader
        title="Cockpit tresorerie"
        sub="Mise a jour a 10h24"
        actions={<RefreshButton onClick={() => location.reload()} />}
      />

      <HeroKPI
        amount={FAKE_TREASURY.total}
        label="Tresorerie"
        metrics={[
          <span key="a"><span className="font-display font-semibold text-white">+{FAKE_TREASURY.todayCollected.toLocaleString('fr-FR')} FCFA</span> encaisses depuis ce matin</span>,
          <span key="b"><span className="font-display font-semibold text-white">{FAKE_TREASURY.todayCount}</span> versements</span>,
          <span key="c"><span className="font-display font-bold text-[#86EFAC]">△</span> <span className="font-display font-semibold text-white">{FAKE_TREASURY.deltaPct.toString().replace('.', ',')}%</span> vs hier</span>,
        ]}
        spark={<Sparkline values={FAKE_TREASURY.sparkValues} />}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KPIStat
          label="Caisse"
          amount={FAKE_TREASURY.cash}
          icon={<div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#ECFDF5] text-[#059669]"><Coins className="h-4 w-4" /></div>}
          footLeft="12 versements aujourd'hui"
          footRight={62000}
        />
        <KPIStat
          label="Mobile Money"
          amount={FAKE_TREASURY.momo}
          icon={<div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-accent-soft text-[#B45309]"><Smartphone className="h-4 w-4" /></div>}
          footLeft={<><span className="text-[#B45309] font-semibold">3</span> en attente d'apurement</>}
          footRight={18500}
        />
        <KPIStat
          label="Banque"
          amount={FAKE_TREASURY.bank}
          icon={<div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#EEF2FA] text-primary"><Landmark className="h-4 w-4" /></div>}
          footLeft="Virement recu a 08h12"
          footRight={2000}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recouvrement annuel</CardTitle>
              <CardSub>Annee scolaire 2025-2026</CardSub>
            </div>
          </CardHeader>
          <div className="flex justify-center">
            <ProgressRing
              value={FAKE_RECOVERY.pct}
              centerLabel={`${FAKE_RECOVERY.pct}%`}
              centerSub="recouvre"
              size={180}
            />
          </div>
          <div className="mt-2.5 flex justify-around border-t border-dashed border-line pt-2.5">
            {[
              { color: '#22C55E', val: FAKE_RECOVERY.solde,  label: 'soldes' },
              { color: '#F69F13', val: FAKE_RECOVERY.debute, label: 'partiel' },
              { color: '#EF4444', val: FAKE_RECOVERY.impaye, label: 'impayes' },
            ].map((leg) => (
              <div key={leg.label} className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: leg.color }} />
                  <span className="font-display text-heading-sm font-semibold">
                    {leg.val.toLocaleString('fr-FR')}
                  </span>
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
              <CardSub>Aujourd'hui · {FAKE_TXS.length} operations</CardSub>
            </div>
            <RefreshButton size="sm" label="Voir tout →" />
          </div>
          <div className="mt-3.5">
            <TxTable rows={FAKE_TXS} />
          </div>
        </Card>
      </div>
    </>
  );
}
