'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Calendar,
  School,
  ChevronRight,
  GraduationCap,
  Users,
} from 'lucide-react';
import { useSchoolYear } from '@/hooks/useSchoolYears';
import { useClassroomsByYear } from '@/hooks/useClassrooms';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function SchoolYearDetailPage() {
  const params = useParams();
  const router = useRouter();
  const yearId = params.yearId as string;

  const { data: year, isLoading: yearLoading } = useSchoolYear(yearId);
  const { data: classrooms = [], isLoading: classroomsLoading } = useClassroomsByYear(yearId);

  // Group classrooms by level
  const grouped = classrooms.reduce<Record<string, typeof classrooms>>((acc, c) => {
    const level = c.level_name || 'Autre';
    if (!acc[level]) acc[level] = [];
    acc[level].push(c);
    return acc;
  }, {});

  if (yearLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!year) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard/vie-scolaire')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <p className="text-center text-muted-foreground">Annee scolaire non trouvee</p>
      </div>
    );
  }

  const now = new Date();
  const start = year.date_start ? new Date(year.date_start) : null;
  const end = year.date_end ? new Date(year.date_end) : null;
  const isActive = start && end && now >= start && now <= end;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => router.push('/dashboard/vie-scolaire')} className="hover:text-foreground transition-colors">
          Vie scolaire
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{year.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/vie-scolaire')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{year.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{year.school_name}</span>
              {isActive && <Badge variant="default" className="ml-1">En cours</Badge>}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
              <School className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Classes</p>
              <p className="text-xl font-bold">{classrooms.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Debut</p>
              <p className="text-sm font-medium">{start ? start.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fin</p>
              <p className="text-sm font-medium">{end ? end.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes by level */}
      {classroomsLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : classrooms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Aucune classe pour cette annee scolaire
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([level, classes]) => (
            <Card key={level}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {level}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {classes.map((classroom) => (
                  <div
                    key={classroom.id}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/dashboard/vie-scolaire/${yearId}/${classroom.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                        <School className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{classroom.name}</p>
                        <p className="text-xs text-muted-foreground">{level}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
