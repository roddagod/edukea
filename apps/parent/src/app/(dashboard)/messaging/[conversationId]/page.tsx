'use client';

import { useParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LoadingPage } from '@/components/layout/loading-state';
import { useMessages, useSendMessage, useAuth, getInitials, formatDate } from '@edukea/shared';

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const { user } = useAuth();
  const { data: messages = [], isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const [newMessage, setNewMessage] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await sendMessage.mutateAsync({
      conversationId,
      content: newMessage.trim(),
    });
    setNewMessage('');
  };

  if (isLoading) return <LoadingPage />;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-xl border bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/messaging">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h2 className="font-semibold">Conversation</h2>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message: any) => {
            const isOwn = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[75%] gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {!isOwn && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs">
                        {getInitials(message.sender?.email || 'U')}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <div
                      className={`rounded-2xl px-4 py-2 text-sm ${
                        isOwn
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-foreground'
                      }`}
                    >
                      {message.content}
                      {message.file_url && (
                        <a
                          href={message.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`mt-1 block text-xs underline ${isOwn ? 'text-white/80' : 'text-primary'}`}
                        >
                          {message.file_name || 'Fichier joint'}
                        </a>
                      )}
                    </div>
                    <p className={`mt-1 text-[10px] text-muted-foreground ${isOwn ? 'text-right' : ''}`}>
                      {formatDate(message.created_at, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 border-t p-4">
        <Button type="button" variant="ghost" size="icon">
          <Paperclip className="h-5 w-5" />
        </Button>
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Ecrivez votre message..."
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!newMessage.trim() || sendMessage.isPending}>
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
