'use client';

import { useState } from 'react';
import { useStructureTemplates, useSeedStructureFromTemplate } from '@edukea/shared';
import { Button, Skeleton } from '@edukea/ui';
import { X } from 'lucide-react';

interface Props { schoolId: string; onClose: () => void; }

export function LoadTemplateDialog({ schoolId, onClose }: Props) {
  const { data: templates, isLoading } = useStructureTemplates();
  const seed = useSeedStructureFromTemplate();
  const [selected, setSelected] = useState<string | null>(null);

  const apply = async () => {
    if (!selected) return;
    await seed.mutateAsync({ schoolId, templateKey: selected });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Charger un template</h2>
          <button type="button" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        {isLoading ? <Skeleton className="h-40 w-full" /> : (
          <div className="space-y-2">
            {(templates ?? []).map((t) => (
              <label key={t.template_key} className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer ${
                selected === t.template_key ? 'border-orange-500 bg-orange-50' : 'border-slate-200'
              }`}>
                <input type="radio" checked={selected === t.template_key} onChange={() => setSelected(t.template_key)} />
                <div>
                  <p className="font-medium">{t.cycle_name}</p>
                  <p className="text-xs text-slate-500">{t.levels.map((l) => l.name).join(' · ')}</p>
                </div>
              </label>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={apply} disabled={!selected || seed.isPending}>
            {seed.isPending ? 'Chargement…' : 'Appliquer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
