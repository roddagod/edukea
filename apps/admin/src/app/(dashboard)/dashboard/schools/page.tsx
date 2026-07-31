'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ExternalLink,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Plus,
} from 'lucide-react';
import { useSchools, useDeleteSchool } from '@/hooks/useSchools';
import { DataTable, type Column } from '@/components/data-table';
import { Badge, Button, Modal, PageHeader } from '@edukea/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-ink">{school.name}</p>
            {school.slogan && <p className="text-xs text-ink-3">{school.slogan}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (school) => (
        <span className="text-sm text-ink-3">{school.email || '-'}</span>
      ),
    },
    {
      key: 'phone',
      header: 'Telephone',
      render: (school) => (
        <span className="text-sm text-ink-3">{school.phone || '-'}</span>
      ),
    },
    {
      key: 'adress',
      header: 'Adresse',
      render: (school) => (
        <span className="text-sm text-ink-3">{school.adress || '-'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (school) => (
        <Badge tone={school.deleted_at ? 'danger' : 'accent'}>
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
            <button
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink-3 hover:bg-line-soft hover:text-ink"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/dashboard/schools/${school.id}`);
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/dashboard/schools/${school.id}?edit=true`);
              }}
            >
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
                  'noopener,noreferrer',
                );
              }}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Ouvrir console ecole
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(school);
              }}
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
      <PageHeader
        title="Etablissements"
        sub="Gestion des etablissements de la plateforme"
        actions={
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Nouveau
          </Button>
        }
      />

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

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer l'etablissement"
        description={`Etes-vous sur de vouloir supprimer "${deleteTarget?.name}" ? Cette action est irreversible.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleteSchool.isPending}
            >
              {deleteSchool.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </>
        }
      >
        <span />
      </Modal>
    </div>
  );
}
