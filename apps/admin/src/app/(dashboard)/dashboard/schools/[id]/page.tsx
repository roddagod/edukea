'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Users,
  GraduationCap,
  School,
  Save,
  Pencil,
  UserCheck,
} from 'lucide-react';
import { useSchool, useSchoolStats, useUpdateSchool } from '@/hooks/useSchools';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function SchoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const schoolId = params.id as string;

  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [form, setForm] = useState({ name: '', email: '', phone: '', adress: '', slogan: '', bp: '' });

  const { data: school, isLoading } = useSchool(schoolId);
  const { data: stats } = useSchoolStats(schoolId);
  const updateSchool = useUpdateSchool();

  useEffect(() => {
    if (school) {
      setForm({
        name: school.name ?? '',
        email: school.email ?? '',
        phone: school.phone ?? '',
        adress: school.adress ?? '',
        slogan: school.slogan ?? '',
        bp: school.bp ?? '',
      });
    }
  }, [school]);

  const handleSave = async () => {
    await updateSchool.mutateAsync({ id: schoolId, ...form });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <p className="text-center text-muted-foreground">Etablissement non trouve</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/schools')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{school.name}</h1>
              {school.slogan && <p className="text-sm text-muted-foreground">{school.slogan}</p>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={`${process.env.NEXT_PUBLIC_SCHOOL_APP_URL || 'http://localhost:4002'}/dashboard?school=${schoolId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            <ExternalLink className="h-4 w-4" />
            Ouvrir la console ecole
          </a>
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={updateSchool.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateSchool.isPending ? 'Enregistrement...' : 'Enregistrer'}
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <GraduationCap className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Eleves</p>
              <p className="text-2xl font-bold">{stats?.students ?? '-'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
              <School className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Classes</p>
              <p className="text-2xl font-bold">{stats?.classrooms ?? '-'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
              <UserCheck className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Parents inscrits</p>
              <p className="text-2xl font-bold">{stats?.parents ?? '-'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Familles</p>
              <p className="text-2xl font-bold">{stats?.families ?? '-'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Slogan</Label>
                <Input value={form.slogan} onChange={(e) => setForm({ ...form, slogan: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Telephone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Adresse</Label>
                <Input value={form.adress} onChange={(e) => setForm({ ...form, adress: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Boite postale</Label>
                <Input value={form.bp} onChange={(e) => setForm({ ...form, bp: e.target.value })} />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow icon={Mail} label="Email" value={school.email} />
              <InfoRow icon={Phone} label="Telephone" value={school.phone} />
              <InfoRow icon={MapPin} label="Adresse" value={school.adress} />
              <InfoRow icon={MapPin} label="Boite postale" value={school.bp} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || '-'}</p>
      </div>
    </div>
  );
}
