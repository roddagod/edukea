'use client';

import { formatMoney } from '@edukea/shared';
import type { EffectiveFee, Currency } from '@edukea/shared';

const CATEGORY_LABELS: Record<string, string> = {
  inscription: 'Inscription',
  tuition:     'Scolarité',
  insurance:   'Assurance',
  canteen:     'Cantine',
  transport:   'Transport',
  other:       'Autre',
};

interface Props { fees: EffectiveFee[]; currency: Currency; }

export function FeesLinesTable({ fees, currency }: Props) {
  const mandatoryTotal = fees
    .filter((f) => !['canteen', 'transport'].includes(f.category))
    .reduce((s, f) => s + f.amount, 0);
  const totalAll = fees.reduce((s, f) => s + f.amount, 0);

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="p-2 text-left">Libellé</th>
            <th className="p-2 text-left">Catégorie</th>
            <th className="p-2 text-right">Montant</th>
          </tr>
        </thead>
        <tbody>
          {fees.map((f, i) => (
            <tr key={`${f.label}-${i}`} className="border-t">
              <td className="p-2">{f.label}</td>
              <td className="p-2 text-xs text-slate-500">{CATEGORY_LABELS[f.category] ?? f.category}</td>
              <td className="p-2 text-right font-mono">{formatMoney(f.amount, currency)}</td>
            </tr>
          ))}
          <tr className="border-t bg-slate-50 font-semibold">
            <td colSpan={2} className="p-2 text-right">Total obligatoire</td>
            <td className="p-2 text-right font-mono">{formatMoney(mandatoryTotal, currency)}</td>
          </tr>
          {totalAll !== mandatoryTotal && (
            <tr className="bg-slate-50 text-slate-600">
              <td colSpan={2} className="p-2 text-right">Total avec options</td>
              <td className="p-2 text-right font-mono">{formatMoney(totalAll, currency)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
