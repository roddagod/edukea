'use client';

import { Card, StatusPill } from '@edukea/ui';
import type { EnrollmentFormState } from '../_types';

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ');
}

export function StepSummary({ value }: { value: EnrollmentFormState }) {
  const net = value.billedTotal - (value.discount?.amount ?? 0);
  const paidNow = value.firstPaymentEnabled ? value.firstPayment.amount : 0;
  const remaining = net - paidNow;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="mb-3 font-display text-heading-sm font-semibold text-ink">Identité</div>
        <div className="grid grid-cols-2 gap-3 text-body-sm">
          <div><div className="text-caption text-ink-3">Nom complet</div><div className="mt-0.5 font-semibold">{value.student.lastname} {value.student.firstname}</div></div>
          <div><div className="text-caption text-ink-3">Sexe</div><div className="mt-0.5">{value.student.sex === 'M' ? 'Masculin' : 'Féminin'}</div></div>
          <div><div className="text-caption text-ink-3">Date de naissance</div><div className="mt-0.5">{value.student.birthdate}</div></div>
          <div><div className="text-caption text-ink-3">Nationalité</div><div className="mt-0.5">{value.student.nationality}</div></div>
        </div>
      </Card>

      <Card>
        <div className="mb-3 font-display text-heading-sm font-semibold text-ink">Famille</div>
        <div className="flex flex-wrap gap-2 text-body-sm">
          {value.father?.phone && <span className="rounded-md bg-line-soft px-2 py-1"><span className="font-semibold">Père</span> · {value.father.lastname} {value.father.firstname} · {value.father.phone}</span>}
          {value.mother?.phone && <span className="rounded-md bg-line-soft px-2 py-1"><span className="font-semibold">Mère</span> · {value.mother.lastname} {value.mother.firstname} · {value.mother.phone}</span>}
          {value.tutor?.phone  && <span className="rounded-md bg-line-soft px-2 py-1"><span className="font-semibold">Tuteur</span> · {value.tutor.lastname} {value.tutor.firstname} · {value.tutor.phone}</span>}
        </div>
      </Card>

      <Card>
        <div className="mb-3 font-display text-heading-sm font-semibold text-ink">Récapitulatif financier</div>
        <div className="flex flex-col gap-2 text-body-sm">
          <div className="flex justify-between"><span className="text-ink-3">Facturé</span><span className="font-display font-semibold tabular-nums">{fmt(value.billedTotal)} FCFA</span></div>
          {value.discount && (
            <div className="flex justify-between text-[#B45309]"><span>Remise ({value.discount.reason})</span><span className="font-display font-semibold tabular-nums">−{fmt(value.discount.amount)} FCFA</span></div>
          )}
          <div className="flex justify-between border-t border-line pt-2"><span className="font-semibold">Net à payer</span><span className="font-display font-semibold tabular-nums">{fmt(net)} FCFA</span></div>
          {value.firstPaymentEnabled && (
            <div className="flex justify-between text-[#059669]"><span>Versement aujourd'hui</span><span className="font-display font-semibold tabular-nums">−{fmt(paidNow)} FCFA</span></div>
          )}
          <div className="flex items-center justify-between border-t border-line pt-2">
            <span className="font-semibold">Reste à payer</span>
            <div className="flex items-center gap-2">
              <StatusPill status={remaining <= 0 ? 'solde' : (paidNow > 0 ? 'debute' : 'impaye')} />
              <span className="font-display text-heading-sm font-semibold tabular-nums text-ink">{fmt(Math.max(0, remaining))} FCFA</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
