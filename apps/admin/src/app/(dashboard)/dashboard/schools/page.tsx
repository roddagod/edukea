'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, MoreHorizontal, Eye, Pencil, Trash2, Plus } from 'lucide-react';
import { useSchools, useDeleteSchool, useCreateSchool } from '@/hooks/useSchools';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { Tables } from '@edukea/shared';

type School = Tables<'schools'>;

const emptyForm = { name: '', email: '', phone: '', adress: '', slogan: '', bp: '' };

export default function SchoolsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<School | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);

  const { data: schools = [], isLoading } = useSchools(search);
  const deleteSchool = useDeleteSchool();
  const createSchool = useCreateSchool();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteSchool.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleCreate = async () => {
    if (!createForm.name.trim()) return;
    const id = await createSchool.mutateAsync({
      name: createForm.name.trim(),
      email: createForm.email || undefined,
      phone: createForm.phone || undefined,
      adress: createForm.adress || undefined,
      slogan: createForm.slogan || undefined,
      bp: createForm.bp || undefined,
    });
    setShowCreate(false);
    setCreateForm(emptyForm);
    router.push(`/dashboard/schools/${id}`);
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

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel etablissement</DialogTitle>
            <DialogDescription>
              Renseignez les informations de l&apos;etablissement.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Nom de l'etablissement"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="contact@ecole.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Telephone</Label>
                <Input
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="+237 6XX XXX XXX"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={createForm.adress}
                onChange={(e) => setCreateForm({ ...createForm, adress: e.target.value })}
                placeholder="Adresse de l'etablissement"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Slogan</Label>
                <Input
                  value={createForm.slogan}
                  onChange={(e) => setCreateForm({ ...createForm, slogan: e.target.value })}
                  placeholder="Slogan"
                />
              </div>
              <div className="space-y-2">
                <Label>Boite postale</Label>
                <Input
                  value={createForm.bp}
                  onChange={(e) => setCreateForm({ ...createForm, bp: e.target.value })}
                  placeholder="BP XXXX"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setCreateForm(emptyForm); }}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={createSchool.isPending || !createForm.name.trim()}>
              {createSchool.isPending ? 'Creation...' : 'Creer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
