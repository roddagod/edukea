'use client';

import { useRouter } from 'next/navigation';
import { Building2, Users, GraduationCap, School, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, Button, Skeleton, PageHeader } from '@edukea/ui';
import { useDashboardStats, useRecentSchools } from '@/hooks/useDashboardStats';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentSchools = [], isLoading: schoolsLoading } = useRecentSchools();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration Edukea"
        sub="Vue globale de la plateforme"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Building2}
          label="Etablissements"
          value={stats?.schools}
          isLoading={statsLoading}
          tone="primary"
        />
        <StatCard
          icon={Users}
          label="Parents inscrits"
          value={stats?.parents}
          isLoading={statsLoading}
          tone="accent"
        />
        <StatCard
          icon={GraduationCap}
          label="Eleves totaux"
          value={stats?.students}
          isLoading={statsLoading}
          tone="primary"
        />
        <StatCard
          icon={School}
          label="Classes"
          value={stats?.classrooms}
          isLoading={statsLoading}
          tone="neutral"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Etablissements recents</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/schools')}
            >
              Voir tout
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          {schoolsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentSchools.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-3">
              Aucun etablissement pour le moment
            </p>
          ) : (
            <div className="space-y-3">
              {recentSchools.map((school) => (
                <div
                  key={school.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-line p-3 transition-colors hover:bg-line-soft"
                  onClick={() => router.push(`/dashboard/schools/${school.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{school.name}</p>
                      <p className="text-xs text-ink-3">{school.email || '-'}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-ink-3" />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions rapides</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <Button
              variant="secondary"
              className="w-full justify-start gap-3"
              onClick={() => router.push('/dashboard/schools')}
            >
              <Building2 className="h-4 w-4" />
              Gerer les etablissements
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start gap-3"
              onClick={() => router.push('/dashboard/users')}
            >
              <Users className="h-4 w-4" />
              Gerer les utilisateurs
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start gap-3"
              onClick={() => router.push('/dashboard/settings')}
            >
              <Building2 className="h-4 w-4" />
              Configuration
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  isLoading,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | undefined;
  isLoading: boolean;
  tone: 'primary' | 'accent' | 'neutral';
}) {
  const toneMap = {
    primary: { bg: 'bg-primary-light', text: 'text-primary' },
    accent: { bg: 'bg-brand-accent-soft', text: 'text-brand-accent' },
    neutral: { bg: 'bg-line-soft', text: 'text-ink-2' },
  };
  const c = toneMap[tone];

  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${c.bg}`}>
          <Icon className={`h-6 w-6 ${c.text}`} />
        </div>
        <div>
          <p className="text-sm text-ink-3">{label}</p>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-2xl font-bold text-ink">{value ?? 0}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
