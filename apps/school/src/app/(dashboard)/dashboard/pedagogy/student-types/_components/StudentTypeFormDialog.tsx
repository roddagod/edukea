'use client';

import { useState } from 'react';
import { useUpsertStudentType, useStudentTypes, type StudentType } from '@edukea/shared';
import { Button, Input } from '@edukea/ui';
import { X } from 'lucide-react';

interface Props { schoolId: string; type: StudentType | null; onClose: () => void; }

export function StudentTypeFormDialog({ schoolId, type, onClose }: Props) {
  const { data: existing } = useStudentTypes(schoolId);
  const upsert = useUpsertStudentType();
  const [code, setCode] = useState(type?.code ?? '');
  const [label, setLabel] = useState(type?.label ?? '');
  const [isDefault, setIsDefault] = useState(type?.is_default ?? false);
  const nextOrder = type?.order ?? (Math.max(0, ...(existing ?? []).map((t) => t.order)) + 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await upsert.mutateAsync({
      id: type?.id, school_id: schoolId, code, label, order: nextOrder, is_default: isDefault,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{type ? 'Éditer' : 'Ajouter'} type d&apos;élève</h2>
          <button type="button" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Code (technique, ex: boursier)</label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Libellé (affiché)</label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} required />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
            <span className="text-sm">Type par défaut (attribué automatiquement aux nouveaux élèves)</span>
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={upsert.isPending}>Enregistrer</Button>
        </div>
      </form>
    </div>
  );
}
