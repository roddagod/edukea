'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Building2, ChevronRight } from 'lucide-react';
import { useSchoolYears, type SchoolYearWithDetails } from '@/hooks/useSchoolYears';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

function getYearStatus(sy: SchoolYearWithDetails): { label: string; variant: 'default' | 'secondary' | 'outline' } {
  const now = new Date();
  const start = sy.date_start ? new Date(sy.date_start) : null;
  const end = sy.date_end ? new Date(sy.date_end) : null;
  if (start && end && now >= start && now <= end) return { label: 'En cours', variant: 'default' };
  if (end && now > end) return { label: 'Terminee', variant: 'secondary' };
  return { label: 'A venir', variant: 'outline' };
}

export default function VieScolairePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data: schoolYears = [], isLoading } = useSchoolYears(search);

  // Group by school
  const grouped = schoolYears.reduce<Record<string, { school_name: string; years: SchoolYearWithDetails[] }>>((acc, sy) => {
    const key = sy.school_id ?? 'unknown';
    if (!acc[key]) acc[key] = { school_name: sy.school_name || 'Inconnu', years: [] };
    acc[key].years.push(sy);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vie scolaire</h1>
        <p className="text-muted-foreground">Selectionnez une annee scolaire pour acceder aux classes et eleves</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Rechercher par annee ou etablissement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Aucune annee scolaire trouvee
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([schoolId, group]) => (
            <Card key={schoolId}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <CardTitle className="text-base">{group.school_name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {group.years.map((sy) => {
                  const status = getYearStatus(sy);
                  return (
                    <div
                      key={sy.id}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/vie-scolaire/${sy.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{sy.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {sy.date_start ? new Date(sy.date_start).toLocaleDateString('fr-FR') : '?'}
                            {' - '}
                            {sy.date_end ? new Date(sy.date_end).toLocaleDateString('fr-FR') : '?'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
