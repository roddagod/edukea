'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  School,
  ChevronRight,
  GraduationCap,
  BookOpen,
  ClipboardList,
  CreditCard,
} from 'lucide-react';
import { useClassroom, useClassroomStudents } from '@/hooks/useClassrooms';
import { useSchoolYear } from '@/hooks/useSchoolYears';
import { useClassroomSubjects, useClassroomEvaluations, useStudentNotes, usePeriodes } from '@/hooks/useClassroomDetails';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@edukea/shared';

export default function ClassroomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const yearId = params.yearId as string;
  const classroomId = params.classroomId as string;

  const { data: year } = useSchoolYear(yearId);
  const { data: classroom, isLoading } = useClassroom(classroomId);
  const { data: students = [], isLoading: studentsLoading } = useClassroomStudents(classroomId);
  const { data: subjects = [] } = useClassroomSubjects(classroomId);
  const { data: periodes = [] } = usePeriodes(classroom?.school_id ?? year?.school_id ?? '');

  const [selectedPeriode, setSelectedPeriode] = useState<string>('all');
  const activePeriode = selectedPeriode === 'all' ? undefined : selectedPeriode;
  const { data: evaluations = [] } = useClassroomEvaluations(classroomId, activePeriode);
  const { data: notes = [] } = useStudentNotes(classroomId, activePeriode);

  // Group subjects by group
  const subjectsByGroup = subjects.reduce<Record<string, typeof subjects>>((acc, s) => {
    const group = s.group_name || 'Autre';
    if (!acc[group]) acc[group] = [];
    acc[group].push(s);
    return acc;
  }, {});

  // Group notes by student
  const notesByStudent = notes.reduce<Record<string, typeof notes>>((acc, n) => {
    if (!acc[n.student_id]) acc[n.student_id] = [];
    acc[n.student_id].push(n);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
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
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <button onClick={() => router.push('/dashboard/vie-scolaire')} className="hover:text-foreground transition-colors">
          Vie scolaire
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <button onClick={() => router.push(`/dashboard/vie-scolaire/${yearId}`)} className="hover:text-foreground transition-colors">
          {year?.name ?? '...'}
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{classroom.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/vie-scolaire/${yearId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
            <School className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{classroom.name}</h1>
            <p className="text-sm text-muted-foreground">
              {classroom.level_name} - {classroom.school_name}
            </p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">Eleves</p>
              <p className="text-lg font-bold">{students.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <BookOpen className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Matieres</p>
              <p className="text-lg font-bold">{subjects.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ClipboardList className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-xs text-muted-foreground">Evaluations</p>
              <p className="text-lg font-bold">{evaluations.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CreditCard className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Notes saisies</p>
              <p className="text-lg font-bold">{notes.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Eleves ({students.length})</TabsTrigger>
          <TabsTrigger value="subjects">Matieres ({subjects.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Élèves */}
        <TabsContent value="students">
          <Card>
            <CardContent className="pt-6">
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
                        <TableCell><Badge variant="outline">{s.sex || '-'}</Badge></TableCell>
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
        </TabsContent>

        {/* Matières */}
        <TabsContent value="subjects">
          <div className="space-y-4">
            {Object.keys(subjectsByGroup).length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  Aucune matiere configuree
                </CardContent>
              </Card>
            ) : (
              Object.entries(subjectsByGroup).map(([group, subs]) => (
                <Card key={group}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {group}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Matiere</TableHead>
                          <TableHead>Coefficient</TableHead>
                          <TableHead>Bareme</TableHead>
                          <TableHead>Enseignant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subs.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{s.subject_name}</span>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline">{s.coefficient}</Badge></TableCell>
                            <TableCell className="text-muted-foreground">/ {s.max_score}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {s.teacher_profile_id ? `Prof #${s.teacher_profile_id.slice(0, 8)}` : 'Non assigne'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Notes par eleve</CardTitle>
              <Select value={selectedPeriode} onValueChange={setSelectedPeriode}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Toutes les periodes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les periodes</SelectItem>
                  {periodes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Aucune note saisie</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(notesByStudent).map(([studentId, studentNotes]) => {
                    const first = studentNotes[0];
                    return (
                      <div key={studentId} className="rounded-lg border">
                        <div
                          className="flex items-center gap-3 border-b bg-muted/30 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => router.push(`/dashboard/students/${studentId}`)}
                        >
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium text-sm">{first.student_name}</p>
                          <Badge variant="outline" className="ml-auto text-xs">{first.student_matricule || '-'}</Badge>
                        </div>
                        <div className="p-2">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">Matiere</TableHead>
                                <TableHead className="text-xs">Evaluation</TableHead>
                                <TableHead className="text-xs">Type</TableHead>
                                <TableHead className="text-xs">Note</TableHead>
                                <TableHead className="text-xs">Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {studentNotes.map((n) => (
                                <TableRow key={n.id}>
                                  <TableCell className="text-sm">{n.subject_name}</TableCell>
                                  <TableCell className="text-sm">{n.evaluation_name}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs capitalize">{n.evaluation_type}</Badge>
                                  </TableCell>
                                  <TableCell className="font-medium text-sm">
                                    {n.is_absent ? (
                                      <Badge variant="destructive" className="text-xs">Absent</Badge>
                                    ) : (
                                      `${n.score ?? '-'} / ${n.max_score}`
                                    )}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {n.date ? new Date(n.date).toLocaleDateString('fr-FR') : '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
