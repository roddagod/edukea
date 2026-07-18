'use client';

import { Bell, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/layout/empty-state';
import { LoadingList } from '@/components/layout/loading-state';
import { useNotifications, useMarkNotificationRead, formatDate } from '@edukea/shared';

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();

  if (isLoading) return <LoadingList />;

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" />

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Aucune notification"
          description="Vos notifications apparaitront ici."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={notification.is_read ? 'opacity-60' : ''}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.is_read ? 'bg-transparent' : 'bg-primary'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{notification.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(notification.created_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!notification.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markRead.mutate(notification.id)}
                  >
                    <Check className="mr-1 h-4 w-4" /> Lu
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
