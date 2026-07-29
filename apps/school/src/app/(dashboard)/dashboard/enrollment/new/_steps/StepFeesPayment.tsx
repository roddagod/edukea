'use client';

import { useEffect } from 'react';
import {
  FormField, Input, Checkbox, SegmentedControl, Select, Textarea, Card, Skeleton,
} from '@edukea/ui';
import { useClassroomEffectiveFees, useClassroomEffectiveInstallments } from '@edukea/shared';
import { FeesLinesTable } from './FeesLinesTable';
import { InstallmentsSchedule } from './InstallmentsSchedule';
import { PaymentAllocationPreview } from './PaymentAllocationPreview';
import type { EnrollmentFormState } from '../_types';

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ');
}

export function StepFeesPayment({
  value,
  onChange,
}: {
  schoolYearId: string | undefined;
  value: EnrollmentFormState;
  onChange: (v: EnrollmentFormState) => void;
}) {
  const { data: fees, isLoading: fL } = useClassroomEffectiveFees(
    value.classroomId || undefined,
    value.typeStudentId || undefined,
  );
  const { data: installments, isLoading: iL } = useClassroomEffectiveInstallments(
    value.classroomId || undefined,
    value.typeStudentId || undefined,
  );

  // Auto-remplir billedTotal depuis les frais effectifs
  useEffect(() => {
    if (fees && fees.length > 0) {
      const mandatoryTotal = fees
        .filter((f) => !['canteen', 'transport'].includes(f.category))
        .reduce((s, f) => s + f.amount, 0);
      onChange({
        ...value,
        billedTotal: mandatoryTotal,
        firstPayment: {
          ...value.firstPayment,
          amount: value.firstPayment.amount || (installments?.[0]?.amount ?? 0),
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fees, installments]);

  const netAfterDiscount = value.billedTotal - (value.discount?.amount ?? 0);

  if (fL || iL) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!value.classroomId || !value.typeStudentId) {
    return (
      <Card>
        <div className="text-body-sm text-ink-3">
          Sélectionner une classe et un type d'élève aux étapes précédentes pour voir les frais.
        </div>
      </Card>
    );
  }

  if (!fees?.length) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-medium">Aucun frais configuré pour cette combinaison classe × type d'élève.</p>
        <p className="mt-1">
          Retournez à l'étape "Choix classe" ou configurez les frais dans{' '}
          <span className="font-semibold">/pédagogie/frais</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Tableau des lignes de frais */}
      <Card>
        <div className="mb-2 font-display text-heading-sm font-semibold text-ink">
          Frais scolarité
        </div>
        <FeesLinesTable fees={fees} />
      </Card>

      {/* Calendrier des échéances */}
      {(installments?.length ?? 0) > 0 && (
        <Card>
          <div className="mb-2 font-display text-heading-sm font-semibold text-ink">
            Calendrier de paiement
          </div>
          <InstallmentsSchedule installments={installments ?? []} />
        </Card>
      )}

      {/* Remise */}
      <Card>
        <Checkbox
          checked={!!value.discount}
          onChange={(e) =>
            onChange({
              ...value,
              discount: e.target.checked ? { amount: 0, reason: 'sibling', note: '' } : undefined,
            })
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
                onChange={(e) =>
                  onChange({ ...value, discount: { ...value.discount!, reason: e.target.value } })
                }
              />
            </FormField>
            <FormField label="Montant (FCFA)" required>
              <Input
                type="text"
                inputMode="numeric"
                value={value.discount.amount ? fmt(value.discount.amount) : ''}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/[\s ]/g, ''));
                  onChange({ ...value, discount: { ...value.discount!, amount: isNaN(n) ? 0 : n } });
                }}
              />
            </FormField>
            <FormField label="Note (optionnel)" className="sm:col-span-2">
              <Textarea
                rows={2}
                value={value.discount.note}
                onChange={(e) =>
                  onChange({ ...value, discount: { ...value.discount!, note: e.target.value } })
                }
              />
            </FormField>
          </div>
        )}
      </Card>

      {/* Premier versement */}
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
                  const n = Number(e.target.value.replace(/[\s ]/g, ''));
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
                onChange={(v) =>
                  onChange({
                    ...value,
                    firstPayment: { ...value.firstPayment, source: v as 'cash' | 'bank_transfer' | 'internal' },
                  })
                }
              />
            </FormField>
            <FormField label="Note (ex : Reçu 001/2026)" className="sm:col-span-2">
              <Input
                value={value.firstPayment.memo}
                onChange={(e) =>
                  onChange({ ...value, firstPayment: { ...value.firstPayment, memo: e.target.value } })
                }
              />
            </FormField>
          </div>
        )}
        {value.firstPaymentEnabled && value.firstPayment.amount > 0 && (
          <div className="mt-4">
            <PaymentAllocationPreview
              installments={installments ?? []}
              paymentAmount={value.firstPayment.amount}
            />
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
