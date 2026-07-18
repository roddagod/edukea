'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  School,
  Building2,
  Layers,
  Calendar,
  GraduationCap,
} from 'lucide-react';
import { useClassroom, useClassroomStudents } from '@/hooks/useClassrooms';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatCurrency } from '@edukea/shared';

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classroomId = params.id as string;

  const { data: classroom, isLoading } = useClassroom(classroomId);
  const { data: students = [], isLoading: studentsLoading } = useClassroomStudents(classroomId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <p className="text-center text-muted-foreground">Classe non trouvee</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/classes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
            <School className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{classroom.name}</h1>
            <p className="text-sm text-muted-foreground">{classroom.school_name}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Etablissement</p>
              <p className="text-sm font-medium">{classroom.school_name || '-'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Niveau</p>
              <p className="text-sm font-medium">{classroom.level_name || '-'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Annee scolaire</p>
              <p className="text-sm font-medium">{classroom.school_year_name || '-'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Eleves inscrits ({students.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studentsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : students.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucun eleve inscrit</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Sexe</TableHead>
                  <TableHead>Scolarite</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/students/${s.student_id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{s.lastname} {s.firstname}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.matricule || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{s.sex === 'M' ? 'M' : s.sex === 'F' ? 'F' : '-'}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatCurrency(s.school_fees_paid)} / {formatCurrency(s.school_fees_total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.paiement_status === '3' ? 'default' : s.paiement_status === '2' ? 'warning' : 'secondary'}>
                        {s.paiement_status === '3' ? 'Solde' : s.paiement_status === '2' ? 'En cours' : 'Initial'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
