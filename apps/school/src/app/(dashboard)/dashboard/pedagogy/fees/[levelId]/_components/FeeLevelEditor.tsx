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
import { Plus, Trash2, Copy, AlertTriangle, CheckCircle2, Sparkles, Scale } from 'lucide-react';

// Labels FR des categories (au lieu des slugs techniques)
const CATEGORY_LABELS: Record<string, string> = {
  inscription: 'Inscription',
  tuition:     'Scolarité',
  insurance:   'Assurance',
  canteen:     'Cantine',
  transport:   'Transport',
  other:       'Autre',
};

// Mois de l'annee scolaire (septembre à juin)
const MONTHS_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

/** Repartit un total en N parts entieres (differences absorbees sur la derniere) */
function distributeEqually(total: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  const rest = total - base * n;
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? base + rest : base));
}

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

  // Logique de generation :
  //   - Chaque ligne non-'tuition' (inscription, assurance, cantine, transport,
  //     autre) devient 1 echeance a 100% en septembre.
  //     Le libelle et le montant sont repris tels quels de la ligne.
  //   - Uniquement la scolarite (tuition) est repartie en N tranches sur l'annee.
  //   -> permet de suivre distinctement : inscription payee, assurance payee,
  //      tranche scolarite 1/2/3 payees, etc.
  const generateInstallments = async (nTuitionTranches: number) => {
    if (!hasLines) return;
    // Purge les tranches existantes
    for (const inst of installments ?? []) {
      await delInst.mutateAsync({ id: inst.id, levelId, studentTypeId: typeId });
    }

    let order = 1;

    // 1. Toutes les lignes non-tuition = 1 echeance chacune (repris a l'identique)
    const nonTuitionLines = (lines ?? [])
      .filter((l) => l.category !== 'tuition' && !l.is_optional)
      .sort((a, b) => a.order - b.order);
    for (const line of nonTuitionLines) {
      if (line.amount <= 0) continue;
      await upInst.mutateAsync({
        level_id: levelId, student_type_id: typeId, order: order++,
        label: line.label, // reprend le libelle de la ligne (Inscription, Assurance, etc.)
        category: line.category,
        due_month: 9, due_year_offset: 0, // par defaut : septembre a la rentree
        amount: line.amount,
        amount_percentage: null,
      });
    }

    // 2. Total scolarite (tuition) uniquement -> reparti en N tranches equitables
    const tuitionTotal = (lines ?? [])
      .filter((l) => l.category === 'tuition' && !l.is_optional)
      .reduce((s, l) => s + l.amount, 0);
    if (tuitionTotal > 0 && nTuitionTranches > 0) {
      const parts = distributeEqually(tuitionTotal, nTuitionTranches);
      // Mois de repartition : 10, 12, 2, 4, 6 (max 5) puis mensuel si plus
      const monthSequence = nTuitionTranches <= 5
        ? [10, 12, 2, 4, 6].slice(0, nTuitionTranches)
        : Array.from({ length: nTuitionTranches }, (_, i) => ((10 + i - 1) % 12) + 1);
      for (let i = 0; i < parts.length; i++) {
        const month = monthSequence[i];
        const yearOffset = month < 9 ? 1 : 0;
        await upInst.mutateAsync({
          level_id: levelId, student_type_id: typeId, order: order++,
          label: nTuitionTranches === 1 ? 'Scolarité (comptant)' : `Scolarité — Tranche ${i + 1}`,
          category: 'tuition',
          due_month: month, due_year_offset: yearOffset,
          amount: parts[i], amount_percentage: null,
        });
      }
    }
  };

  // Reequilibre :
  //   - Chaque echeance non-tuition reprend le montant de la ligne correspondante
  //     (matchee par category ; si plusieurs lignes non-tuition existent, on prend
  //     la ligne dont le label correspond a l'echeance).
  //   - Les echeances tuition sont redistribuees equitablement sur le total scolarite.
  const rebalanceInstallments = async () => {
    if (!hasLines || !hasInstallments) return;

    // Match echeances non-tuition avec lignes correspondantes (par label prioritaire, sinon category)
    const nonTuitionInsts = (installments ?? []).filter((i) => i.category !== 'tuition');
    const nonTuitionLines = (lines ?? []).filter((l) => l.category !== 'tuition' && !l.is_optional);
    for (const inst of nonTuitionInsts) {
      const matchByLabel = nonTuitionLines.find((l) => l.label.toLowerCase() === inst.label.toLowerCase());
      const matchByCategory = nonTuitionLines.find((l) => l.category === inst.category);
      const line = matchByLabel ?? matchByCategory;
      if (line && line.amount !== inst.amount) {
        await upInst.mutateAsync({ ...inst, amount: line.amount });
      }
    }

    // Tuition : redistribue le total sur N echeances existantes
    const tuitionInsts = (installments ?? []).filter((i) => i.category === 'tuition');
    const tuitionTotalDue = (lines ?? [])
      .filter((l) => l.category === 'tuition' && !l.is_optional)
      .reduce((s, l) => s + l.amount, 0);
    if (tuitionInsts.length > 0 && tuitionTotalDue > 0) {
      const parts = distributeEqually(tuitionTotalDue, tuitionInsts.length);
      for (let i = 0; i < tuitionInsts.length; i++) {
        if (tuitionInsts[i].amount !== parts[i]) {
          await upInst.mutateAsync({ ...tuitionInsts[i], amount: parts[i] });
        }
      }
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
          <Button variant="accent" onClick={() => generateInstallments(3)} disabled={upInst.isPending || delInst.isPending}>
            <Sparkles className="mr-2 h-4 w-4" /> Générer 3 tranches par défaut
          </Button>
        )}
        {hasLines && hasInstallments && !installmentsMatchTotal && (
          <Button variant="accent" onClick={rebalanceInstallments} disabled={upInst.isPending}>
            <Scale className="mr-2 h-4 w-4" /> Équilibrer automatiquement
          </Button>
        )}
      </div>

      {/* Barre de progression visuelle de l'equilibre echeances / lignes */}
      {hasLines && hasInstallments && (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Répartition des échéances</span>
              <span className={installmentsMatchTotal ? 'font-semibold text-green-700' : 'font-semibold text-amber-700'}>
                {formatMoney(installmentsTotal, currency)} / {formatMoney(totalMandatory, currency)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full transition-all ${
                  installmentsMatchTotal ? 'bg-green-500' : installmentsTotal > totalMandatory ? 'bg-red-500' : 'bg-amber-500'
                }`}
                style={{ width: totalMandatory > 0 ? `${Math.min(100, (installmentsTotal / totalMandatory) * 100)}%` : '0%' }}
              />
            </div>
          </div>
        </div>
      )}

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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-slate-900">Échéances</h2>
          <div className="flex flex-wrap items-center gap-2">
            {hasLines && (
              <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1">
                <span className="px-2 text-xs font-semibold text-slate-500">Scolarité en :</span>
                {[1, 3, 5, 9].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      if (hasInstallments && !confirm(`Remplacer les ${installments!.length} échéances actuelles par ${n === 1 ? '1 échéance scolarité comptant' : `${n} tranches scolarité`} (les autres frais restent en 1 échéance chacun) ?`)) return;
                      void generateInstallments(n);
                    }}
                    disabled={upInst.isPending || delInst.isPending}
                    className="rounded px-2 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-primary/[0.08] hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {n === 1 ? 'Comptant' : `${n} tranches`}
                  </button>
                ))}
              </div>
            )}
            <Button variant="secondary" size="sm" onClick={addInstallment} disabled={upInst.isPending}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Ajouter
            </Button>
          </div>
        </div>
        {hasLines && (
          <p className="mb-3 text-xs text-slate-500">
            Inscription, assurance, cantine, transport et autres frais sont créés en <strong>1 échéance chacun</strong> à leur montant exact. Seule la <strong>scolarité</strong> est répartie sur N tranches.
          </p>
        )}
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="w-10 p-2 text-left">#</th>
                <th className="p-2 text-left">Libellé</th>
                <th className="hidden w-32 p-2 text-left sm:table-cell">Catégorie</th>
                <th className="w-32 p-2 text-left">Échéance</th>
                <th className="w-32 p-2 text-right">Montant ({currency})</th>
                <th className="hidden w-16 p-2 text-right sm:table-cell">%</th>
                <th className="w-10 p-2"></th>
              </tr>
            </thead>
            <tbody>
              {(installments ?? []).map((i) => (
                <InstallmentRow
                  key={i.id}
                  inst={i}
                  totalMandatory={totalMandatory}
                  onSave={(p) => upInst.mutate({ ...i, ...p })}
                  onDelete={() =>
                    delInst.mutate({ id: i.id, levelId, studentTypeId: typeId })
                  }
                />
              ))}
              {(installments ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-sm text-slate-500">
                    Aucune échéance configurée. Utilisez les presets ci-dessus (1/3/5/9) ou cliquez &quot;Ajouter&quot;.
                  </td>
                </tr>
              )}
              {(installments ?? []).length > 0 && (
                <tr className="border-t bg-slate-50 font-semibold">
                  <td colSpan={4} className="p-2 text-right text-xs text-slate-600">
                    Total échéances
                  </td>
                  <td className={`p-2 text-right font-mono ${installmentsMatchTotal ? 'text-green-700' : 'text-amber-700'}`}>
                    {formatMoney(installmentsTotal, currency)}
                  </td>
                  <td colSpan={2} className="p-2 text-right text-xs text-slate-500">
                    {totalMandatory > 0 ? `${Math.round((installmentsTotal / totalMandatory) * 100)}%` : ''}
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
              {CATEGORY_LABELS[c] ?? c}
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

// Options d'echeances : mois de septembre annee N a juin annee N+1
// Format : {label: "Sep N", month: 9, yearOffset: 0}
const DUE_OPTIONS: { label: string; month: number; yearOffset: number }[] = [
  { label: 'Sep N',   month: 9,  yearOffset: 0 },
  { label: 'Oct N',   month: 10, yearOffset: 0 },
  { label: 'Nov N',   month: 11, yearOffset: 0 },
  { label: 'Déc N',   month: 12, yearOffset: 0 },
  { label: 'Jan N+1', month: 1,  yearOffset: 1 },
  { label: 'Fév N+1', month: 2,  yearOffset: 1 },
  { label: 'Mar N+1', month: 3,  yearOffset: 1 },
  { label: 'Avr N+1', month: 4,  yearOffset: 1 },
  { label: 'Mai N+1', month: 5,  yearOffset: 1 },
  { label: 'Jun N+1', month: 6,  yearOffset: 1 },
];

function dueKey(month: number, yearOffset: number): string {
  return `${month}-${yearOffset}`;
}

function InstallmentRow({
  inst,
  totalMandatory,
  onSave,
  onDelete,
}: {
  inst: LevelFeeInstallment;
  totalMandatory: number;
  onSave: (patch: Partial<LevelFeeInstallment>) => void;
  onDelete: () => void;
}) {
  const currentDueKey = dueKey(inst.due_month, inst.due_year_offset ?? 0);
  const percentage = totalMandatory > 0 && inst.amount != null
    ? Math.round((inst.amount / totalMandatory) * 100)
    : null;
  return (
    <tr className="border-t hover:bg-slate-50/60">
      <td className="p-2 text-slate-400 font-mono text-xs">{inst.order}</td>
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
              {CATEGORY_LABELS[c] ?? c}
            </option>
          ))}
        </select>
      </td>
      <td className="p-2">
        <select
          value={currentDueKey}
          onChange={(e) => {
            const opt = DUE_OPTIONS.find((o) => dueKey(o.month, o.yearOffset) === e.target.value);
            if (opt) onSave({ due_month: opt.month, due_year_offset: opt.yearOffset });
          }}
          className="w-full rounded-md border border-slate-200 px-2 py-2 text-sm text-slate-700 hover:border-slate-400 focus:border-orange-500 focus:outline-none"
        >
          {DUE_OPTIONS.map((o) => (
            <option key={dueKey(o.month, o.yearOffset)} value={dueKey(o.month, o.yearOffset)}>
              {o.label}
            </option>
          ))}
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
      <td className="hidden p-2 text-right sm:table-cell">
        {percentage != null ? (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700" title="% du total obligatoire">
            {percentage}%
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
      <td className="p-2 text-right">
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </td>
    </tr>
  );
}
