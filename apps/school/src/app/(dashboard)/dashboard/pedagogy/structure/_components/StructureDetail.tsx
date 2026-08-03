'use client';

import { useState, useEffect } from 'react';
import type { StructureCycle } from '@edukea/shared';
import {
  useUpsertCycle, useDeleteCycle, useUpsertLevel, useDeleteLevel,
  useUpsertClassroom, useDeleteClassroom,
} from '@edukea/shared';
import { Button, Input } from '@edukea/ui';
import { Plus, Trash2 } from 'lucide-react';
import type { SelectedNode } from './StructureLayout';

interface Props {
  schoolId: string;
  structure: StructureCycle[];
  selected: SelectedNode;
  onSelect: (n: SelectedNode) => void;
}

export function StructureDetail({ schoolId, structure, selected, onSelect }: Props) {
  const uc = useUpsertCycle(); const dc = useDeleteCycle();
  const ul = useUpsertLevel(); const dl = useDeleteLevel();
  const ur = useUpsertClassroom(); const dr = useDeleteClassroom();
  const [name, setName] = useState('');

  const findCycle = (id: string) => structure.find((c) => c.id === id);
  const findLevel = (id: string) => structure.flatMap((c) => c.levels).find((l) => l.id === id);
  const findClassroom = (id: string) => structure.flatMap((c) => c.levels).flatMap((l) => l.classrooms).find((cr) => cr.id === id);

  useEffect(() => {
    if (!selected) { setName(''); return; }
    if (selected.type === 'cycle') setName(findCycle(selected.id)?.name ?? '');
    if (selected.type === 'level') setName(findLevel(selected.id)?.name ?? '');
    if (selected.type === 'classroom') setName(findClassroom(selected.id)?.name ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, structure]);

  const [error, setError] = useState<string | null>(null);
  const runSafely = async (fn: () => Promise<unknown>) => {
    setError(null);
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : 'Erreur inconnue'); }
  };

  if (!selected) {
    const firstCycle = structure[0] ?? null;
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Selectionne un element a gauche pour l&apos;editer, ou cree :
        </p>
        <div className="flex flex-col gap-2">
          <Button variant="accent" onClick={() => runSafely(async () => {
            const n = prompt('Nom du nouveau cycle (ex: College)');
            if (n) await uc.mutateAsync({ school_id: schoolId, name: n });
          })}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter un cycle
          </Button>
          <Button
            variant="secondary"
            disabled={!firstCycle}
            title={!firstCycle ? 'Cree d\'abord un cycle' : `Ajouter dans ${firstCycle?.name}`}
            onClick={() => firstCycle && runSafely(async () => {
              const n = prompt(`Nom du niveau (dans le cycle "${firstCycle.name}", ex: 6eme)`);
              if (n) {
                const nextOrder = Math.max(0, ...firstCycle.levels.map((l) => l.order_by)) + 1;
                await ul.mutateAsync({ school_id: schoolId, cycle_id: firstCycle.id, name: n, order_by: nextOrder });
              }
            })}
          >
            <Plus className="mr-2 h-4 w-4" /> Ajouter un niveau
          </Button>
          <p className="text-xs text-slate-500">
            Pour ajouter une classe, selectionne d&apos;abord un niveau a gauche.
          </p>
        </div>
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
      </div>
    );
  }

  const saveName = () => runSafely(async () => {
    if (selected.type === 'cycle') await uc.mutateAsync({ id: selected.id, school_id: schoolId, name });
    else if (selected.type === 'level') {
      const l = findLevel(selected.id);
      if (l) await ul.mutateAsync({ id: l.id, school_id: schoolId, cycle_id: l.cycle_id, name, order_by: l.order_by });
    } else if (selected.type === 'classroom') {
      const c = findClassroom(selected.id);
      if (c) await ur.mutateAsync({ id: c.id, school_id: schoolId, level_id: c.level_id, name });
    }
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700">Nom</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName} />
      </div>
      <div className="flex flex-wrap gap-2">
        {selected.type === 'cycle' && (
          <Button variant="secondary" onClick={() => runSafely(async () => {
            const n = prompt('Nom du niveau (ex: 6eme)');
            if (n) {
              const cycle = findCycle(selected.id);
              if (cycle) {
                const nextOrder = Math.max(0, ...cycle.levels.map((l) => l.order_by)) + 1;
                await ul.mutateAsync({ school_id: schoolId, cycle_id: cycle.id, name: n, order_by: nextOrder });
              }
            }
          })}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter niveau
          </Button>
        )}
        {selected.type === 'level' && (
          <Button variant="secondary" onClick={() => runSafely(async () => {
            const n = prompt('Nom de la classe (ex: 6eme A)');
            if (n) await ur.mutateAsync({ school_id: schoolId, level_id: selected.id, name: n });
          })}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter classe
          </Button>
        )}
        <Button variant="ghost" onClick={() => runSafely(async () => {
          if (!confirm(`Supprimer ${name} et tous ses enfants ? Cascade.`)) return;
          if (selected.type === 'cycle') await dc.mutateAsync({ id: selected.id, schoolId });
          else if (selected.type === 'level') await dl.mutateAsync({ id: selected.id, schoolId });
          else await dr.mutateAsync({ id: selected.id, schoolId });
          onSelect(null);
        })}>
          <Trash2 className="mr-2 h-4 w-4 text-red-500" /> Supprimer
        </Button>
      </div>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
    </div>
  );
}
