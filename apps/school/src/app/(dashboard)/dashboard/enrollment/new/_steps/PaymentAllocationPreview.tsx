'use client';

import type { EffectiveInstallment } from '@edukea/shared';

interface Props {
  installments: EffectiveInstallment[];
  paymentAmount: number;
}

const XAF = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function PaymentAllocationPreview({ installments, paymentAmount }: Props) {
  if (paymentAmount <= 0) return null;

  const sorted = [...installments].sort((a, b) => a.due_date.localeCompare(b.due_date));
  let left = paymentAmount;
  const allocations: { label: string; alloc: number; remaining: number }[] = [];

  for (const inst of sorted) {
    if (left <= 0) break;
    const alloc = Math.min(left, inst.amount);
    allocations.push({ label: inst.label, alloc, remaining: inst.amount - alloc });
    left -= alloc;
  }

  return (
    <div className="rounded-xl border bg-blue-50 p-4 text-sm">
      <p className="mb-2 font-semibold text-blue-900">
        Ventilation prévue du paiement de {XAF.format(paymentAmount)} XAF :
      </p>
      <ul className="space-y-1 text-blue-900">
        {allocations.map((a, i) => (
          <li key={i} className="flex justify-between">
            <span>{a.label}</span>
            <span className="font-mono">
              {XAF.format(a.alloc)} XAF
              {a.remaining > 0 && (
                <span className="text-blue-600"> (reste {XAF.format(a.remaining)})</span>
              )}
              {a.remaining === 0 && (
                <span className="text-green-700"> soldée</span>
              )}
            </span>
          </li>
        ))}
        {left > 0 && (
          <li className="flex justify-between border-t border-blue-200 pt-1 text-orange-700">
            <span>Trop-perçu (avance)</span>
            <span className="font-mono">{XAF.format(left)} XAF</span>
          </li>
        )}
      </ul>
    </div>
  );
}
