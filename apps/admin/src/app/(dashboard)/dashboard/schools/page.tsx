'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ExternalLink, MoreHorizontal, Eye, Pencil, Trash2, Plus } from 'lucide-react';
import { useSchools, useDeleteSchool } from '@/hooks/useSchools';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreateSchoolWizard } from './_components/CreateSchoolWizard';
import type { Tables } from '@edukea/shared';

type School = Tables<'schools'>;

export default function SchoolsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<School | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: schools = [], isLoading, refetch } = useSchools(search);
  const deleteSchool = useDeleteSchool();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteSchool.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const columns: Column<School>[] = [
    {
      key: 'name',
      header: 'Nom',
      render: (school) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="font-medium">{school.name}</p>
            {school.slogan && <p className="text-xs text-muted-foreground">{school.slogan}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (school) => (
        <span className="text-sm text-muted-foreground">{school.email || '-'}</span>
      ),
    },
    {
      key: 'phone',
      header: 'Telephone',
      render: (school) => (
        <span className="text-sm text-muted-foreground">{school.phone || '-'}</span>
      ),
    },
    {
      key: 'adress',
      header: 'Adresse',
      render: (school) => (
        <span className="text-sm text-muted-foreground">{school.adress || '-'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (school) => (
        <Badge variant={school.deleted_at ? 'destructive' : 'default'}>
          {school.deleted_at ? 'Supprime' : 'Actif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (school) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/schools/${school.id}`); }}>
              <Eye className="mr-2 h-4 w-4" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/schools/${school.id}?edit=true`); }}>
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                window.open(
                  `${process.env.NEXT_PUBLIC_SCHOOL_APP_URL || 'http://localhost:4002'}/dashboard?school=${school.id}`,
                  '_blank',
                  'noopener,noreferrer'
                );
              }}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Ouvrir console ecole
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(school); }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Etablissements</h1>
          <p className="text-muted-foreground">Gestion des etablissements de la plateforme</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={schools}
        isLoading={isLoading}
        searchPlaceholder="Rechercher un etablissement..."
        onSearch={setSearch}
        searchValue={search}
        onRowClick={(school) => router.push(`/dashboard/schools/${school.id}`)}
        emptyMessage="Aucun etablissement trouve"
        getRowKey={(school) => school.id}
      />

      <CreateSchoolWizard
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => refetch()}
      />

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;etablissement</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir supprimer &quot;{deleteTarget?.name}&quot; ?
              Cette action est irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteSchool.isPending}
            >
              {deleteSchool.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
