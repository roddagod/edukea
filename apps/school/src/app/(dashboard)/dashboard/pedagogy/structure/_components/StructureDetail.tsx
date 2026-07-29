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

  if (!selected) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Sélectionne un élément à gauche pour l&apos;éditer, ou :</p>
        <Button onClick={async () => {
          const n = prompt('Nom du nouveau cycle (ex: Collège)');
          if (n) await uc.mutateAsync({ school_id: schoolId, name: n });
        }}>
          <Plus className="mr-2 h-4 w-4" /> Ajouter un cycle
        </Button>
      </div>
    );
  }

  const saveName = async () => {
    if (selected.type === 'cycle') await uc.mutateAsync({ id: selected.id, school_id: schoolId, name });
    else if (selected.type === 'level') {
      const l = findLevel(selected.id);
      if (l) await ul.mutateAsync({ id: l.id, school_id: schoolId, cycle_id: l.cycle_id, name, order: l.order });
    } else if (selected.type === 'classroom') {
      const c = findClassroom(selected.id);
      if (c) await ur.mutateAsync({ id: c.id, school_id: schoolId, level_id: c.level_id, name });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700">Nom</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName} />
      </div>
      <div className="flex flex-wrap gap-2">
        {selected.type === 'cycle' && (
          <Button variant="secondary" onClick={async () => {
            const n = prompt('Nom du niveau (ex: 6ème)');
            if (n) {
              const cycle = findCycle(selected.id);
              if (cycle) {
                const nextOrder = Math.max(0, ...cycle.levels.map((l) => l.order)) + 1;
                await ul.mutateAsync({ school_id: schoolId, cycle_id: cycle.id, name: n, order: nextOrder });
              }
            }
          }}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter niveau
          </Button>
        )}
        {selected.type === 'level' && (
          <Button variant="secondary" onClick={async () => {
            const n = prompt('Nom de la classe (ex: 6ème A)');
            if (n) await ur.mutateAsync({ school_id: schoolId, level_id: selected.id, name: n });
          }}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter classe
          </Button>
        )}
        <Button variant="ghost" onClick={async () => {
          if (!confirm(`Supprimer ${name} et tous ses enfants ? Cascade.`)) return;
          if (selected.type === 'cycle') await dc.mutateAsync({ id: selected.id, schoolId });
          else if (selected.type === 'level') await dl.mutateAsync({ id: selected.id, schoolId });
          else await dr.mutateAsync({ id: selected.id, schoolId });
          onSelect(null);
        }}>
          <Trash2 className="mr-2 h-4 w-4 text-red-500" /> Supprimer
        </Button>
      </div>
    </div>
  );
}
