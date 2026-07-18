'use client';

import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/layout/empty-state';
import { LoadingPage } from '@/components/layout/loading-state';
import { useSelectedChild } from '@/components/layout/child-selector';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

export default function TimetablePage() {
  const { selectedChild, isLoading: childLoading } = useSelectedChild();
  const classroomId = selectedChild?.current_classroom?.id;

  const { data: slots = [], isLoading } = useQuery<any[]>({
    queryKey: ['timetable', classroomId],
    queryFn: async () => {
      if (!classroomId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('timetable_slots')
        .select(`
          *,
          classroom_subject:classroom_subjects(
            subject:subjects(name)
          )
        `)
        .eq('classroom_id', classroomId)
        .order('day_of_week')
        .order('start_time');
      if (error) throw error;
      return data || [];
    },
    enabled: !!classroomId,
  });

  if (childLoading || isLoading) return <LoadingPage />;

  if (slots.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Emploi du temps" />
        <EmptyState
          icon={Calendar}
          title="Emploi du temps non disponible"
          description="L'emploi du temps sera disponible prochainement."
        />
      </div>
    );
  }

  const slotsByDay = DAYS.map((day, i) => ({
    day,
    slots: slots.filter((s: any) => s.day_of_week === i + 1),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emploi du temps"
        description={selectedChild?.current_classroom?.name}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        {slotsByDay.map(({ day, slots: daySlots }) => (
          <Card key={day}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-primary">{day}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {daySlots.length === 0 ? (
                <p className="text-xs text-muted-foreground">Pas de cours</p>
              ) : (
                daySlots.map((slot: any) => (
                  <div key={slot.id} className="rounded-lg bg-primary-light p-2.5">
                    <p className="text-xs font-medium text-primary">
                      {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                    </p>
                    <p className="mt-0.5 text-sm font-medium">
                      {slot.classroom_subject?.subject?.name || '-'}
                    </p>
                    {slot.room && (
                      <p className="text-xs text-muted-foreground">Salle {slot.room}</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
