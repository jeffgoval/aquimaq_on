import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/services/supabase';
import type { ChatConversation, ChatMessage } from '@/types';
import { getConversations, getMessages, subscribeToMessages, sendAdminMessage } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import { Send, User as UserIcon, Clock, CheckCircle } from 'lucide-react';

const statusLabel: Record<string, string> = {
  active: 'Ativo',
  waiting_human: 'Aguardando humano',
  closed: 'Fechado',
};

const AdminChatPanel: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Input state
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      if (mounted) {
        setMessages(list);
        scrollToBottom();
      }
    });

    const unsubscribe = subscribeToMessages(selectedId, (msg) => {
      if (mounted) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          setTimeout(scrollToBottom, 100);
          return [...prev, msg];
        });
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [selectedId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleClaim = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    try {
      await (supabase.from('chat_conversations') as any)
        .update({ assigned_agent: user.id, status: 'active', updated_at: new Date().toISOString() })
        .eq('id', conversationId);
      await loadConversations();
    } catch (error) {
      console.error('Error claiming conversation', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !user || !newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      await sendAdminMessage(selectedId, user.id, content);
      // Let the realtime subscription handle adding the message to UI
      // If we also want to optimistically update we could, but realtime is safer.
      setTimeout(scrollToBottom, 100);

      // Also update the conversation list to bring it to top if we want
      await loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Erro ao enviar mensagem');
      setNewMessage(content); // Restore message
    } finally {
      setSending(false);
    }
  };

  const filtered = conversations.filter((c) => filter === 'all' || c.status === filter);
  const selectedConv = conversations.find(c => c.id === selectedId);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px] max-h-[900px] border border-stone-200 rounded-xl bg-white overflow-hidden shadow-sm">
      <div className="flex border-b border-stone-100 p-3 bg-stone-50 items-center justify-between">
        <h2 className="font-semibold text-stone-800 hidden sm:block">Atendimento ao Cliente</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white border text-stone-700 border-stone-200 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-agro-500/20"
        >
          <option value="all">Todas as Conversas</option>
          <option value="active">Ativas (Em andamento)</option>
          <option value="waiting_human">Aguardando Humano</option>
          <option value="closed">Fechadas</option>
        </select>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar Lista de Conversas */}
        <div className="w-72 lg:w-80 border-r border-stone-100 flex flex-col bg-stone-50/30 flex-shrink-0">
          {loading ? (
            <p className="p-6 text-sm text-stone-400 text-center">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-stone-400 text-center">Nenhuma conversa encontrada</p>
          ) : (
            <ul className="divide-y divide-stone-100 overflow-y-auto flex-1 custom-scrollbar">
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left p-4 hover:bg-white transition-colors block ${selectedId === c.id ? 'bg-white border-l-4 border-l-agro-600 shadow-sm' : 'border-l-4 border-l-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-[13px] font-semibold text-stone-800 line-clamp-1">
                        {c.customerName || `Cliente #${c.customerId.slice(0, 6)}`}
                      </p>
                      <span className="text-[11px] text-stone-400 whitespace-nowrap ml-2">
                        {new Date(c.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${c.status === 'waiting_human' ? 'bg-amber-100 text-amber-700' :
                        c.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-stone-200 text-stone-600'
                        }`}>
                        {statusLabel[c.status] ?? c.status}
                      </span>

                      <span className="text-[10px] text-stone-400" title={c.customerId}>ID: {c.customerId.slice(0, 8)}</span>
                    </div>

                    {c.status === 'waiting_human' && (!c.assignedAgent || c.assignedAgent === 'admin-placeholder') && (
                      <button
                        type="button"
                        onClick={(e) => handleClaim(c.id, e)}
                        className="mt-3 w-full border border-agro-200 bg-agro-50/50 py-1.5 rounded text-[12px] text-agro-700 hover:bg-agro-100 hover:border-agro-300 transition-colors font-medium text-center"
                      >
                        Assumir Atendimento
                      </button>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Área de Mensagens */}
        <div className="flex-1 flex flex-col min-w-0 bg-white relative">
          {selectedId ? (
            <>
              {/* Info Header */}
              <div className="border-b border-stone-100 px-5 py-3 flex items-center justify-between bg-white z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-agro-100 flex items-center justify-center text-agro-700">
                    <UserIcon size={16} />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-stone-800">
                      {selectedConv?.customerName || `Cliente #${selectedConv?.customerId?.slice(0, 6)}`}
                    </h3>
                    <p className="text-[12px] text-stone-500 flex items-center gap-1">
                      <Clock size={12} />
                      Atendimento #{selectedId.slice(0, 6)}
                    </p>
                  </div>
                </div>
                {selectedConv?.status === 'active' && (
                  <span className="flex items-center gap-1.5 text-[12px] text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
                    <CheckCircle size={14} /> Ativo
                  </span>
                )}
              </div>

              {/* Lista de Mensagens */}
              <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 bg-stone-50/30 bg-[url('https://transparenttextures.com/patterns/cubes.png')] custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-stone-400 text-sm">
                    Nenhuma mensagem nesta conversa.
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderType === 'customer' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[14px] shadow-sm leading-relaxed ${msg.senderType === 'customer'
                          ? 'bg-white border border-stone-200 text-stone-800 rounded-bl-sm'
                          : msg.senderType === 'ai_agent'
                            ? 'bg-blue-50 border border-blue-100 text-stone-800 rounded-br-sm'
                            : 'bg-agro-600 text-white rounded-br-sm'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1 gap-4">
                          <span className={`text-[11px] font-semibold ${msg.senderType === 'customer' ? 'text-stone-500' : msg.senderType === 'ai_agent' ? 'text-blue-600' : 'text-agro-200'}`}>
                            {msg.senderType === 'customer' ? selectedConv?.customerName || `Cliente #${selectedConv?.customerId?.slice(0, 6)}` : msg.senderType === 'ai_agent' ? 'Robô IA' : 'Atendente Local'}
                          </span>
                          <span className={`text-[10px] ${msg.senderType === 'customer' ? 'text-stone-400' : 'text-agro-200/70'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Box de input */}
              <div className="p-4 bg-white border-t border-stone-100">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua resposta para o cliente..."
                    disabled={sending || selectedConv?.status === 'closed'}
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim() || selectedConv?.status === 'closed'}
                    className="bg-agro-600 text-white p-3 rounded-xl hover:bg-agro-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 w-12"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </form>
                {selectedConv?.status === 'closed' && (
                  <p className="text-[12px] text-center text-stone-400 mt-2">Esta conversa foi encerrada.</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-400">
              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-4">
                <Send size={24} className="text-stone-300" />
              </div>
              <p className="text-[15px] font-medium text-stone-600">Selecione uma conversa</p>
              <p className="text-[13px] mt-1">Escolha um cliente na lateral para iniciar o atendimento</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatPanel;
