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
      <Button onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" /> Ajouter un type</Button>
      <div className="space-y-2">
        {(types ?? []).map((t) => (
          <div key={t.id} className="flex items-center gap-3 rounded-xl border bg-white p-4">
            {t.is_default && <Star className="h-4 w-4 fill-orange-400 text-orange-400" />}
            <div className="flex-1">
              <p className="font-medium text-slate-900">{t.label}</p>
              <p className="text-xs text-slate-500">code: <code>{t.code}</code></p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setEditing(t)}><Pencil className="h-4 w-4" /></Button>
            <Button
              variant="ghost" size="sm"
              onClick={async () => {
                if (!confirm(`Supprimer ${t.label} ?`)) return;
                try { await del.mutateAsync({ id: t.id, schoolId }); }
                catch (e) { alert(e instanceof Error ? e.message : 'Erreur'); }
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
      </div>
      {(editing || creating) && (
        <StudentTypeFormDialog
          schoolId={schoolId} type={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      )}
    </div>
  );
}
