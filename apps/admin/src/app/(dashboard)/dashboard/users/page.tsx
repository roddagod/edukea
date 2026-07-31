'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Eye, Trash2, Plus, Pencil, UserPlus } from 'lucide-react';
import { useParents, useDeleteParent, useInviteParent, type ParentWithDetails } from '@/hooks/useParents';
import { useSchools } from '@/hooks/useSchools';
import { DataTable, type Column } from '@/components/data-table';
import { Badge, Button, Input, Modal, Avatar, PageHeader } from '@edukea/ui';
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

const emptyInvite = { email: '', school_id: '', phone: '' };

export default function UsersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ParentWithDetails | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState(emptyInvite);
  const [inviteResult, setInviteResult] = useState<{ email: string; temporary_password: string } | null>(null);
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
    } catch (err: unknown) {
      setInviteError(
        err instanceof Error ? err.message : "Erreur lors de l'invitation",
      );
    }
  };

  const closeInvite = () => {
    setShowInvite(false);
    setInviteForm(emptyInvite);
    setInviteResult(null);
    setInviteError('');
  };

  const initials = (parent: ParentWithDetails) =>
    (parent.phone || 'P')[0].toUpperCase();

  const columns: Column<ParentWithDetails>[] = [
    {
      key: 'user',
      header: 'Utilisateur',
      render: (parent) => (
        <div className="flex items-center gap-3">
          <Avatar initials={initials(parent)} tone="green" size="md" />
          <div>
            <p className="font-medium text-ink">{parent.phone || 'Sans telephone'}</p>
            <p className="text-xs text-ink-3">ID: {parent.user_id.slice(0, 8)}...</p>
          </div>
        </div>
      ),
    },
    {
      key: 'school_name',
      header: 'Etablissement',
      render: (parent) => (
        <Badge tone="neutral">{parent.school_name || '-'}</Badge>
      ),
    },
    {
      key: 'push_token',
      header: 'Notifications',
      render: (parent) => (
        <Badge tone={parent.push_token ? 'accent' : 'neutral'}>
          {parent.push_token ? 'Active' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Inscription',
      render: (parent) => (
        <span className="text-sm text-ink-3">
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
                router.push(`/dashboard/users/${parent.id}`);
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/dashboard/users/${parent.id}?edit=true`);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(parent);
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
        title="Utilisateurs"
        sub="Gestion des comptes parents de la plateforme"
        actions={
          <Button variant="primary" onClick={() => setShowInvite(true)}>
            <UserPlus className="h-4 w-4" />
            Inviter un parent
          </Button>
        }
      />

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

      {/* Invite Modal */}
      <Modal
        open={showInvite}
        onClose={closeInvite}
        title="Inviter un parent"
        description="Un compte sera cree et les identifiants seront generes."
        footer={
          inviteResult ? (
            <Button variant="primary" onClick={closeInvite}>
              Fermer
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={closeInvite}>
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleInvite}
                disabled={inviteParent.isPending || !inviteForm.email || !inviteForm.school_id}
              >
                {inviteParent.isPending ? 'Invitation...' : 'Inviter'}
              </Button>
            </>
          )
        }
      >
        {inviteResult ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-success/30 bg-success/5 p-4 space-y-2">
              <p className="text-sm font-semibold text-success">Compte cree avec succes</p>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-ink-3">Email :</span> {inviteResult.email}
                </p>
                <p>
                  <span className="text-ink-3">Mot de passe :</span>{' '}
                  <code className="rounded bg-white px-2 py-0.5 text-sm font-mono border border-line">
                    {inviteResult.temporary_password}
                  </code>
                </p>
              </div>
              <p className="text-xs text-success/80 mt-2">
                Partagez ces identifiants de maniere securisee.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {inviteError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {inviteError}
              </div>
            )}
            <Input
              label="Email *"
              type="email"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              placeholder="parent@email.com"
            />
            <div>
              <p className="mb-1.5 text-body-xs font-semibold text-ink-2">Etablissement *</p>
              <Select
                value={inviteForm.school_id}
                onValueChange={(v) => setInviteForm({ ...inviteForm, school_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un etablissement" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              label="Telephone"
              value={inviteForm.phone}
              onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
              placeholder="+225 07 XX XX XX XX"
            />
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer l'utilisateur"
        description="Etes-vous sur de vouloir supprimer ce profil parent ? L'utilisateur ne pourra plus acceder a la plateforme."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleteParent.isPending}
            >
              {deleteParent.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </>
        }
      >
        <span />
      </Modal>
    </div>
  );
}
