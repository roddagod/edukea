'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Eye, Trash2, Plus, Pencil, UserPlus } from 'lucide-react';
import { useParents, useDeleteParent, useInviteParent, type ParentWithDetails } from '@/hooks/useParents';
import { useSchools } from '@/hooks/useSchools';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const emptyInvite = { email: '', school_id: '', phone: '' };

export default function UsersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ParentWithDetails | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState(emptyInvite);
  const [inviteResult, setInviteResult] = useState<any>(null);
  const [inviteError, setInviteError] = useState('');

  const { data: parents = [], isLoading } = useParents(search);
  const { data: schools = [] } = useSchools();
  const deleteParent = useDeleteParent();
  const inviteParent = useInviteParent();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteParent.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleInvite = async () => {
    if (!inviteForm.email || !inviteForm.school_id) return;
    setInviteError('');
    setInviteResult(null);
    try {
      const result = await inviteParent.mutateAsync(inviteForm);
      setInviteResult(result);
    } catch (err: any) {
      setInviteError(err.message || 'Erreur lors de l\'invitation');
    }
  };

  const closeInvite = () => {
    setShowInvite(false);
    setInviteForm(emptyInvite);
    setInviteResult(null);
    setInviteError('');
  };

  const columns: Column<ParentWithDetails>[] = [
    {
      key: 'user',
      header: 'Utilisateur',
      render: (parent) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-green-50 text-green-600 text-xs">
              {(parent.phone || 'P')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{parent.phone || 'Sans telephone'}</p>
            <p className="text-xs text-muted-foreground">ID: {parent.user_id.slice(0, 8)}...</p>
          </div>
        </div>
      ),
    },
    {
      key: 'school_name',
      header: 'Etablissement',
      render: (parent) => (
        <Badge variant="outline">{parent.school_name || '-'}</Badge>
      ),
    },
    {
      key: 'push_token',
      header: 'Notifications',
      render: (parent) => (
        <Badge variant={parent.push_token ? 'default' : 'secondary'}>
          {parent.push_token ? 'Active' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Inscription',
      render: (parent) => (
        <span className="text-sm text-muted-foreground">
          {new Date(parent.created_at).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (parent) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/users/${parent.id}`); }}>
              <Eye className="mr-2 h-4 w-4" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/users/${parent.id}?edit=true`); }}>
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(parent); }}
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
          <h1 className="text-2xl font-bold">Utilisateurs</h1>
          <p className="text-muted-foreground">Gestion des comptes parents de la plateforme</p>
        </div>
        <Button onClick={() => setShowInvite(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Inviter un parent
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={parents}
        isLoading={isLoading}
        searchPlaceholder="Rechercher par telephone ou etablissement..."
        onSearch={setSearch}
        searchValue={search}
        onRowClick={(parent) => router.push(`/dashboard/users/${parent.id}`)}
        emptyMessage="Aucun utilisateur trouve"
        getRowKey={(parent) => parent.id}
      />

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={closeInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inviter un parent</DialogTitle>
            <DialogDescription>
              Un compte sera cree et les identifiants seront generes.
            </DialogDescription>
          </DialogHeader>

          {inviteResult ? (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
                <p className="text-sm font-medium text-green-800">Compte cree avec succes</p>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Email :</span> {inviteResult.email}</p>
                  <p><span className="text-muted-foreground">Mot de passe :</span> <code className="bg-white px-2 py-0.5 rounded text-sm font-mono">{inviteResult.temporary_password}</code></p>
                </div>
                <p className="text-xs text-green-700 mt-2">Partagez ces identifiants de maniere securisee.</p>
              </div>
              <DialogFooter>
                <Button onClick={closeInvite}>Fermer</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              {inviteError && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                  {inviteError}
                </div>
              )}
              <div className="grid gap-4 py-2">
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="parent@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Etablissement *</Label>
                  <Select
                    value={inviteForm.school_id}
                    onValueChange={(v) => setInviteForm({ ...inviteForm, school_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un etablissement" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Telephone</Label>
                  <Input
                    value={inviteForm.phone}
                    onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeInvite}>Annuler</Button>
                <Button
                  onClick={handleInvite}
                  disabled={inviteParent.isPending || !inviteForm.email || !inviteForm.school_id}
                >
                  {inviteParent.isPending ? 'Invitation...' : 'Inviter'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;utilisateur</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir supprimer ce profil parent ?
              L&apos;utilisateur ne pourra plus acceder a la plateforme.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteParent.isPending}
            >
              {deleteParent.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
