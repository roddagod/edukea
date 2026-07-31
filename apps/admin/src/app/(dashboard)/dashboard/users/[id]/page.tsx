'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  Building2,
  Calendar,
  Bell,
  Users,
  Save,
  Pencil,
} from 'lucide-react';
import { useParent, useUpdateParent } from '@/hooks/useParents';
import { Button, Input, Card, CardHeader, CardTitle, Badge, Avatar, Skeleton, PageHeader } from '@edukea/ui';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentId = params.id as string;

  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [form, setForm] = useState({ phone: '' });

  const { data: parent, isLoading } = useParent(parentId);
  const updateParent = useUpdateParent();

  useEffect(() => {
    if (parent) {
      setForm({ phone: parent.phone || '' });
    }
  }, [parent]);

  const handleSave = async () => {
    await updateParent.mutateAsync({ id: parentId, phone: form.phone || undefined });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!parent) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <p className="text-center text-ink-3">Utilisateur non trouve</p>
      </div>
    );
  }

  const initials = (parent.phone || 'P')[0].toUpperCase();

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/users')}
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink-3 hover:bg-line-soft hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span>Detail utilisateur</span>
          </div>
        }
        actions={
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="secondary" onClick={() => setIsEditing(false)}>
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={updateParent.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateParent.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Modifier
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center gap-4 lg:col-span-1">
          <Avatar initials={initials} tone="green" size="lg" className="h-20 w-20 text-xl" />
          <div className="text-center">
            <p className="font-semibold text-ink">{parent.phone || 'Sans telephone'}</p>
            <p className="text-sm text-ink-3">ID: {parent.user_id.slice(0, 12)}...</p>
          </div>
          <Badge tone={parent.push_token ? 'accent' : 'neutral'}>
            <Bell className="mr-1.5 h-3 w-3" />
            {parent.push_token ? 'Notifications actives' : 'Notifications inactives'}
          </Badge>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          {isEditing ? (
            <div className="space-y-4">
              <Input
                label="Telephone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+225 07 XX XX XX XX"
              />
              <Input
                label="Etablissement"
                value={parent.school_name || '-'}
                disabled
              />
            </div>
          ) : (
            <div className="space-y-4">
              <InfoRow icon={Building2} label="Etablissement" value={parent.school_name || '-'} />
              <InfoRow icon={Phone} label="Telephone" value={parent.phone || '-'} />
              <InfoRow
                icon={Calendar}
                label="Date d'inscription"
                value={new Date(parent.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              />
              <InfoRow
                icon={Calendar}
                label="Derniere mise a jour"
                value={new Date(parent.updated_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              />
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Liens familiaux</CardTitle>
        </CardHeader>
        <div className="grid gap-4 sm:grid-cols-3">
          <FamilyLink label="Pere" id={parent.father_id} />
          <FamilyLink label="Mere" id={parent.mother_id} />
          <FamilyLink label="Tuteur" id={parent.tutor_id} />
        </div>
        {parent.student_id && (
          <div className="mt-4 border-t border-line pt-4">
            <p className="text-xs text-ink-3 mb-1">Eleve associe</p>
            <p className="text-sm font-medium text-ink">{parent.student_id.slice(0, 12)}...</p>
          </div>
        )}
      </Card>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-ink-3" />
      <div>
        <p className="text-xs text-ink-3">{label}</p>
        <p className="text-sm font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}

function FamilyLink({ label, id }: { label: string; id: string | null }) {
  return (
    <div className="rounded-lg border border-line p-3">
      <p className="text-xs text-ink-3">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink">
        {id ? `${id.slice(0, 12)}...` : 'Non renseigne'}
      </p>
      {id && (
        <Badge tone="neutral" className="mt-2 text-xs">
          <Users className="mr-1 h-3 w-3" />
          Lie
        </Badge>
      )}
    </div>
  );
}
