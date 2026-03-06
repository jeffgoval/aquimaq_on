import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ChatConversation, ChatMessage } from '@/types';
import {
  claimConversation,
  closeConversation,
  getConversations,
  getMessages,
  handoffConversation,
  sendAdminMessage,
  subscribeToMessages,
} from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';
import { CheckCircle, Clock, RefreshCw, Send, User as UserIcon } from 'lucide-react';

type SellerRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
};

const statusLabel: Record<string, string> = {
  active: 'Ativo',
  waiting_human: 'Aguardando humano',
  closed: 'Fechado',
};

const channelLabel: Record<string, string> = {
  web: 'Web',
  whatsapp: 'WhatsApp',
};

const AdminChatPanel: React.FC = () => {
  const { user, isAdmin, isGerente } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sellers, setSellers] = useState<SellerRow[]>([]);
  const [handoffTo, setHandoffTo] = useState<string>('');
  const [handoffing, setHandoffing] = useState(false);
  const [closing, setClosing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getConversations();
      setConversations(list);
      if (selectedId && !list.find((c) => c.id === selectedId)) setSelectedId(null);
    } catch (e) {
      console.error('loadConversations error:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  const loadSellers = useCallback(async () => {
    if (!isAdmin && !isGerente) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .in('role', ['vendedor', 'gerente', 'admin'])
      .order('name', { ascending: true });
    if (!error) setSellers((data ?? []) as SellerRow[]);
  }, [isAdmin, isGerente]);

  useEffect(() => {
    loadConversations();
    loadSellers();

    // Subscription em tempo real para novos eventos em chat_conversations
    const channel = supabase
      .channel('admin:conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_conversations' }, () => {
        loadConversations();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const row = payload.new as { conversation_id: string };
        // Se a msg chegou numa conversa que NÃO está aberta, atualiza a lista
        if (row.conversation_id !== selectedIdRef.current) {
          loadConversations();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setHandoffTo('');
      return;
    }
    let mounted = true;
    getMessages(selectedId).then((list) => {
      if (mounted) {
        setMessages(list);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
      }
    });

    const unsubscribe = subscribeToMessages(selectedId, (msg) => {
      if (!mounted) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
        return [...prev, msg];
      });
      loadConversations();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [selectedId, loadConversations]);

  const handleClaim = async (conversationId: string) => {
    if (!user) return;
    try {
      await claimConversation(conversationId, user.id);
      await loadConversations();
    } catch (error) {
      console.error('Error claiming conversation', error);
    }
  };

  const handleHandoff = async () => {
    if (!selectedId || !handoffTo || handoffing) return;
    try {
      setHandoffing(true);
      await handoffConversation(selectedId, handoffTo, 'manual_handoff');
      setHandoffTo('');
      await loadConversations();
    } catch (error: any) {
      console.error('Error in handoff:', error);
      alert(`Erro ao transferir: ${error?.message ?? 'tente novamente'}`);
    } finally {
      setHandoffing(false);
    }
  };

  const handleCloseConversation = async () => {
    if (!selectedId || closing) return;
    try {
      setClosing(true);
      await closeConversation(selectedId);
      await loadConversations();
    } catch (error) {
      console.error('Error closing conversation:', error);
      alert('Erro ao encerrar conversa');
    } finally {
      setClosing(false);
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
      await loadConversations();
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Erro ao enviar mensagem');
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const filtered = conversations.filter((c) => filter === 'all' || c.status === filter);
  const selectedConv = conversations.find((c) => c.id === selectedId);
  const canHandoff = Boolean(selectedConv) && (isAdmin || isGerente);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px] max-h-[900px] border border-stone-200 rounded-xl bg-white overflow-hidden shadow-sm">
      <div className="flex border-b border-stone-100 p-3 bg-stone-50 items-center justify-between gap-3">
        <h2 className="font-semibold text-stone-800 hidden sm:block">Atendimento ao Cliente</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadConversations}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 border border-stone-200 rounded-md text-stone-600 hover:bg-white"
          >
            <RefreshCw size={12} />
            Atualizar
          </button>
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
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-72 lg:w-80 border-r border-stone-100 flex flex-col bg-stone-50/30 flex-shrink-0">
          {loading ? (
            <p className="p-6 text-sm text-stone-400 text-center">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-stone-400 text-center">Nenhuma conversa encontrada</p>
          ) : (
            <ul className="divide-y divide-stone-100 overflow-y-auto flex-1 custom-scrollbar">
              {filtered.map((c) => {
                // Admin/gerente podem assumir qualquer conversa aberta não atribuída a eles
                // Vendedor só pode assumir waiting_human sem agente ou atribuída a ele
                const canClaim = c.status !== 'closed' && (
                  (isAdmin || isGerente)
                    ? c.assignedAgent !== user?.id
                    : c.status === 'waiting_human' && (!c.assignedAgent || c.assignedAgent === user?.id)
                );
                return (
                  <li key={c.id} className="p-2">
                    <div
                      className={`rounded-lg p-3 cursor-pointer hover:bg-white transition-colors ${selectedId === c.id ? 'bg-white border border-agro-200' : 'border border-transparent'}`}
                      onClick={() => setSelectedId(c.id)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-[13px] font-semibold text-stone-800 line-clamp-1">
                          {c.customerName || `Contato ${c.contactPhone || c.id.slice(0, 6)}`}
                        </p>
                        <span className="text-[11px] text-stone-400 whitespace-nowrap ml-2">
                          {new Date(c.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${c.status === 'waiting_human' ? 'bg-amber-100 text-amber-700' : c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'}`}>
                          {statusLabel[c.status] ?? c.status}
                        </span>
                        <span className="text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                          {channelLabel[c.channel ?? 'web'] ?? c.channel}
                        </span>
                      </div>
                      {canClaim && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClaim(c.id);
                          }}
                          className="mt-2 w-full border border-agro-200 bg-agro-50/50 py-1.5 rounded text-[12px] text-agro-700 hover:bg-agro-100"
                        >
                          Assumir Atendimento
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-white relative">
          {selectedId && selectedConv ? (
            <>
              <div className="border-b border-stone-100 px-5 py-3 flex items-center justify-between bg-white z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-agro-100 flex items-center justify-center text-agro-700">
                    <UserIcon size={16} />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-stone-800">
                      {selectedConv.customerName || `Contato ${selectedConv.contactPhone || selectedConv.id.slice(0, 6)}`}
                    </h3>
                    <p className="text-[12px] text-stone-500 flex items-center gap-1">
                      <Clock size={12} />
                      Atendimento #{selectedId.slice(0, 6)} · {channelLabel[selectedConv.channel ?? 'web'] ?? selectedConv.channel}
                    </p>
                  </div>
                </div>
                {selectedConv.status === 'active' && (
                  <span className="flex items-center gap-1.5 text-[12px] text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
                    <CheckCircle size={14} /> Ativo
                  </span>
                )}
              </div>

              {canHandoff && (
                <div className="px-5 py-2 border-b border-stone-100 flex flex-wrap gap-2 items-center bg-stone-50">
                  <select
                    value={handoffTo}
                    onChange={(e) => setHandoffTo(e.target.value)}
                    className="bg-white border border-stone-200 rounded-lg text-sm px-3 py-1.5"
                  >
                    <option value="">Transferir para...</option>
                    {sellers.map((seller) => (
                      <option key={seller.id} value={seller.id}>
                        {seller.name || seller.email || seller.id.slice(0, 8)} ({seller.role})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleHandoff}
                    disabled={!handoffTo || handoffing}
                    className="text-xs px-3 py-1.5 rounded-md bg-agro-600 text-white disabled:opacity-50"
                  >
                    {handoffing ? 'Transferindo...' : 'Transferir'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseConversation}
                    disabled={selectedConv.status === 'closed' || closing}
                    className="text-xs px-3 py-1.5 rounded-md border border-stone-300 text-stone-700 disabled:opacity-50"
                  >
                    {closing ? 'Encerrando...' : 'Encerrar conversa'}
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 bg-stone-50/30 bg-[url('https://transparenttextures.com/patterns/cubes.png')] custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-stone-400 text-sm">
                    Nenhuma mensagem nesta conversa.
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.senderType === 'customer' ? 'justify-start' : 'justify-end'}`}>
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
                            {msg.senderType === 'customer' ? 'Cliente' : msg.senderType === 'ai_agent' ? 'Agente IA' : 'Atendente'}
                          </span>
                          <span className={`text-[10px] ${msg.senderType === 'customer' ? 'text-stone-400' : 'text-agro-200/70'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {msg.deliveryStatus && msg.senderType === 'human_agent' && (
                          <p className="text-[10px] mt-1 opacity-80">Status: {msg.deliveryStatus}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white border-t border-stone-100">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua resposta para o cliente..."
                    disabled={sending || selectedConv.status === 'closed'}
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim() || selectedConv.status === 'closed'}
                    className="bg-agro-600 text-white p-3 rounded-xl hover:bg-agro-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 w-12"
                  >
                    {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={18} />}
                  </button>
                </form>
                {selectedConv.status === 'closed' && (
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
