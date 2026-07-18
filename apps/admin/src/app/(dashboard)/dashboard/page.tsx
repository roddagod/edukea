'use client';

import { useRouter } from 'next/navigation';
import { Building2, Users, GraduationCap, School, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats, useRecentSchools } from '@/hooks/useDashboardStats';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentSchools = [], isLoading: schoolsLoading } = useRecentSchools();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Administration Edukea</h1>
        <p className="text-muted-foreground">Vue globale de la plateforme</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Building2}
          label="Etablissements"
          value={stats?.schools}
          isLoading={statsLoading}
          color="blue"
        />
        <StatCard
          icon={Users}
          label="Parents inscrits"
          value={stats?.parents}
          isLoading={statsLoading}
          color="green"
        />
        <StatCard
          icon={GraduationCap}
          label="Eleves totaux"
          value={stats?.students}
          isLoading={statsLoading}
          color="primary"
        />
        <StatCard
          icon={School}
          label="Classes"
          value={stats?.classrooms}
          isLoading={statsLoading}
          color="purple"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Etablissements recents</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/schools')}>
              Voir tout
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {schoolsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentSchools.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucun etablissement pour le moment
              </p>
            ) : (
              <div className="space-y-3">
                {recentSchools.map((school) => (
                  <div
                    key={school.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/dashboard/schools/${school.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                        <Building2 className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{school.name}</p>
                        <p className="text-xs text-muted-foreground">{school.email || '-'}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => router.push('/dashboard/schools')}
            >
              <Building2 className="h-4 w-4" />
              Gerer les etablissements
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => router.push('/dashboard/users')}
            >
              <Users className="h-4 w-4" />
              Gerer les utilisateurs
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => router.push('/dashboard/settings')}
            >
              <Building2 className="h-4 w-4" />
              Configuration
            </Button>
          </CardContent>
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
  color,
}: {
  icon: any;
  label: string;
  value: number | undefined;
  isLoading: boolean;
  color: 'blue' | 'green' | 'primary' | 'purple';
}) {
  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    green: { bg: 'bg-green-50', text: 'text-green-600' },
    primary: { bg: 'bg-primary-light', text: 'text-primary' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
  };
  const c = colorMap[color];

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${c.bg}`}>
          <Icon className={`h-6 w-6 ${c.text}`} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-2xl font-bold">{value ?? 0}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
