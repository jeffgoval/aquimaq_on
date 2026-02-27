import { useState, useCallback, useEffect } from 'react';
import type { ChatConversation, ChatMessage } from '@/types';
import {
  createConversation,
  sendMessage as sendMessageService,
  getConversations,
  getMessages,
  subscribeToMessages,
} from '@/services/chatService';

interface UseChatOptions {
  conversationId: string | null;
  autoCreate?: boolean;
}

interface UseChatReturn {
  conversations: ChatConversation[];
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  createConversation: (subject?: string) => Promise<ChatConversation | null>;
  sendMessage: (content: string) => Promise<string | null>;
  loadConversations: () => Promise<void>;
  loadMessages: (id: string) => Promise<void>;
}

export const useChat = (options: UseChatOptions): UseChatReturn => {
  const { conversationId, autoCreate = false } = options;
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    setError(null);
    try {
      const list = await getConversations();
      setConversations(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (id: string) => {
    setError(null);
    try {
      const list = await getMessages(id);
      setMessages(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar mensagens');
    }
  }, []);

  const createConversationHandler = useCallback(async (subject?: string): Promise<ChatConversation | null> => {
    setError(null);
    try {
      const conv = await createConversation(subject);
      setConversations((prev) => [conv, ...prev]);
      return conv;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar conversa');
      return null;
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string): Promise<string | null> => {
      if (!conversationId?.trim()) return null;
      setSending(true);
      setError(null);
      try {
        const { reply } = await sendMessageService(conversationId, content.trim());
        // Como a Edge Function (ou o back-end via service role) insere a mensagem do
        // usuário e da IA no banco, e nós temos um `subscribeToMessages` ouvindo as mudanças,
        // não precisamos simular as mensagens localmente (reduz bugs de desidratação).
        return reply;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao enviar mensagem');
        return null;
      } finally {
        setSending(false);
      }
    },
    [conversationId]
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId, loadMessages]);

  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = subscribeToMessages(conversationId, (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    return unsubscribe;
  }, [conversationId]);

  useEffect(() => {
    if (autoCreate && !conversationId && conversations.length === 0 && !loading) {
      createConversationHandler().catch(() => { });
    }
  }, [autoCreate, conversationId, conversations.length, loading, createConversationHandler]);

  return {
    conversations,
    messages,
    loading,
    sending,
    error,
    createConversation: createConversationHandler,
    sendMessage,
    loadConversations,
    loadMessages,
  };
};
