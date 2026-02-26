import { supabase } from '@/services/supabase';
import type { ChatConversationRow, ChatMessageRow } from '@/types/database';
import type { ChatConversation, ChatMessage } from '@/types';
import { ENV } from '@/config/env';


function mapConversation(row: ChatConversationRow): ChatConversation {
  return {
    id: row.id,
    customerId: row.customer_id,
    assignedAgent: row.assigned_agent,
    status: row.status,
    channel: row.channel,
    subject: row.subject,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessage(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderType: row.sender_type,
    senderId: row.sender_id,
    content: row.content,
    createdAt: row.created_at,
  };
}

/** Envia mensagem e obtém resposta da IA. */
export const sendMessage = async (
  conversationId: string,
  content: string
): Promise<{ reply: string }> => {
  const { data, error } = await supabase.functions.invoke('ai-chat', {
    body: { conversation_id: conversationId, message: content },
  });

  if (error) {
    throw new Error(error.message || 'Erro ao enviar mensagem');
  }

  return data as { reply: string };
};

/** Lista conversas. */
export const getConversations = async (): Promise<ChatConversation[]> => {
  const { data, error } = await supabase
    .from('chat_conversations')
    .select('*, profiles:customer_id(name, email)')
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => ({
    ...mapConversation(row as ChatConversationRow),
    customerName: row.profiles?.name || row.profiles?.email || 'Cliente',
  }));
};

/** Envia mensagem como atendente humano. */
export const sendAdminMessage = async (
  conversationId: string,
  adminId: string,
  content: string
): Promise<void> => {
  const { error } = await supabase.from('chat_messages').insert({
    conversation_id: conversationId,
    sender_type: 'human_agent',
    sender_id: adminId,
    content,
  });

  if (error) throw new Error(error.message);

  // Atualiza a conversa para indicar que o humano respondeu
  await supabase
    .from('chat_conversations')
    .update({
      status: 'active',
      assigned_agent: adminId,
      updated_at: new Date().toISOString()
    })
    .eq('id', conversationId);
};

/** Lista mensagens de uma conversa. */
export const getMessages = async (conversationId: string): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapMessage(row as ChatMessageRow));
};

/** Subscreve novas mensagens em tempo real. */
export const subscribeToMessages = (
  conversationId: string,
  callback: (message: ChatMessage) => void
) => {
  const channel = supabase
    .channel(`chat:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const row = payload.new as ChatMessageRow;
        callback(mapMessage(row));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
