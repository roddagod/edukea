import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { ConversationWithDetails, MessageWithSender } from '../types/messaging';

export function useConversations() {
  const queryClient = useQueryClient();

  const query = useQuery<ConversationWithDetails[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          conversation:conversations(
            *,
            student:students(*),
            participants:conversation_participants(
              *,
              user:auth.users(id, email)
            )
          ),
          unread_count
        `)
        .eq('user_id', user.id)
        .order('conversation(last_message_at)', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item.conversation,
        unreadCount: item.unread_count,
      }));
    },
  });

  // Subscribe to new messages for realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('conversations-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

export function useMessages(conversationId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery<MessageWithSender[]>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as MessageWithSender[];
    },
    enabled: !!conversationId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        queryClient.setQueryData<MessageWithSender[]>(
          ['messages', conversationId],
          (old) => [...(old || []), payload.new as MessageWithSender]
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, queryClient]);

  return query;
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, content, fileUrl, fileName }: {
      conversationId: string;
      content: string;
      fileUrl?: string;
      fileName?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          file_url: fileUrl || null,
          file_name: fileName || null,
          is_read: false,
        })
        .select()
        .single();
      if (error) throw error;

      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
    },
  });
}
