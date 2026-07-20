'use client';

import { useEffect } from 'react';
import {
  FormField, Input, Checkbox, SegmentedControl, Select, Textarea, Card,
} from '@edukea/ui';
import { useClassroomFees } from '@edukea/shared';
import type { EnrollmentFormState } from '../_types';

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ');
}

export function StepFeesPayment({
  schoolYearId,
  value,
  onChange,
}: {
  schoolYearId: string | undefined;
  value: EnrollmentFormState;
  onChange: (v: EnrollmentFormState) => void;
}) {
  const { data: fees } = useClassroomFees(value.classroomId, schoolYearId, value.typeStudentId);

  // Auto-remplir billedTotal + feesId quand le barème arrive
  useEffect(() => {
    if (fees?.fees) {
      onChange({
        ...value,
        feesId: fees.fees.id,
        billedTotal: fees.fees.school_fees_net,
        firstPayment: { ...value.firstPayment, amount: value.firstPayment.amount || fees.fees.registration_fees },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fees?.fees?.id]);

  const netAfterDiscount = value.billedTotal - (value.discount?.amount ?? 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Barème */}
      <Card>
        <div className="mb-2 font-display text-heading-sm font-semibold text-ink">Barème de la classe</div>
        {!fees?.fees ? (
          <div className="text-body-sm text-ink-3">Sélectionner une classe à l'étape précédente pour voir le barème.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-body-sm sm:grid-cols-4">
            <div><div className="text-caption text-ink-3">Inscription</div><div className="mt-0.5 font-display font-semibold tabular-nums">{fmt(fees.fees.registration_fees)}</div></div>
            <div><div className="text-caption text-ink-3">Annexes</div><div className="mt-0.5 font-display font-semibold tabular-nums">{fmt(fees.fees.additionnal_fees)}</div></div>
            <div><div className="text-caption text-ink-3">Scolarité</div><div className="mt-0.5 font-display font-semibold tabular-nums">{fmt(fees.fees.school_fees)}</div></div>
            <div><div className="text-caption text-ink-3 font-semibold">Net à payer</div><div className="mt-0.5 font-display text-heading-sm font-semibold tabular-nums text-primary">{fmt(fees.fees.school_fees_net)} FCFA</div></div>
          </div>
        )}
      </Card>

      {/* Remise */}
      <Card>
        <Checkbox
          checked={!!value.discount}
          onChange={(e) =>
            onChange({ ...value, discount: e.target.checked ? { amount: 0, reason: 'sibling', note: '' } : undefined })
          }
          label="Appliquer une remise"
        />
        {value.discount && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Motif" required>
              <Select
                options={[
                  { value: 'sibling', label: 'Fratrie' },
                  { value: 'social', label: 'Sociale' },
                  { value: 'merit', label: 'Mérite' },
                  { value: 'staff', label: 'Personnel école' },
                  { value: 'other', label: 'Autre' },
                ]}
                value={value.discount.reason}
                onChange={(e) => onChange({ ...value, discount: { ...value.discount!, reason: e.target.value } })}
              />
            </FormField>
            <FormField label="Montant (FCFA)" required>
              <Input
                type="text"
                inputMode="numeric"
                value={value.discount.amount ? fmt(value.discount.amount) : ''}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/[\s ]/g, ''));
                  onChange({ ...value, discount: { ...value.discount!, amount: isNaN(n) ? 0 : n } });
                }}
              />
            </FormField>
            <FormField label="Note (optionnel)" className="sm:col-span-2">
              <Textarea
                rows={2}
                value={value.discount.note}
                onChange={(e) => onChange({ ...value, discount: { ...value.discount!, note: e.target.value } })}
              />
            </FormField>
          </div>
        )}
      </Card>

      {/* 1er versement */}
      <Card>
        <Checkbox
          checked={value.firstPaymentEnabled}
          onChange={(e) => onChange({ ...value, firstPaymentEnabled: e.target.checked })}
          label="Enregistrer un premier versement (recommandé)"
          hint="Décocher uniquement pour les cas particuliers (bourse totale, dossier différé)"
        />
        {value.firstPaymentEnabled && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Montant" required>
              <Input
                type="text"
                inputMode="numeric"
                value={value.firstPayment.amount ? fmt(value.firstPayment.amount) : ''}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/[\s ]/g, ''));
                  onChange({ ...value, firstPayment: { ...value.firstPayment, amount: isNaN(n) ? 0 : n } });
                }}
                suffix={<span className="text-body-xs">FCFA</span>}
              />
            </FormField>
            <FormField label="Mode" required>
              <SegmentedControl
                options={[
                  { value: 'cash', label: 'Espèces' },
                  { value: 'bank_transfer', label: 'Virement' },
                  { value: 'internal', label: 'Autre' },
                ]}
                value={value.firstPayment.source}
                onChange={(v) => onChange({ ...value, firstPayment: { ...value.firstPayment, source: v as 'cash' | 'bank_transfer' | 'internal' } })}
              />
            </FormField>
            <FormField label="Note (ex : Reçu 001/2026)" className="sm:col-span-2">
              <Input
                value={value.firstPayment.memo}
                onChange={(e) => onChange({ ...value, firstPayment: { ...value.firstPayment, memo: e.target.value } })}
              />
            </FormField>
          </div>
        )}
      </Card>

      {/* Total récapitulatif */}
      <div className="rounded-md border-2 border-primary/20 bg-primary/[0.03] p-4">
        <div className="flex items-baseline justify-between">
          <div className="text-body-sm font-semibold text-ink">Net à payer après remise</div>
          <div className="font-display text-heading-lg font-semibold tabular-nums text-primary">
            {fmt(netAfterDiscount)} <span className="text-body-sm">FCFA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
