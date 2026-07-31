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
import { Button, Input, Card, CardHeader, CardTitle, Skeleton, PageHeader } from '@edukea/ui';

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
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
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
        <p className="text-center text-ink-3">Etablissement non trouve</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/schools')}
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink-3 hover:bg-line-soft hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <span className="font-display text-heading-lg font-semibold text-ink">
                  {school.name}
                </span>
                {school.slogan && (
                  <p className="text-sm text-ink-3">{school.slogan}</p>
                )}
              </div>
            </div>
          </div>
        }
        actions={
          <div className="flex gap-2">
            <a
              href={`${process.env.NEXT_PUBLIC_SCHOOL_APP_URL || 'http://localhost:4002'}/dashboard?school=${schoolId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-[#E97423] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c9621d] transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Ouvrir la console ecole
            </a>
            {isEditing ? (
              <>
                <Button variant="secondary" onClick={() => setIsEditing(false)}>
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={updateSchool.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateSchool.isPending ? 'Enregistrement...' : 'Enregistrer'}
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-ink-3">Eleves</p>
              <p className="text-2xl font-bold text-ink">{stats?.students ?? '-'}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-accent-soft">
              <School className="h-6 w-6 text-brand-accent" />
            </div>
            <div>
              <p className="text-sm text-ink-3">Classes</p>
              <p className="text-2xl font-bold text-ink">{stats?.classrooms ?? '-'}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-line-soft">
              <UserCheck className="h-6 w-6 text-ink-2" />
            </div>
            <div>
              <p className="text-sm text-ink-3">Parents inscrits</p>
              <p className="text-2xl font-bold text-ink">{stats?.parents ?? '-'}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-ink-3">Familles</p>
              <p className="text-2xl font-bold text-ink">{stats?.families ?? '-'}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        {isEditing ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Slogan" value={form.slogan} onChange={(e) => setForm({ ...form, slogan: e.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Telephone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Adresse" value={form.adress} onChange={(e) => setForm({ ...form, adress: e.target.value })} />
            <Input label="Boite postale" value={form.bp} onChange={(e) => setForm({ ...form, bp: e.target.value })} />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow icon={Mail} label="Email" value={school.email} />
            <InfoRow icon={Phone} label="Telephone" value={school.phone} />
            <InfoRow icon={MapPin} label="Adresse" value={school.adress} />
            <InfoRow icon={MapPin} label="Boite postale" value={school.bp} />
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
  value: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-ink-3" />
      <div>
        <p className="text-xs text-ink-3">{label}</p>
        <p className="text-sm font-medium text-ink">{value || '-'}</p>
      </div>
    </div>
  );
}
