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

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{years?.length ?? 0} année(s) scolaire(s)</p>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nouvelle année
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left font-medium text-slate-600">Nom</th>
              <th className="hidden px-4 py-3 text-left font-medium text-slate-600 md:table-cell">Type</th>
              <th className="hidden px-4 py-3 text-left font-medium text-slate-600 sm:table-cell">Début</th>
              <th className="hidden px-4 py-3 text-left font-medium text-slate-600 sm:table-cell">Fin</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Statut</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(years ?? []).map((y, i) => (
              <tr
                key={y.id}
                className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}`}
              >
                <td className="max-w-[160px] truncate px-4 py-3 font-medium text-slate-900">{y.name}</td>
                <td className="hidden px-4 py-3 text-slate-500 md:table-cell">{y.periode_type ?? '—'}</td>
                <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">{y.date_start ?? '—'}</td>
                <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">{y.date_end ?? '—'}</td>
                <td className="px-4 py-3">
                  {isActive(y) ? <Badge>Active</Badge> : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(y)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Supprimer ${y.name} ? (soft-delete)`)) {
                          deleteYear.mutate({ id: y.id, schoolId });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {(years?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Aucune année scolaire configurée. Créez-en une pour commencer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
