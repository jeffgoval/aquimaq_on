import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import type { ChatConversationRow, ChatMessageRow } from '@/types/database';
import type { ChatConversation, ChatMessage } from '@/types';
import { getConversations, getMessages, subscribeToMessages } from '@/services/chatService';

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

const statusLabel: Record<string, string> = {
  active: 'Ativo',
  waiting_human: 'Aguardando humano',
  closed: 'Fechado',
};

const ADMIN_PLACEHOLDER_ID = 'admin-placeholder';

const AdminChatPanel: React.FC = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getConversations();
      setConversations(list);
    } catch (e) {
      console.error('loadConversations error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    let mounted = true;
    getMessages(selectedId).then((list) => {
      if (mounted) setMessages(list);
    });
    const unsubscribe = subscribeToMessages(selectedId, (msg) => {
      if (mounted) setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [selectedId]);

  const handleClaim = async (conversationId: string) => {
    await supabase
      .from('chat_conversations')
      .update({ assigned_agent: ADMIN_PLACEHOLDER_ID, status: 'active', updated_at: new Date().toISOString() })
      .eq('id', conversationId);
    await loadConversations();
  };

  const filtered = conversations.filter((c) => filter === 'all' || c.status === filter);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] border border-gray-200 rounded-lg bg-white overflow-hidden">
      <div className="flex border-b border-gray-200 p-2 gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-md text-sm px-2 py-1"
        >
          <option value="all">Todas</option>
          <option value="active">Ativas</option>
          <option value="waiting_human">Aguardando humano</option>
          <option value="closed">Fechadas</option>
        </select>
      </div>
      <div className="flex flex-1 min-h-0">
        <div className="w-80 border-r border-gray-200 overflow-y-auto flex-shrink-0">
          {loading ? (
            <p className="p-4 text-sm text-gray-500">Carregando...</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left p-3 hover:bg-gray-50 ${selectedId === c.id ? 'bg-agro-50 border-l-2 border-agro-600' : ''}`}
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">
                      #{c.id.slice(0, 8)} · {statusLabel[c.status] ?? c.status}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(c.updatedAt).toLocaleString('pt-BR')}
                    </p>
                    {c.status === 'waiting_human' && (
                      <span className="inline-block mt-1 text-xs font-medium text-amber-600">
                        Aguardando humano
                      </span>
                    )}
                  </button>
                  {c.status === 'waiting_human' && !c.assignedAgent && (
                    <button
                      type="button"
                      onClick={() => handleClaim(c.id)}
                      className="w-full text-left px-3 pb-2 text-sm text-agro-600 hover:text-agro-700 font-medium"
                    >
                      Assumir conversa
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          {selectedId ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${msg.senderType === 'customer'
                          ? 'bg-agro-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      <p className="text-xs text-gray-500 mb-0.5">
                        {msg.senderType === 'customer' ? 'Cliente' : msg.senderType === 'ai_agent' ? 'IA' : 'Atendente'}
                      </p>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              Selecione uma conversa
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatPanel;
