'use client';

import { useState } from 'react';
import { useSchoolStructure } from '@edukea/shared';
import { Button, Skeleton } from '@edukea/ui';
import { Sparkles } from 'lucide-react';
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
  const { data: structure, isLoading } = useSchoolStructure(schoolId);
  const [selected, setSelected] = useState<SelectedNode>(null);
  const [showTemplate, setShowTemplate] = useState(false);

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  const hasStructure = (structure?.length ?? 0) > 0;
  const levelsCount = structure?.reduce((n, c) => n + c.levels.length, 0) ?? 0;
  const classroomsCount = structure?.reduce((n, c) => n + c.levels.reduce((m, l) => m + l.classrooms.length, 0), 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">{levelsCount} niveaux · {classroomsCount} classes</div>
        <Button variant="secondary" onClick={() => setShowTemplate(true)}>
          <Sparkles className="mr-2 h-4 w-4" /> Charger template
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[360px_1fr]">
        <div className="rounded-xl border bg-white p-3">
          {hasStructure
            ? <StructureTree structure={structure!} selected={selected} onSelect={setSelected} />
            : <p className="text-sm text-slate-500 text-center py-8">Aucune structure. Chargez un template ou ajoutez un cycle manuellement.</p>
          }
        </div>
        <div className="rounded-xl border bg-white p-4">
          <StructureDetail schoolId={schoolId} structure={structure ?? []} selected={selected} onSelect={setSelected} />
        </div>
      </div>

      {showTemplate && <LoadTemplateDialog schoolId={schoolId} onClose={() => setShowTemplate(false)} />}
    </div>
  );
}
