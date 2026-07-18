'use client';

import { ClipboardList, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/layout/empty-state';
import { LoadingPage } from '@/components/layout/loading-state';
import { useSelectedChild } from '@/components/layout/child-selector';
import { useQuery } from '@tanstack/react-query';
import { formatDate, type Tables } from '@edukea/shared';
import { createClient } from '@/lib/supabase-browser';

export default function AttendancePage() {
  const { selectedChild, isLoading: childLoading } = useSelectedChild();

  const { data: records = [], isLoading } = useQuery<Tables<'attendance_records'>[]>({
    queryKey: ['attendance', selectedChild?.id],
    queryFn: async () => {
      if (!selectedChild?.id) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('student_id', selectedChild.id)
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedChild?.id,
  });

  if (childLoading || isLoading) return <LoadingPage />;

  const absences = records.filter((r) => r.type === 'absence');
  const retards = records.filter((r) => r.type === 'retard');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Absences & Retards"
        description={selectedChild ? `${selectedChild.firstname} ${selectedChild.lastname}` : undefined}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
              <ClipboardList className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Absences</p>
              <p className="text-2xl font-bold">{absences.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
              <Calendar className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Retards</p>
              <p className="text-2xl font-bold">{retards.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {records.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Aucune absence ni retard"
          description="Le suivi des absences et retards apparaitra ici."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historique</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {records.map((record) => (
                <div key={record.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{formatDate(record.date)}</p>
                    {record.reason && (
                      <p className="text-xs text-muted-foreground">{record.reason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={record.type === 'absence' ? 'destructive' : 'warning'}>
                      {record.type === 'absence' ? 'Absence' : 'Retard'}
                    </Badge>
                    {record.is_justified && (
                      <Badge variant="secondary">Justifie</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
