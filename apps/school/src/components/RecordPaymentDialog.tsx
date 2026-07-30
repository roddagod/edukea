'use client';

import { useState } from 'react';
import { useRecordPayment, useSsylInstallmentStatus } from '@edukea/shared';
import { Button, Input, Skeleton } from '@edukea/ui';
import { X, Check } from 'lucide-react';

interface Props {
  ssylId: string;
  studentName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (txId: string) => void;
}

const XAF = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function RecordPaymentDialog({ ssylId, studentName, isOpen, onClose, onSuccess }: Props) {
  const record = useRecordPayment();
  const { data: installments, isLoading } = useSsylInstallmentStatus(ssylId);
  const [amount, setAmount] = useState<number>(0);
  const [source, setSource] = useState<'cash' | 'bank_transfer' | 'internal'>('cash');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const unpaidInstallments = (installments ?? []).filter((i) => i.status !== 'paid');
  const totalRemaining = unpaidInstallments.reduce((s, i) => s + (i.amount_due - i.amount_paid), 0);

  // Preview ventilation
  const sorted = [...unpaidInstallments].sort((a, b) => a.due_date.localeCompare(b.due_date));
  let left = amount;
  const allocations: { label: string; alloc: number; remaining: number }[] = [];
  for (const inst of sorted) {
    if (left <= 0) break;
    const dueRemaining = inst.amount_due - inst.amount_paid;
    const alloc = Math.min(left, dueRemaining);
    allocations.push({ label: inst.label, alloc, remaining: dueRemaining - alloc });
    left -= alloc;
  }
  const surplus = left;

  const handleSubmit = async () => {
    setError(null);
    if (amount <= 0) {
      setError('Le montant doit être > 0');
      return;
    }
    try {
      const txId = await record.mutateAsync({
        ssylId,
        amount,
        source,
        memo: memo || undefined,
      });
      onSuccess?.(txId);
      onClose();
      setAmount(0);
      setMemo('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Enregistrer un paiement</h2>
            {studentName && <p className="text-sm text-slate-600">{studentName}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <>
            {totalRemaining > 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-medium">
                  Reste à payer : {XAF.format(totalRemaining)} XAF
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {unpaidInstallments.length} échéance(s) ouverte(s)
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                Toutes les échéances sont soldées. Un paiement sera enregistré comme avance.
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Montant (XAF)</label>
                <Input
                  type="number"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Méthode</label>
                <select
                  value={source}
                  onChange={(e) =>
                    setSource(e.target.value as 'cash' | 'bank_transfer' | 'internal')
                  }
                  className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="cash">Espèces</option>
                  <option value="bank_transfer">Virement banc.</option>
                  <option value="internal">Interne</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Mémo (optionnel)</label>
              <Input
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="ex: Paiement 2e tranche"
              />
            </div>

            {amount > 0 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm space-y-1">
                <p className="font-semibold text-blue-900">Ventilation prévue :</p>
                {allocations.map((a, i) => (
                  <div key={i} className="flex justify-between text-blue-900">
                    <span>{a.label}</span>
                    <span className="font-mono">
                      {XAF.format(a.alloc)}
                      {a.remaining > 0 && (
                        <span className="text-blue-600 ml-1">
                          (reste {XAF.format(a.remaining)})
                        </span>
                      )}
                      {a.remaining === 0 && (
                        <span className="text-green-700 ml-1">
                          <Check className="inline h-3 w-3" />
                        </span>
                      )}
                    </span>
                  </div>
                ))}
                {surplus > 0 && (
                  <div className="flex justify-between text-orange-700 border-t border-blue-200 pt-1 mt-1">
                    <span>Avance (trop-perçu)</span>
                    <span className="font-mono">{XAF.format(surplus)}</span>
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
          </>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={amount <= 0 || record.isPending}>
            <Check className="mr-2 h-4 w-4" />
            {record.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
