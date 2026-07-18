'use client';

import { MessageSquare, Search } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/layout/empty-state';
import { LoadingList } from '@/components/layout/loading-state';
import { useConversations, getInitials, formatDate } from '@edukea/shared';
import { useState } from 'react';

export default function MessagingPage() {
  const { data: conversations = [], isLoading } = useConversations();
  const [search, setSearch] = useState('');

  const filtered = conversations.filter((c: any) =>
    !search || c.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Messagerie" description="Echangez avec les enseignants" />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher une conversation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <LoadingList />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Aucune conversation"
          description="Vos conversations avec les enseignants apparaitront ici."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((conversation: any) => (
            <Link key={conversation.id} href={`/messaging/${conversation.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(conversation.subject || 'Conv')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="truncate font-medium">
                        {conversation.subject || 'Conversation'}
                      </p>
                      {conversation.last_message_at && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(conversation.last_message_at, { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="truncate text-sm text-muted-foreground">
                        {conversation.student
                          ? `${conversation.student.firstname} ${conversation.student.lastname}`
                          : ''}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <Badge className="ml-2 h-5 min-w-[20px] rounded-full px-1.5 text-[10px]">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
