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
  useSchoolCurrency,
  formatMoney,
  type LevelFeeLine,
  type LevelFeeInstallment,
} from '@edukea/shared';
import { Button, Input, Skeleton } from '@edukea/ui';
import { Plus, Trash2, Copy, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';

interface Props {
  schoolId: string;
  levelId: string;
  initialTypeId?: string;
}
const CATEGORIES = ['inscription', 'tuition', 'insurance', 'canteen', 'transport', 'other'] as const;

export function FeeLevelEditor({ schoolId, levelId, initialTypeId }: Props) {
  const currency = useSchoolCurrency();
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
  const installmentsTotal = (installments ?? []).reduce((s, i) => s + (i.amount ?? 0), 0);
  const hasLines = (lines ?? []).length > 0;
  const hasInstallments = (installments ?? []).length > 0;
  const installmentsMatchTotal = hasLines && hasInstallments && Math.abs(installmentsTotal - totalMandatory) < 1;

  // Generer automatiquement les tranches par defaut a partir du total des lignes
  const generateDefaultInstallments = () => {
    if (!hasLines) return;
    // 3 tranches par defaut : inscription (100% en septembre), scolarite 50% dec, 50% mars
    const inscription = (lines ?? []).find((l) => l.category === 'inscription');
    const tuitionTotal = (lines ?? []).filter((l) => l.category !== 'inscription' && !l.is_optional).reduce((s, l) => s + l.amount, 0);
    let order = 1;
    if (inscription && inscription.amount > 0) {
      upInst.mutate({
        level_id: levelId, student_type_id: typeId, order: order++,
        label: 'Inscription', category: 'inscription',
        due_month: 9, due_year_offset: 0, amount: inscription.amount, amount_percentage: null,
      });
    }
    if (tuitionTotal > 0) {
      const t1 = Math.round(tuitionTotal / 3);
      const t2 = Math.round(tuitionTotal / 3);
      const t3 = tuitionTotal - t1 - t2;
      upInst.mutate({ level_id: levelId, student_type_id: typeId, order: order++, label: 'Tranche 1', category: 'tuition', due_month: 10, due_year_offset: 0, amount: t1, amount_percentage: null });
      upInst.mutate({ level_id: levelId, student_type_id: typeId, order: order++, label: 'Tranche 2', category: 'tuition', due_month: 1, due_year_offset: 1, amount: t2, amount_percentage: null });
      upInst.mutate({ level_id: levelId, student_type_id: typeId, order: order++, label: 'Tranche 3', category: 'tuition', due_month: 4, due_year_offset: 1, amount: t3, amount_percentage: null });
    }
  };

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
      due_month: 9,
      due_year_offset: 0,
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
    <div className="space-y-8">
      {/* Bandeau statut : lignes OK + echeances OK/manquantes/decalees */}
      <div className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
        !hasLines
          ? 'border-slate-200 bg-slate-50'
          : !hasInstallments
            ? 'border-red-300 bg-red-50'
            : !installmentsMatchTotal
              ? 'border-amber-300 bg-amber-50'
              : 'border-green-300 bg-green-50'
      }`}>
        <div className="flex items-start gap-3">
          {!hasLines ? (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">1</div>
          ) : !hasInstallments ? (
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
          ) : !installmentsMatchTotal ? (
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
          )}
          <div>
            {!hasLines && (
              <>
                <p className="font-semibold text-slate-900">Étape 1 : ajoutez les lignes de frais</p>
                <p className="text-xs text-slate-600">Commencez par lister ce qui est facturé (Inscription, Scolarité, Assurance…).</p>
              </>
            )}
            {hasLines && !hasInstallments && (
              <>
                <p className="font-semibold text-red-900">⚠️ Échéances manquantes — inscriptions bloquées</p>
                <p className="text-xs text-red-800">
                  Total lignes : <strong>{formatMoney(totalMandatory, currency)}</strong> — mais aucune échéance définie.
                  Sans échéances, aucun élève ne peut être inscrit sur ce niveau et aucun paiement ne se ventilera.
                </p>
              </>
            )}
            {hasLines && hasInstallments && !installmentsMatchTotal && (
              <>
                <p className="font-semibold text-amber-900">⚠️ Total des échéances différent du total des lignes</p>
                <p className="text-xs text-amber-800">
                  Lignes obligatoires : <strong>{formatMoney(totalMandatory, currency)}</strong> · Total échéances : <strong>{formatMoney(installmentsTotal, currency)}</strong>. Écart : {formatMoney(Math.abs(installmentsTotal - totalMandatory), currency)}
                </p>
              </>
            )}
            {installmentsMatchTotal && (
              <>
                <p className="font-semibold text-green-900">Configuration complète</p>
                <p className="text-xs text-green-800">
                  {(lines ?? []).length} lignes · {(installments ?? []).length} échéances · Total : <strong>{formatMoney(totalMandatory, currency)}</strong>
                </p>
              </>
            )}
          </div>
        </div>
        {hasLines && !hasInstallments && (
          <Button variant="accent" onClick={generateDefaultInstallments} disabled={upInst.isPending}>
            <Sparkles className="mr-2 h-4 w-4" /> Générer 3 tranches par défaut
          </Button>
        )}
      </div>

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
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="w-12 p-2 text-left">#</th>
                <th className="p-2 text-left">Libellé</th>
                <th className="hidden w-40 p-2 text-left sm:table-cell">Catégorie</th>
                <th className="w-36 p-2 text-right">Montant ({currency})</th>
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
                    <td className="p-2 text-right font-mono">{formatMoney(totalMandatory, currency)}</td>
                    <td colSpan={2}></td>
                  </tr>
                  {totalWithOptions !== totalMandatory && (
                    <tr className="bg-slate-50 text-slate-600">
                      <td colSpan={3} className="p-2 text-right text-xs">
                        Total avec options
                      </td>
                      <td className="p-2 text-right font-mono">{formatMoney(totalWithOptions, currency)}</td>
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
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="w-12 p-2 text-left">#</th>
                <th className="p-2 text-left">Libellé</th>
                <th className="hidden w-40 p-2 text-left sm:table-cell">Catégorie</th>
                <th className="w-24 p-2 text-left">Mois</th>
                <th className="w-32 p-2 text-left">Année</th>
                <th className="w-28 p-2 text-right">Montant ({currency})</th>
                <th className="hidden w-16 p-2 text-right sm:table-cell">%</th>
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
      <td className="hidden p-2 sm:table-cell">
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

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

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
      <td className="hidden p-2 sm:table-cell">
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
        <select
          defaultValue={inst.due_month}
          onChange={(e) => onSave({ due_month: Number(e.target.value) })}
          className="w-full rounded-md border border-slate-200 px-2 py-2 text-sm text-slate-700 hover:border-slate-400 focus:border-orange-500 focus:outline-none"
        >
          {MONTHS.map((m, idx) => (
            <option key={idx + 1} value={idx + 1}>
              {m}
            </option>
          ))}
        </select>
      </td>
      <td className="p-2">
        <select
          defaultValue={inst.due_year_offset}
          onChange={(e) => onSave({ due_year_offset: Number(e.target.value) })}
          className="w-full rounded-md border border-slate-200 px-2 py-2 text-sm text-slate-700 hover:border-slate-400 focus:border-orange-500 focus:outline-none"
        >
          <option value={0}>Année N</option>
          <option value={1}>Année N+1</option>
        </select>
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
      <td className="hidden p-2 sm:table-cell">
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
