'use client';

import { useState, useMemo } from 'react';
import { GraduationCap, BookOpen, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/layout/empty-state';
import { LoadingPage } from '@/components/layout/loading-state';
import { useSelectedChild } from '@/components/layout/child-selector';
import { useGrades, usePeriodes, useBulletin, useChildren } from '@edukea/shared';

export default function GradesPage() {
  const { selectedChild, isLoading: childLoading } = useSelectedChild();
  const { data: children = [] } = useChildren();
  const currentSchoolYear = useMemo(
    () => selectedChild ? children.find((c) => c.id === selectedChild.id)?.current_logging?.school_year_id : undefined,
    [selectedChild, children],
  );
  const { data: periodes = [] } = usePeriodes(currentSchoolYear);
  const [selectedPeriode, setSelectedPeriode] = useState<string>('');

  const activePeriode = selectedPeriode || periodes[0]?.id || '';
  const { data: grades = [], isLoading: gradesLoading } = useGrades(selectedChild?.id, activePeriode);
  const { data: bulletin, isLoading: bulletinLoading } = useBulletin(selectedChild?.id, activePeriode);

  if (childLoading) return <LoadingPage />;

  // Group grades by subject
  const gradesBySubject = grades.reduce<Record<string, any[]>>((acc, note: any) => {
    const subjectName = note.evaluation?.classroom_subject?.subject?.name || 'Autre';
    if (!acc[subjectName]) acc[subjectName] = [];
    acc[subjectName].push(note);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notes & Bulletins"
        description={selectedChild ? `${selectedChild.firstname} ${selectedChild.lastname}` : undefined}
        action={
          periodes.length > 0 ? (
            <Select value={activePeriode} onValueChange={setSelectedPeriode}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Periode" />
              </SelectTrigger>
              <SelectContent>
                {periodes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null
        }
      />

      <Tabs defaultValue="grades" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grades">Notes</TabsTrigger>
          <TabsTrigger value="bulletin">Bulletin</TabsTrigger>
        </TabsList>

        <TabsContent value="grades">
          {gradesLoading ? (
            <LoadingPage />
          ) : Object.keys(gradesBySubject).length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Aucune note disponible"
              description="Les notes apparaitront ici une fois publiees par les enseignants."
            />
          ) : (
            <div className="space-y-4">
              {Object.entries(gradesBySubject).map(([subject, notes]) => (
                <Card key={subject}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      {subject}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {notes.map((note: any) => (
                        <div key={note.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                          <div>
                            <p className="text-sm font-medium">{note.evaluation?.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="secondary" className="text-xs">
                                {note.evaluation?.type}
                              </Badge>
                              {note.evaluation?.date && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(note.evaluation.date).toLocaleDateString('fr-FR')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {note.is_absent ? (
                              <Badge variant="destructive">ABS</Badge>
                            ) : (
                              <span className="text-lg font-bold">
                                {note.score}<span className="text-sm text-muted-foreground">/{note.evaluation?.max_score || 20}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bulletin">
          {bulletinLoading ? (
            <LoadingPage />
          ) : !bulletin ? (
            <EmptyState
              icon={Award}
              title="Bulletin non disponible"
              description="Le bulletin sera disponible une fois publie par l'administration."
            />
          ) : (
            <Card>
              <CardHeader className="border-b bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Bulletin - {bulletin.periode?.name}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {bulletin.student?.firstname} {bulletin.student?.lastname} - {bulletin.classroom?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Moyenne generale</p>
                    <p className="text-3xl font-bold text-primary">{bulletin.average ?? '-'}<span className="text-base text-muted-foreground">/20</span></p>
                    <p className="text-sm text-muted-foreground">
                      Rang : {bulletin.rank ?? '-'}/{bulletin.total_students ?? '-'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50/50 text-sm">
                      <th className="px-4 py-3 text-left font-medium">Matiere</th>
                      <th className="px-4 py-3 text-center font-medium">Coeff</th>
                      <th className="px-4 py-3 text-center font-medium">Moyenne</th>
                      <th className="hidden px-4 py-3 text-center font-medium sm:table-cell">Min</th>
                      <th className="hidden px-4 py-3 text-center font-medium sm:table-cell">Max</th>
                      <th className="hidden px-4 py-3 text-center font-medium md:table-cell">Classe</th>
                      <th className="px-4 py-3 text-center font-medium">Rang</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(bulletin.subjects || []).map((bs: any) => (
                      <tr key={bs.id} className="border-b last:border-b-0">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium">{bs.subject?.name}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                          {bs.subject?.coefficient}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold">{bs.average ?? '-'}</span>
                        </td>
                        <td className="hidden px-4 py-3 text-center text-sm text-muted-foreground sm:table-cell">
                          {bs.min_average ?? '-'}
                        </td>
                        <td className="hidden px-4 py-3 text-center text-sm text-muted-foreground sm:table-cell">
                          {bs.max_average ?? '-'}
                        </td>
                        <td className="hidden px-4 py-3 text-center text-sm text-muted-foreground md:table-cell">
                          {bs.class_average ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">{bs.rank ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {bulletin.general_appreciation && (
                  <div className="border-t p-4">
                    <p className="text-sm font-medium text-muted-foreground">Appreciation generale</p>
                    <p className="mt-1 text-sm">{bulletin.general_appreciation}</p>
                  </div>
                )}
                {bulletin.principal_appreciation && (
                  <div className="border-t p-4">
                    <p className="text-sm font-medium text-muted-foreground">Appreciation du chef d'etablissement</p>
                    <p className="mt-1 text-sm">{bulletin.principal_appreciation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
