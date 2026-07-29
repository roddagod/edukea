'use client';

import { useState } from 'react';
import { useUpsertSchoolYear, type SchoolYear } from '@edukea/shared';
import { Button, Input } from '@edukea/ui';
import { X } from 'lucide-react';

interface Props {
  schoolId: string;
  year: SchoolYear | null;
  onClose: () => void;
}

function suggestName(): string {
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
}

export function SchoolYearFormDialog({ schoolId, year, onClose }: Props) {
  const upsert = useUpsertSchoolYear();
  const [name, setName] = useState(year?.name ?? suggestName());
  const [dateStart, setDateStart] = useState(year?.date_start ?? '');
  const [dateEnd, setDateEnd] = useState(year?.date_end ?? '');
  const [periodeType, setPeriodeType] = useState<'trimestre' | 'semestre'>(year?.periode_type ?? 'trimestre');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (dateEnd <= dateStart) { setError('date_end doit être après date_start'); return; }
    try {
      await upsert.mutateAsync({
        id: year?.id, school_id: schoolId, name,
        date_start: dateStart, date_end: dateEnd, periode_type: periodeType,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{year ? 'Éditer' : 'Nouvelle'} année scolaire</h2>
          <button type="button" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Date début</label>
              <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Date fin</label>
              <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Type de période</label>
            <div className="mt-1 flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" checked={periodeType === 'trimestre'} onChange={() => setPeriodeType('trimestre')} />
                Trimestres (T1/T2/T3)
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={periodeType === 'semestre'} onChange={() => setPeriodeType('semestre')} />
                Semestres (S1/S2)
              </label>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={upsert.isPending}>{upsert.isPending ? 'Enregistrement…' : 'Enregistrer'}</Button>
        </div>
      </form>
    </div>
  );
}
