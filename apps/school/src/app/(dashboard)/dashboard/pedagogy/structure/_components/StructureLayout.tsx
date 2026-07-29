'use client';

import { useState } from 'react';
import { useSchoolStructure } from '@edukea/shared';
import { Button, Skeleton } from '@edukea/ui';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { StructureTree } from './StructureTree';
import { StructureDetail } from './StructureDetail';
import { LoadTemplateDialog } from './LoadTemplateDialog';

export type SelectedNode =
  | { type: 'cycle'; id: string }
  | { type: 'level'; id: string }
  | { type: 'classroom'; id: string }
  | null;

interface Props { schoolId: string; }

export function StructureLayout({ schoolId }: Props) {
  const { data, isLoading } = useSchoolStructure(schoolId);
  const [selected, setSelected] = useState<SelectedNode>(null);
  const [showTemplate, setShowTemplate] = useState(false);

  if (isLoading || !data) return <Skeleton className="h-96 w-full" />;

  const structure = data.tree;
  const hasStructure = structure.length > 0;
  const levelsCount = structure.reduce((n, c) => n + c.levels.length, 0);
  const classroomsCount = structure.reduce((n, c) => n + c.levels.reduce((m, l) => m + l.classrooms.length, 0), 0);

  return (
    <div className="space-y-4">
      {data.orphanClassrooms.length > 0 && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="font-medium text-amber-900">
                {data.orphanClassrooms.length} classe(s) à raccrocher
              </p>
              <p className="mt-1 text-sm text-amber-800">
                Ces classes existent dans la table mais leur niveau appartient à une autre école ou n&apos;a pas de cycle.
                Créez d&apos;abord un cycle + niveau qui les accueille, puis re-liez-les.
              </p>
              <ul className="mt-2 space-y-1 text-sm text-amber-900">
                {data.orphanClassrooms.map((c) => (
                  <li key={c.id} className="rounded bg-white/50 px-2 py-1">
                    <span className="font-mono text-xs">{c.name}</span>
                    <span className="ml-2 text-xs text-amber-700">id: {c.id.slice(0, 8)}…</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">{levelsCount} niveaux · {classroomsCount} classes</div>
        <Button variant="secondary" onClick={() => setShowTemplate(true)}>
          <Sparkles className="mr-2 h-4 w-4" /> Charger template
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[360px_1fr]">
        <div className="rounded-xl border bg-white p-3">
          {hasStructure
            ? <StructureTree structure={structure} selected={selected} onSelect={setSelected} />
            : <p className="text-sm text-slate-500 text-center py-8">Aucune structure. Chargez un template ou ajoutez un cycle manuellement.</p>
          }
        </div>
        <div className="rounded-xl border bg-white p-4">
          <StructureDetail schoolId={schoolId} structure={structure} selected={selected} onSelect={setSelected} />
        </div>
      </div>

      {showTemplate && <LoadTemplateDialog schoolId={schoolId} onClose={() => setShowTemplate(false)} />}
    </div>
  );
}
