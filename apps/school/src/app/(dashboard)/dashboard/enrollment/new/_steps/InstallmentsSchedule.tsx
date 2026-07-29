'use client';

import type { EffectiveInstallment } from '@edukea/shared';

interface Props { installments: EffectiveInstallment[]; }

const XAF = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const DATE = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

export function InstallmentsSchedule({ installments }: Props) {
  const total = installments.reduce((s, i) => s + i.amount, 0);
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="p-2 text-left w-12">#</th>
            <th className="p-2 text-left">Libellé</th>
            <th className="p-2 text-left">Échéance</th>
            <th className="p-2 text-right">Montant</th>
          </tr>
        </thead>
        <tbody>
          {installments.map((i) => (
            <tr key={i.order} className="border-t">
              <td className="p-2">{i.order}</td>
              <td className="p-2">{i.label}</td>
              <td className="p-2 text-slate-600">{i.due_date ? DATE.format(new Date(i.due_date)) : '—'}</td>
              <td className="p-2 text-right font-mono">{XAF.format(i.amount)} XAF</td>
            </tr>
          ))}
          <tr className="border-t bg-slate-50 font-semibold">
            <td colSpan={3} className="p-2 text-right">Total échéances</td>
            <td className="p-2 text-right font-mono">{XAF.format(total)} XAF</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
