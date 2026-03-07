import { supabase } from '@/services/supabase';
import type { ChatAssignmentEventRow, ChatConversationRow, ChatMessageRow } from '@/types/database';
import type { ChatConversation, ChatMessage } from '@/types';

function mapConversation(row: ChatConversationRow): ChatConversation {
  return {
    id: row.id,
    customerId: row.customer_id,
    assignedAgent: row.assigned_agent,
    status: row.status as ChatConversation['status'],
    channel: row.channel as ChatConversation['channel'],
    contactPhone: row.contact_phone,
    queueState: row.current_queue_state as ChatConversation['queueState'],
    subject: row.subject,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessage(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderType: row.sender_type as ChatMessage['senderType'],
    senderId: row.sender_id,
    content: row.content,
    externalMessageId: row.external_message_id,
    deliveryStatus: row.delivery_status as ChatMessage['deliveryStatus'],
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.created_at,
  };
}

export const createConversation = async (subject?: string): Promise<ChatConversation> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario nao autenticado');

  const { data, error } = await ((supabase.from('chat_conversations') as any)
    .insert({
      customer_id: user.id,
      status: 'active',
      subject: subject ?? null,
      channel: 'web',
      current_queue_state: 'bot',
    })
    .select()
    .single()) as any;

  if (error) throw new Error(error.message);
  return mapConversation(data as ChatConversationRow);
};

export const sendMessage = async (
  conversationId: string,
  content: string
): Promise<{ reply: string }> => {
  const { data, error } = await supabase.functions.invoke('ai-chat', {
    body: { conversation_id: conversationId, message: content },
  });

  if (error) throw new Error(error.message || 'Erro ao enviar mensagem');
  return data as { reply: string };
};

export const sendWhatsAppMessage = async (
  conversationId: string,
  content: string
): Promise<{ provider_message_id: string; status: string }> => {
  // Garantir token fresco (evita 401 por token expirado)
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    throw new Error('Sessão expirada ou não autenticado. Faça login novamente.');
  }
  const { data: refreshed } = await supabase.auth.refreshSession({ refresh_token: session.refresh_token });
  const token = refreshed?.session?.access_token ?? session.access_token;
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-send`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ conversation_id: conversationId, content }),
    }
  );
  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    // resposta não-JSON (ex: HTML de erro do gateway)
  }
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    if (res.status === 502) {
      throw new Error(
        (data?.error as string) ||
        'Falha ao enviar no WhatsApp. Verifique se a instância está conectada.'
      );
    }
    if (res.status === 500) {
      throw new Error(
        (data?.error as string) ||
        'Erro de configuração do servidor. Verifique os secrets do WhatsApp no Supabase.'
      );
    }
    throw new Error((data?.error as string) || `Erro ao enviar mensagem WhatsApp (${res.status})`);
  }
  return data as { provider_message_id: string; status: string };
};

export const getConversations = async (): Promise<ChatConversation[]> => {
  const { data, error } = await supabase
    .from('chat_conversations')
    .select('*, profiles:customer_id(name, email)')
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => ({
    ...mapConversation(row as ChatConversationRow),
    customerName: row.profiles?.name || row.profiles?.email || (row.contact_phone ? `WhatsApp ${row.contact_phone}` : 'Cliente'),
  }));
};

export const claimConversation = async (conversationId: string, agentId: string): Promise<void> => {
  const { error } = await (supabase.from('chat_conversations') as any)
    .update({
      assigned_agent: agentId,
      status: 'active',
      current_queue_state: 'assigned',
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);
  if (error) throw new Error(error.message);

  // For WhatsApp conversations, activate human mode so the AI bot stops responding
  await (supabase.from('whatsapp_sessions') as any)
    .update({ human_mode: true, assigned_agent: agentId, unread_count: 0 })
    .eq('conversation_id', conversationId);
};

export const handoffConversation = async (
  conversationId: string,
  toAgent: string,
  reason: string = 'manual_handoff'
): Promise<void> => {
  const { error } = await (supabase as any).rpc('handoff_chat_conversation', {
    p_conversation_id: conversationId,
    p_to_agent: toAgent,
    p_reason: reason,
  });
  if (error) throw new Error(error.message);
};

export const closeConversation = async (conversationId: string): Promise<void> => {
  const { error } = await (supabase.from('chat_conversations') as any)
    .update({
      status: 'closed',
      current_queue_state: 'closed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);
  if (error) throw new Error(error.message);

  // Reset human mode so the bot can take over if the customer contacts again
  await (supabase.from('whatsapp_sessions') as any)
    .update({ human_mode: false, assigned_agent: null, unread_count: 0 })
    .eq('conversation_id', conversationId);
};

/** Devolve a conversa ao bot (agente IA). Só faz sentido para canal WhatsApp. */
export const releaseConversationToBot = async (conversationId: string): Promise<void> => {
  const { error } = await (supabase.from('chat_conversations') as any)
    .update({
      assigned_agent: null,
      current_queue_state: 'bot',
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);
  if (error) throw new Error(error.message);

  await (supabase.from('whatsapp_sessions') as any)
    .update({ human_mode: false, assigned_agent: null, unread_count: 0 })
    .eq('conversation_id', conversationId);
};

export const sendAdminMessage = async (
  conversationId: string,
  adminId: string,
  content: string
): Promise<void> => {
  const { data: conv, error: convError } = await (supabase
    .from('chat_conversations')
    .select('id, channel')
    .eq('id', conversationId)
    .single()) as any;
  if (convError) throw new Error(convError.message);
  if (!conv) throw new Error('Conversa nao encontrada');

  const isWhatsApp = conv.channel === 'whatsapp';

  // Canal web: inserimos aqui. WhatsApp: só a Edge Function insere (evita duplicado pending/sent)
  if (!isWhatsApp) {
    const { error: msgError } = await (supabase.from('chat_messages') as any).insert({
      conversation_id: conversationId,
      sender_type: 'human_agent',
      sender_id: adminId,
      content,
      delivery_status: 'sent',
      metadata: { channel: 'web' },
    });
    if (msgError) throw new Error(msgError.message);
  } else {
    await sendWhatsAppMessage(conversationId, content);
  }

  const { error: updateError } = await (supabase.from('chat_conversations') as any)
    .update({
      status: 'active',
      current_queue_state: 'assigned',
      assigned_agent: adminId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);
  if (updateError) throw new Error(updateError.message);
};

export const getMessages = async (conversationId: string): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapMessage(row as ChatMessageRow));
};

export const getAssignmentEvents = async (conversationId: string): Promise<ChatAssignmentEventRow[]> => {
  const { data, error } = await (supabase
    .from('chat_assignment_events')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })) as any;
  if (error) throw new Error(error.message);
  return (data ?? []) as ChatAssignmentEventRow[];
};

export const getConversationById = async (id: string): Promise<ChatConversation | null> => {
  const { data, error } = await (supabase
    .from('chat_conversations')
    .select('*')
    .eq('id', id)
    .maybeSingle()) as any;
  if (error || !data) return null;
  return mapConversation(data as ChatConversationRow);
};

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
