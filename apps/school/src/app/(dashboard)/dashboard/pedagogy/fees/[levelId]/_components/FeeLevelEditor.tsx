'use client';

import { useState, useEffect } from 'react';
import {
  useStudentTypes,
  useLevelFeeLines,
  useLevelFeeInstallments,
  useUpsertLevelFeeLine,
  useDeleteLevelFeeLine,
  useUpsertLevelFeeInstallment,
  useDeleteLevelFeeInstallment,
  useCopyFeesFromType,
  type LevelFeeLine,
  type LevelFeeInstallment,
} from '@edukea/shared';
import { Button, Input, Skeleton } from '@edukea/ui';
import { Plus, Trash2, Copy } from 'lucide-react';

interface Props {
  schoolId: string;
  levelId: string;
  initialTypeId?: string;
}

const XAF = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const CATEGORIES = ['inscription', 'tuition', 'insurance', 'canteen', 'transport', 'other'] as const;

export function FeeLevelEditor({ schoolId, levelId, initialTypeId }: Props) {
  const { data: types } = useStudentTypes(schoolId);
  const [typeId, setTypeId] = useState<string | undefined>(initialTypeId);

  useEffect(() => {
    if (!typeId && types && types.length > 0) setTypeId(types[0].id);
  }, [types, typeId]);

  const { data: lines, isLoading: lL } = useLevelFeeLines(levelId, typeId);
  const { data: installments, isLoading: iL } = useLevelFeeInstallments(levelId, typeId);
  const upLine = useUpsertLevelFeeLine();
  const delLine = useDeleteLevelFeeLine();
  const upInst = useUpsertLevelFeeInstallment();
  const delInst = useDeleteLevelFeeInstallment();
  const copy = useCopyFeesFromType();

  if (!types || !typeId || lL || iL) return <Skeleton className="h-96 w-full" />;

  const totalMandatory = (lines ?? [])
    .filter((l) => !l.is_optional)
    .reduce((s, l) => s + l.amount, 0);
  const totalWithOptions = (lines ?? []).reduce((s, l) => s + l.amount, 0);

  const addLine = () => {
    const nextOrder = Math.max(0, ...(lines ?? []).map((l) => l.order)) + 1;
    upLine.mutate({
      level_id: levelId,
      student_type_id: typeId,
      category: 'other',
      label: 'Nouvelle ligne',
      amount: 0,
      order: nextOrder,
      is_optional: false,
    });
  };

  const addInstallment = () => {
    const nextOrder = Math.max(0, ...(installments ?? []).map((i) => i.order)) + 1;
    upInst.mutate({
      level_id: levelId,
      student_type_id: typeId,
      order: nextOrder,
      label: `Tranche ${nextOrder}`,
      category: 'tuition',
      due_date_offset_days: 0,
      amount: 0,
      amount_percentage: null,
    });
  };

  const doCopy = async () => {
    const src = prompt(
      `Copier depuis quel type ? Codes disponibles : ${types.map((t) => t.code).join(', ')}`,
    );
    if (!src) return;
    const source = types.find((t) => t.code === src);
    if (!source || source.id === typeId) {
      alert('Type source invalide');
      return;
    }
    if (!confirm(`Écraser les lignes actuelles avec celles de ${source.label} ?`)) return;
    await copy.mutateAsync({ levelId, sourceTypeId: source.id, targetTypeId: typeId });
  };

  return (
    <div className="space-y-6">
      {/* Type selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-600">Type d&apos;élève :</span>
        {types.map((t) => (
          <button
            key={t.id}
            onClick={() => setTypeId(t.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              typeId === t.id
                ? 'bg-orange-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="flex-1" />
        <Button variant="secondary" onClick={doCopy} disabled={copy.isPending}>
          <Copy className="mr-2 h-4 w-4" />
          Copier depuis autre type
        </Button>
      </div>

      {/* Fee lines section */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Lignes de frais</h2>
          <Button onClick={addLine} disabled={upLine.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter ligne
          </Button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="w-12 p-2 text-left">#</th>
                <th className="p-2 text-left">Libellé</th>
                <th className="w-40 p-2 text-left">Catégorie</th>
                <th className="w-36 p-2 text-right">Montant (XAF)</th>
                <th className="w-16 p-2 text-center">Opt.</th>
                <th className="w-12 p-2"></th>
              </tr>
            </thead>
            <tbody>
              {(lines ?? []).map((l) => (
                <FeeLineRow
                  key={l.id}
                  line={l}
                  onSave={(p) => upLine.mutate({ ...l, ...p })}
                  onDelete={() => delLine.mutate({ id: l.id, levelId, studentTypeId: typeId })}
                />
              ))}
              {(lines ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-sm text-slate-500">
                    Aucune ligne. Cliquez &quot;Ajouter ligne&quot; ou &quot;Copier depuis autre type&quot;.
                  </td>
                </tr>
              )}
              {(lines ?? []).length > 0 && (
                <>
                  <tr className="border-t bg-slate-50 font-semibold">
                    <td colSpan={3} className="p-2 text-right text-xs text-slate-600">
                      Total obligatoire
                    </td>
                    <td className="p-2 text-right font-mono">{XAF.format(totalMandatory)}</td>
                    <td colSpan={2}></td>
                  </tr>
                  {totalWithOptions !== totalMandatory && (
                    <tr className="bg-slate-50 text-slate-600">
                      <td colSpan={3} className="p-2 text-right text-xs">
                        Total avec options
                      </td>
                      <td className="p-2 text-right font-mono">{XAF.format(totalWithOptions)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Installments section */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Échéances</h2>
          <Button onClick={addInstallment} disabled={upInst.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter tranche
          </Button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="w-12 p-2 text-left">#</th>
                <th className="p-2 text-left">Libellé</th>
                <th className="w-40 p-2 text-left">Catégorie</th>
                <th className="w-20 p-2 text-right">+Jrs</th>
                <th className="w-32 p-2 text-right">Montant (XAF)</th>
                <th className="w-16 p-2 text-right">%</th>
                <th className="w-12 p-2"></th>
              </tr>
            </thead>
            <tbody>
              {(installments ?? []).map((i) => (
                <InstallmentRow
                  key={i.id}
                  inst={i}
                  onSave={(p) => upInst.mutate({ ...i, ...p })}
                  onDelete={() =>
                    delInst.mutate({ id: i.id, levelId, studentTypeId: typeId })
                  }
                />
              ))}
              {(installments ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-sm text-slate-500">
                    Aucune échéance. Cliquez &quot;Ajouter tranche&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function FeeLineRow({
  line,
  onSave,
  onDelete,
}: {
  line: LevelFeeLine;
  onSave: (patch: Partial<LevelFeeLine>) => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-t">
      <td className="p-2 text-slate-500">{line.order}</td>
      <td className="p-2">
        <Input
          defaultValue={line.label}
          onBlur={(e) => {
            const v = e.target.value;
            if (v !== line.label) onSave({ label: v });
          }}
        />
      </td>
      <td className="p-2">
        <select
          defaultValue={line.category}
          onChange={(e) => onSave({ category: e.target.value })}
          className="w-full rounded-md border border-slate-200 px-2 py-2 text-sm text-slate-700 hover:border-slate-400 focus:border-orange-500 focus:outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </td>
      <td className="p-2">
        <Input
          type="number"
          defaultValue={line.amount}
          className="text-right"
          onBlur={(e) => {
            const v = Number(e.target.value);
            if (v !== line.amount) onSave({ amount: v });
          }}
        />
      </td>
      <td className="p-2 text-center">
        <input
          type="checkbox"
          defaultChecked={line.is_optional}
          onChange={(e) => onSave({ is_optional: e.target.checked })}
          className="h-4 w-4 accent-orange-600"
        />
      </td>
      <td className="p-2 text-right">
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </td>
    </tr>
  );
}

function InstallmentRow({
  inst,
  onSave,
  onDelete,
}: {
  inst: LevelFeeInstallment;
  onSave: (patch: Partial<LevelFeeInstallment>) => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-t">
      <td className="p-2 text-slate-500">{inst.order}</td>
      <td className="p-2">
        <Input
          defaultValue={inst.label}
          onBlur={(e) => {
            const v = e.target.value;
            if (v !== inst.label) onSave({ label: v });
          }}
        />
      </td>
      <td className="p-2">
        <select
          defaultValue={inst.category}
          onChange={(e) => onSave({ category: e.target.value })}
          className="w-full rounded-md border border-slate-200 px-2 py-2 text-sm text-slate-700 hover:border-slate-400 focus:border-orange-500 focus:outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </td>
      <td className="p-2">
        <Input
          type="number"
          defaultValue={inst.due_date_offset_days}
          className="text-right"
          onBlur={(e) => {
            const v = Number(e.target.value);
            if (v !== inst.due_date_offset_days) onSave({ due_date_offset_days: v });
          }}
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          defaultValue={inst.amount ?? ''}
          className="text-right"
          onBlur={(e) => {
            const v = e.target.value ? Number(e.target.value) : null;
            if (v !== inst.amount) onSave({ amount: v });
          }}
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          defaultValue={inst.amount_percentage ?? ''}
          className="text-right"
          onBlur={(e) => {
            const v = e.target.value ? Number(e.target.value) : null;
            if (v !== inst.amount_percentage) onSave({ amount_percentage: v });
          }}
        />
      </td>
      <td className="p-2 text-right">
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </td>
    </tr>
  );
}
