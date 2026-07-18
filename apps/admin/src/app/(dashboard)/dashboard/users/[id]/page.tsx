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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

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
        <p className="text-center text-muted-foreground">Utilisateur non trouve</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/users')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Detail utilisateur</h1>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Annuler</Button>
              <Button onClick={handleSave} disabled={updateParent.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateParent.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-green-50 text-green-600 text-2xl">
                {(parent.phone || 'P')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="font-semibold">{parent.phone || 'Sans telephone'}</p>
              <p className="text-sm text-muted-foreground">ID: {parent.user_id.slice(0, 12)}...</p>
            </div>
            <Badge variant={parent.push_token ? 'default' : 'secondary'}>
              <Bell className="mr-1.5 h-3 w-3" />
              {parent.push_token ? 'Notifications actives' : 'Notifications inactives'}
            </Badge>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Telephone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Etablissement</Label>
                  <Input value={parent.school_name || '-'} disabled />
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Liens familiaux</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <FamilyLink label="Pere" id={parent.father_id} />
            <FamilyLink label="Mere" id={parent.mother_id} />
            <FamilyLink label="Tuteur" id={parent.tutor_id} />
          </div>
          {parent.student_id && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-1">Eleve associe</p>
              <p className="text-sm font-medium">{parent.student_id.slice(0, 12)}...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function FamilyLink({ label, id }: { label: string; id: string | null }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">
        {id ? `${id.slice(0, 12)}...` : 'Non renseigne'}
      </p>
      {id && (
        <Badge variant="outline" className="mt-2 text-xs">
          <Users className="mr-1 h-3 w-3" />
          Lie
        </Badge>
      )}
    </div>
  );
}
