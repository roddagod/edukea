'use client';

import { useState } from 'react';
import { useSchoolYears, useDeleteSchoolYear, type SchoolYear } from '@edukea/shared';
import { Button, Badge, Skeleton } from '@edukea/ui';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { SchoolYearFormDialog } from './SchoolYearFormDialog';

interface Props { schoolId: string; }

function isActive(y: SchoolYear): boolean {
  if (!y.date_start || !y.date_end) return false;
  const today = new Date().toISOString().slice(0, 10);
  return y.date_start <= today && today <= y.date_end;
}

export function SchoolYearList({ schoolId }: Props) {
  const { data: years, isLoading } = useSchoolYears(schoolId);
  const deleteYear = useDeleteSchoolYear();
  const [editing, setEditing] = useState<SchoolYear | null>(null);
  const [creating, setCreating] = useState(false);

  if (isLoading) return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <Button onClick={() => setCreating(true)}>
        <Plus className="mr-2 h-4 w-4" /> Nouvelle année
      </Button>

      <div className="space-y-2">
        {(years ?? []).map((y) => (
          <div key={y.id} className="flex items-center gap-4 rounded-xl border bg-white p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-slate-900">{y.name}</p>
                {isActive(y) && <Badge>Active</Badge>}
                <span className="text-xs text-slate-500">
                  {y.periode_type ?? '—'} · {y.date_start ?? '?'} → {y.date_end ?? '?'}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setEditing(y)}><Pencil className="h-4 w-4" /></Button>
            <Button
              variant="ghost" size="sm"
              onClick={() => {
                if (confirm(`Supprimer ${y.name} ? (soft-delete)`)) {
                  deleteYear.mutate({ id: y.id, schoolId });
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
        {years?.length === 0 && (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">
            Aucune année scolaire configurée. Créez-en une pour commencer.
          </p>
        )}
      </div>

      {(editing || creating) && (
        <SchoolYearFormDialog
          schoolId={schoolId}
          year={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      )}
    </div>
  );
}
