'use client';

import { useState } from 'react';
import { useSchoolStaff, type SchoolStaffRow } from '@edukea/shared';
import { Modal, Button, Input, Badge } from '@edukea/ui';
import { Plus, Trash2, Key } from 'lucide-react';
import {
  createStaffUser,
  deleteStaffUser,
  resetStaffPassword,
} from '../_actions';

interface Props {
  schoolId: string;
}

const ROLE_LABEL: Record<string, string> = {
  manager: 'Manager',
  director: 'Directeur',
  censor: 'Censeur',
};

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pw = '';
  for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

// ---------------------------------------------------------------------------
// CreateStaffDialog
// ---------------------------------------------------------------------------

function CreateStaffDialog({
  schoolId,
  onClose,
  onCreated,
}: {
  schoolId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'manager' | 'director' | 'censor'>('director');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!email || !password || !displayName) {
      setError('Tous les champs sont requis');
      return;
    }
    if (password.length < 8) {
      setError('Mot de passe : 8 caracteres minimum');
      return;
    }
    setSaving(true);
    const res = await createStaffUser({ email, password, role, displayName, schoolId });
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? 'Erreur');
      return;
    }
    onCreated();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Nouveau compte staff"
      description="Le mot de passe temporaire sera a transmettre en main propre a l'utilisateur."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-md bg-[#E97423] px-4 py-2 text-sm font-medium text-white hover:bg-[#c9621d] disabled:opacity-50"
          >
            {saving ? 'Creation…' : 'Creer le compte'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Nom d'affichage"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="ex: Jean KOFFI"
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ex: jean.koffi@ecole.ci"
        />
        <div>
          <label className="text-body-xs font-semibold text-ink-2">Mot de passe temporaire</label>
          <div className="mt-1.5 flex gap-2">
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8 caracteres min"
            />
            <button
              type="button"
              onClick={() => setPassword(generateTempPassword())}
              className="shrink-0 rounded border border-slate-200 px-3 text-sm hover:bg-slate-50"
            >
              Generer
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Notez-le et transmettez-le au user. Il pourra le changer a sa 1re connexion.
          </p>
        </div>
        <div>
          <label className="text-body-xs font-semibold text-ink-2">Role</label>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {(['manager', 'director', 'censor'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                  role === r
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {ROLE_LABEL[r]}
              </button>
            ))}
          </div>
        </div>
        {error && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// ResetPasswordDialog
// ---------------------------------------------------------------------------

function ResetPasswordDialog({
  userId,
  displayName,
  onClose,
}: {
  userId: string;
  displayName: string;
  onClose: () => void;
}) {
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (newPassword.length < 8) {
      setError('8 caracteres minimum');
      return;
    }
    setSaving(true);
    const res = await resetStaffPassword({ userId, newPassword });
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? 'Erreur');
      return;
    }
    alert(
      `Nouveau mot de passe defini pour ${displayName} :\n${newPassword}\n\nNotez-le et transmettez-le.`,
    );
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Reinitialiser le mot de passe — ${displayName}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-md bg-[#E97423] px-4 py-2 text-sm font-medium text-white hover:bg-[#c9621d] disabled:opacity-50"
          >
            {saving ? 'Enregistrement…' : 'Reinitialiser'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-body-xs font-semibold text-ink-2">Nouveau mot de passe</label>
          <div className="mt-1.5 flex gap-2">
            <Input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="8 caracteres min"
            />
            <button
              type="button"
              onClick={() => setNewPassword(generateTempPassword())}
              className="shrink-0 rounded border border-slate-200 px-3 text-sm hover:bg-slate-50"
            >
              Generer
            </button>
          </div>
        </div>
        {error && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// UsersListView
// ---------------------------------------------------------------------------

export function UsersListView({ schoolId }: Props) {
  const { data: staff, isLoading, refetch } = useSchoolStaff(schoolId);

  // Modal state lifted here to avoid nesting modals inside table cells
  const [createOpen, setCreateOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<SchoolStaffRow | null>(null);

  if (isLoading) {
    return <div className="h-64 w-full animate-pulse rounded-xl bg-slate-100" />;
  }

  const rows = staff ?? [];

  const handleDelete = async (s: SchoolStaffRow) => {
    if (
      !confirm(
        `Supprimer ${s.display_name ?? 'ce compte'} ? Le compte Auth sera definitivement efface.`,
      )
    )
      return;
    const res = await deleteStaffUser({ profileId: s.id, userId: s.user_id });
    if (!res.ok) {
      alert(res.error ?? 'Erreur');
      return;
    }
    void refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{rows.length} utilisateur(s)</p>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-[#E97423] px-4 py-2 text-sm font-medium text-white hover:bg-[#c9621d]"
        >
          <Plus className="h-4 w-4" />
          Nouveau compte
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b-2 border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5 text-left">Nom</th>
              <th className="px-4 py-2.5 text-left">Role</th>
              <th className="hidden px-4 py-2.5 text-left md:table-cell">Cree le</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                  Aucun compte staff. Creez le premier avec &quot;Nouveau compte&quot;.
                </td>
              </tr>
            ) : (
              rows.map((s) => (
                <tr
                  key={s.id}
                  className="border-b last:border-none hover:bg-orange-50/50 transition-colors"
                >
                  <td className="px-4 py-2.5 font-medium text-slate-900">
                    {s.display_name ?? '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone="neutral">{ROLE_LABEL[s.role] ?? s.role}</Badge>
                  </td>
                  <td className="hidden px-4 py-2.5 text-xs text-slate-500 md:table-cell">
                    {new Intl.DateTimeFormat('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    }).format(new Date(s.created_at))}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex gap-1">
                      <button
                        onClick={() => setResetTarget(s)}
                        title="Reinitialiser mot de passe"
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        title="Supprimer"
                        className="rounded p-1.5 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {createOpen && (
        <CreateStaffDialog
          schoolId={schoolId}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            void refetch();
          }}
        />
      )}

      {resetTarget && (
        <ResetPasswordDialog
          userId={resetTarget.user_id}
          displayName={resetTarget.display_name ?? '—'}
          onClose={() => setResetTarget(null)}
        />
      )}
    </div>
  );
}
