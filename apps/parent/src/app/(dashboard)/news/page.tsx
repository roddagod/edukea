'use client';

import { Newspaper } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/layout/empty-state';
import { LoadingPage } from '@/components/layout/loading-state';
import { useQuery } from '@tanstack/react-query';
import { useAuth, formatDate, type Tables } from '@edukea/shared';
import { createClient } from '@/lib/supabase-browser';

export default function NewsPage() {
  const { profile } = useAuth();

  const { data: announcements = [], isLoading } = useQuery<Tables<'announcements'>[]>({
    queryKey: ['announcements', profile?.school_id],
    queryFn: async () => {
      if (!profile?.school_id) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('school_id', profile.school_id)
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.school_id,
  });

  if (isLoading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <PageHeader title="Actualites" description="Annonces de l'etablissement" />

      {announcements.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="Aucune actualite"
          description="Les annonces de l'ecole apparaitront ici."
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{announcement.title}</CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {announcement.published_at && formatDate(announcement.published_at)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {announcement.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
