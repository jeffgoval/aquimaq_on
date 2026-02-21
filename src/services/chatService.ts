import { supabase } from '@/services/supabase';
import type { ChatConversationRow, ChatMessageRow } from '@/types/database';
import type { ChatConversation, ChatMessage } from '@/types';
import { ENV } from '@/config/env';

const FUNCTIONS_URL = `${ENV.VITE_SUPABASE_URL}/functions/v1`;

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

const HEADERS = {
  'Content-Type': 'application/json',
  apikey: ENV.VITE_SUPABASE_ANON_KEY,
};

/** Cria uma nova conversa (simplificado para guest). */
export const createConversation = async (subject?: string): Promise<ChatConversation> => {
  const { data, error } = await supabase
    .from('chat_conversations')
    .insert({
      customer_id: 'guest_user',
      status: 'active',
      channel: 'web',
      subject: subject ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapConversation(data as ChatConversationRow);
};

/** Envia mensagem e obtém resposta da IA. */
export const sendMessage = async (
  conversationId: string,
  content: string
): Promise<{ reply: string }> => {
  const res = await fetch(`${FUNCTIONS_URL}/ai-chat`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ conversation_id: conversationId, message: content }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Erro ao enviar mensagem');
  }
  return res.json() as Promise<{ reply: string }>;
};

/** Lista conversas. */
export const getConversations = async (): Promise<ChatConversation[]> => {
  const { data, error } = await supabase
    .from('chat_conversations')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapConversation(row as ChatConversationRow));
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
