'use client';

import type { EffectiveFee } from '@edukea/shared';

interface Props { fees: EffectiveFee[]; }

const XAF = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function FeesLinesTable({ fees }: Props) {
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
              <td className="p-2 text-xs text-slate-500">{f.category}</td>
              <td className="p-2 text-right font-mono">{XAF.format(f.amount)} XAF</td>
            </tr>
          ))}
          <tr className="border-t bg-slate-50 font-semibold">
            <td colSpan={2} className="p-2 text-right">Total obligatoire</td>
            <td className="p-2 text-right font-mono">{XAF.format(mandatoryTotal)} XAF</td>
          </tr>
          {totalAll !== mandatoryTotal && (
            <tr className="bg-slate-50 text-slate-600">
              <td colSpan={2} className="p-2 text-right">Total avec options</td>
              <td className="p-2 text-right font-mono">{XAF.format(totalAll)} XAF</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
