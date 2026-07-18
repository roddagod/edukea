import type { Tables } from './database.types';

export interface ConversationWithDetails extends Tables<'conversations'> {
  participants: (Tables<'conversation_participants'> & {
    user: { id: string; email: string };
  })[];
  student?: Tables<'students'>;
  lastMessage?: Tables<'messages'>;
  unreadCount: number;
}

export interface MessageWithSender extends Tables<'messages'> {
  sender: {
    id: string;
    email: string;
    role: 'parent' | 'teacher' | 'admin';
  };
}
