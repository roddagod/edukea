'use client';

import { useState } from 'react';
import { useRecordPayment, useSsylInstallmentStatus, useSchoolCurrency, formatMoney } from '@edukea/shared';
import type { Currency } from '@edukea/shared';
import { Modal, Button, Input } from '@edukea/ui';

interface Props {
  ssylId: string;
  studentName?: string;
  remaining?: number;
  currency?: Currency;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (txId: string) => void;
}

const SOURCES: { value: 'cash' | 'bank_transfer' | 'internal'; label: string }[] = [
  { value: 'cash', label: 'Espèces' },
  { value: 'bank_transfer', label: 'Virement' },
  { value: 'internal', label: 'Interne' },
];

export function RecordPaymentDialog({ ssylId, studentName, remaining, currency: currencyProp, isOpen, onClose, onSuccess }: Props) {
  const fallbackCurrency = useSchoolCurrency();
  const currency = currencyProp ?? fallbackCurrency;
  const record = useRecordPayment();
  const { data: installments } = useSsylInstallmentStatus(ssylId);
  const [amountInput, setAmountInput] = useState('');
  const [source, setSource] = useState<'cash' | 'bank_transfer' | 'internal'>('cash');
  const [memo, setMemo] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  const amount = Number(amountInput.replace(/\s/g, '')) || 0;

  const unpaidInstallments = (installments ?? []).filter((i) => i.status !== 'paid');
  const totalRemaining = remaining ?? unpaidInstallments.reduce((s, i) => s + (i.amount_due - i.amount_paid), 0);
  const isOverpayment = totalRemaining > 0 && amount > totalRemaining;

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
    if (amount <= 0) { setError('Le montant doit être > 0'); return; }
    if (isOverpayment) {
      setError(`Montant supérieur au restant dû (${formatMoney(totalRemaining, currency)}). Le versement ne peut pas être enregistré.`);
      return;
    }
    try {
      const txId = await record.mutateAsync({
        ssylId, amount, source, memo: memo || undefined,
        occurredAt: paymentDate ? `${paymentDate}T12:00:00Z` : undefined,
      });
      onSuccess?.(txId);
      // Reset
      setAmountInput(''); setMemo(''); setSource('cash');
      setPaymentDate(new Date().toISOString().slice(0, 10));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const description = studentName
    ? `${studentName}${totalRemaining > 0 ? ` — Restant dû : ${formatMoney(totalRemaining, currency)}` : ''}`
    : (totalRemaining > 0 ? `Restant dû : ${formatMoney(totalRemaining, currency)}` : undefined);

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Nouveau versement"
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={record.isPending}>Annuler</Button>
          <Button
            variant="accent"
            onClick={handleSubmit}
            disabled={record.isPending || amount <= 0 || isOverpayment}
            title={isOverpayment ? `Max : ${formatMoney(totalRemaining, currency)}` : undefined}
          >
            {record.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Montant"
          type="text"
          inputMode="numeric"
          placeholder="Ex : 50 000"
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          suffix={<span className="text-body-xs">{currency}</span>}
          autoFocus
          hint={totalRemaining > 0 ? `Max : ${formatMoney(totalRemaining, currency)}` : undefined}
          error={isOverpayment ? `Dépasse le restant dû de ${formatMoney(amount - totalRemaining, currency)}` : undefined}
        />

        <Input
          label="Date du versement"
          type="date"
          value={paymentDate}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setPaymentDate(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-body-xs font-semibold text-ink-2">Mode de paiement</label>
          <div className="grid grid-cols-3 gap-2">
            {SOURCES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSource(s.value)}
                className={`rounded-md border px-3 py-2 text-body-sm font-semibold transition-colors ${
                  source === s.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-line bg-white text-ink-2 hover:border-ink-4'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Mémo (optionnel)"
          type="text"
          placeholder="Ex : reçu 2026/03"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />

        {amount > 0 && allocations.length > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm space-y-1">
            <p className="font-semibold text-blue-900">Ventilation prévue :</p>
            {allocations.map((a, i) => (
              <div key={i} className="flex justify-between text-blue-900">
                <span>{a.label}</span>
                <span className="font-mono">
                  {formatMoney(a.alloc, currency)}
                  {a.remaining > 0 && <span className="text-blue-600 ml-1">(reste {formatMoney(a.remaining, currency)})</span>}
                  {a.remaining === 0 && <span className="text-green-700 ml-1">✓</span>}
                </span>
              </div>
            ))}
            {surplus > 0 && (
              <div className="flex justify-between text-orange-700 border-t border-blue-200 pt-1 mt-1">
                <span>Avance (trop-perçu)</span>
                <span className="font-mono">{formatMoney(surplus, currency)}</span>
              </div>
            )}
          </div>
        )}

        {error && <div className="text-caption text-destructive">{error}</div>}
      </div>
    </Modal>
  );
}
