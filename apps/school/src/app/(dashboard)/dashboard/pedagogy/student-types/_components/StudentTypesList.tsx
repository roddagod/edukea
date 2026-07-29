'use client';

import { useState } from 'react';
import { useStudentTypes, useDeleteStudentType, type StudentType } from '@edukea/shared';
import { Button, Skeleton } from '@edukea/ui';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { StudentTypeFormDialog } from './StudentTypeFormDialog';

interface Props { schoolId: string; }

export function StudentTypesList({ schoolId }: Props) {
  const { data: types, isLoading } = useStudentTypes(schoolId);
  const del = useDeleteStudentType();
  const [editing, setEditing] = useState<StudentType | null>(null);
  const [creating, setCreating] = useState(false);

  if (isLoading) return <Skeleton className="h-24 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{types?.length ?? 0} type(s) d&apos;élèves</p>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" /> Ajouter un type
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="w-10 px-4 py-3 text-left font-medium text-slate-600">Défaut</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Libellé</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Code</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Ordre</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(types ?? []).map((t, i) => (
              <tr
                key={t.id}
                className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${i % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}`}
              >
                <td className="px-4 py-3 text-center">
                  {t.is_default && <Star className="h-4 w-4 fill-orange-400 text-orange-400" />}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">{t.label}</td>
                <td className="px-4 py-3">
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{t.code}</code>
                </td>
                <td className="px-4 py-3 text-slate-500">{t.order}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (!confirm(`Supprimer ${t.label} ?`)) return;
                        try { await del.mutateAsync({ id: t.id, schoolId }); }
                        catch (e) { alert(e instanceof Error ? e.message : 'Erreur'); }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {(types?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Aucun type d&apos;élève configuré. Ajoutez-en un pour commencer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(editing || creating) && (
        <StudentTypeFormDialog
          schoolId={schoolId}
          type={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      )}
    </div>
  );
}
