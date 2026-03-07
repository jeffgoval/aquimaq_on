import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/services/supabase';
import {
  claimConversation,
  closeConversation,
  getConversations,
  getMessages,
  handoffConversation,
  releaseConversationToBot,
  sendAdminMessage,
  subscribeToMessages,
} from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import type { ChatConversation, ChatMessage } from '@/types';
import {
  Wifi, WifiOff, RefreshCw, Send, User as UserIcon,
  MessageCircle, Clock, CheckCircle, AlertCircle, Bot, Users,
} from 'lucide-react';

type BotStatus = {
  status: 'connected' | 'disconnected' | 'connecting';
  phone_number: string | null;
  last_seen: string | null;
  messages_today: number;
  handoffs_today: number;
};

type SellerRow = { id: string; name: string | null; email: string | null; phone: string | null };

const queueLabel: Record<string, string> = {
  bot: 'Bot IA',
  assigned: 'Atribuído',
  waiting_human: 'Aguardando humano',
  closed: 'Encerrado',
};

const queueColor: Record<string, string> = {
  bot: 'bg-blue-100 text-blue-700',
  assigned: 'bg-emerald-100 text-emerald-700',
  waiting_human: 'bg-amber-100 text-amber-700',
  closed: 'bg-stone-200 text-stone-500',
};

export default function AdminWhatsAppPage() {
  const { user, isAdmin, isGerente } = useAuth();
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sellers, setSellers] = useState<SellerRow[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [handoffTo, setHandoffTo] = useState('');
  const [handoffing, setHandoffing] = useState(false);
  const [closing, setClosing] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadBotStatus = useCallback(async () => {
    const { data } = await (supabase.from('whatsapp_bot_status') as any)
      .select('*').eq('id', 'default').maybeSingle();
    setBotStatus(data ?? null);
  }, []);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getConversations();
      setConversations(all.filter((c) => c.channel === 'whatsapp'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSellers = useCallback(async () => {
    if (!isAdmin && !isGerente) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email, phone')
      .in('role', ['vendedor', 'gerente', 'admin'])
      .order('name');
    setSellers((data ?? []) as SellerRow[]);
  }, [isAdmin, isGerente]);

  useEffect(() => {
    loadBotStatus();
    loadConversations();
    loadSellers();
    const interval = setInterval(loadBotStatus, 30_000);
    return () => clearInterval(interval);
  }, [loadBotStatus, loadConversations, loadSellers]);

  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }
    let mounted = true;
    getMessages(selectedId).then((list) => {
      if (mounted) {
        setMessages(list);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
      }
    });
    const unsub = subscribeToMessages(selectedId, (msg) => {
      if (!mounted) return;
      setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
      loadConversations();
    });
    return () => { mounted = false; unsub(); };
  }, [selectedId, loadConversations]);

  const handleClaim = async (convId: string) => {
    if (!user) return;
    await claimConversation(convId, user.id);
    // mark human_mode in whatsapp_sessions
    const conv = conversations.find((c) => c.id === convId);
    if (conv?.contactPhone) {
      await (supabase.from('whatsapp_sessions') as any)
        .update({ human_mode: true, assigned_agent: user.id, unread_count: 0 })
        .eq('phone', conv.contactPhone);
    }
    await loadConversations();
  };

  const handleHandoff = async () => {
    if (!selectedId || !handoffTo || handoffing) return;
    setHandoffing(true);
    try {
      await handoffConversation(selectedId, handoffTo);
      const conv = conversations.find((c) => c.id === selectedId);
      if (conv?.contactPhone) {
        await (supabase.from('whatsapp_sessions') as any)
          .update({ human_mode: true, assigned_agent: handoffTo, unread_count: 0 })
          .eq('phone', conv.contactPhone);
      }
      await loadConversations();
      setHandoffTo('');
    } finally {
      setHandoffing(false);
    }
  };

  const handleClose = async () => {
    if (!selectedId || closing) return;
    setClosing(true);
    try {
      await closeConversation(selectedId);
      await loadConversations();
    } finally {
      setClosing(false);
    }
  };

  const handleReleaseToBot = async () => {
    if (!selectedId || releasing) return;
    setReleasing(true);
    try {
      await releaseConversationToBot(selectedId);
      await loadConversations();
    } finally {
      setReleasing(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !user || !newMessage.trim() || sending) return;
    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);
    try {
      await sendAdminMessage(selectedId, user.id, content);
      await loadConversations();
    } catch {
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const filtered = conversations.filter((c) => {
    if (filter === 'bot') return c.queueState === 'bot';
    if (filter === 'waiting') return c.queueState === 'waiting_human';
    if (filter === 'human') return c.queueState === 'assigned';
    if (filter === 'closed') return c.status === 'closed';
    return true;
  });

  const selectedConv = conversations.find((c) => c.id === selectedId);
  const canAct = isAdmin || isGerente;

  const counts = {
    total: conversations.length,
    bot: conversations.filter((c) => c.queueState === 'bot').length,
    waiting: conversations.filter((c) => c.queueState === 'waiting_human').length,
    human: conversations.filter((c) => c.queueState === 'assigned').length,
  };

  const botOnline = botStatus?.status === 'connected' &&
    botStatus.last_seen &&
    Date.now() - new Date(botStatus.last_seen).getTime() < 90_000;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-800">WhatsApp Bot</h1>
          <p className="text-sm text-stone-500">Gestão de conversas e agente IA</p>
        </div>
        <button
          onClick={() => { loadBotStatus(); loadConversations(); }}
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50"
        >
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* Status + Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Bot status card */}
        <div className={`col-span-2 lg:col-span-1 rounded-xl border p-4 flex items-center gap-3 ${botOnline ? 'bg-emerald-50 border-emerald-200' : 'bg-stone-50 border-stone-200'}`}>
          {botOnline
            ? <Wifi size={22} className="text-emerald-600 shrink-0" />
            : <WifiOff size={22} className="text-stone-400 shrink-0" />}
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${botOnline ? 'text-emerald-700' : 'text-stone-500'}`}>
              {botOnline ? 'Bot online' : 'Bot offline'}
            </p>
            <p className="text-xs text-stone-500 truncate">
              {botStatus?.phone_number ? `+${botStatus.phone_number}` : 'Sem número'}
            </p>
            {botStatus?.last_seen && (
              <p className="text-[11px] text-stone-400">
                {new Date(botStatus.last_seen).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>

        {[
          { label: 'Total hoje', value: counts.total, icon: <MessageCircle size={18} />, color: 'text-stone-600' },
          { label: 'Com bot', value: counts.bot, icon: <Bot size={18} />, color: 'text-blue-600' },
          { label: 'Aguardando', value: counts.waiting, icon: <AlertCircle size={18} />, color: 'text-amber-600' },
          { label: 'Com humano', value: counts.human, icon: <Users size={18} />, color: 'text-emerald-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className={`mb-1 ${stat.color}`}>{stat.icon}</div>
            <p className="text-2xl font-bold text-stone-800">{stat.value}</p>
            <p className="text-xs text-stone-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Conversations panel */}
      <div className="flex border border-stone-200 rounded-xl bg-white overflow-hidden shadow-sm" style={{ height: 'calc(100vh - 280px)', minHeight: 480 }}>
        {/* Left: conversation list */}
        <div className="w-72 lg:w-80 border-r border-stone-100 flex flex-col shrink-0">
          <div className="p-2 border-b border-stone-100">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg text-sm px-3 py-1.5"
            >
              <option value="all">Todas ({counts.total})</option>
              <option value="bot">Bot IA ({counts.bot})</option>
              <option value="waiting">Aguardando humano ({counts.waiting})</option>
              <option value="human">Com atendente ({counts.human})</option>
              <option value="closed">Encerradas</option>
            </select>
          </div>

          {loading ? (
            <p className="p-6 text-sm text-stone-400 text-center">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-stone-400 text-center">Nenhuma conversa</p>
          ) : (
            <ul className="divide-y divide-stone-100 overflow-y-auto flex-1">
              {filtered.map((c) => {
                const isWaiting = c.queueState === 'waiting_human';
                return (
                  <li key={c.id}>
                    <div
                      className={`p-3 cursor-pointer hover:bg-stone-50 transition-colors ${selectedId === c.id ? 'bg-agro-50 border-l-2 border-agro-500' : ''}`}
                      onClick={() => setSelectedId(c.id)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-[13px] font-semibold text-stone-800 truncate">
                          {c.contactPhone ? `+${c.contactPhone}` : `#${c.id.slice(0, 6)}`}
                        </p>
                        <span className="text-[11px] text-stone-400 ml-1 shrink-0">
                          {new Date(c.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${queueColor[c.queueState ?? 'bot'] ?? 'bg-stone-100 text-stone-500'}`}>
                        {queueLabel[c.queueState ?? 'bot'] ?? c.queueState}
                      </span>
                      {(isWaiting || c.queueState === 'bot') && canAct && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleClaim(c.id); }}
                          className="mt-2 w-full text-center text-[12px] py-1 rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200"
                        >
                          Assumir atendimento
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right: message thread */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedId && selectedConv ? (
            <>
              {/* Header */}
              <div className="border-b border-stone-100 px-4 py-3 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <UserIcon size={15} />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-stone-800">
                      {selectedConv.contactPhone ? `+${selectedConv.contactPhone}` : `Conversa #${selectedId.slice(0, 6)}`}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${queueColor[selectedConv.queueState ?? 'bot']}`}>
                        {queueLabel[selectedConv.queueState ?? 'bot']}
                      </span>
                      {selectedConv.assignedAgent && (
                        <span className="text-[11px] text-stone-400 flex items-center gap-1">
                          <CheckCircle size={11} /> Atribuído
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions bar */}
              {canAct && selectedConv.status !== 'closed' && (
                <div className="px-4 py-2 border-b border-stone-100 bg-stone-50 flex flex-wrap gap-2 items-center">
                  {(selectedConv.queueState === 'waiting_human' || selectedConv.queueState === 'bot') && (
                    <button
                      onClick={() => handleClaim(selectedId)}
                      className="text-xs px-3 py-1.5 rounded-md bg-amber-500 text-white hover:bg-amber-600"
                    >
                      Assumir agora
                    </button>
                  )}
                  {selectedConv.queueState === 'assigned' && (
                    <button
                      onClick={handleReleaseToBot}
                      disabled={releasing}
                      className="text-xs px-3 py-1.5 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                    >
                      {releasing ? 'Devolvendo...' : 'Devolver ao bot'}
                    </button>
                  )}
                  <select
                    value={handoffTo}
                    onChange={(e) => setHandoffTo(e.target.value)}
                    className="bg-white border border-stone-200 rounded-md text-xs px-2 py-1.5"
                  >
                    <option value="">Transferir para...</option>
                    {sellers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name || s.email || s.id.slice(0, 8)}
                        {s.phone ? ` (${s.phone})` : ''}
                      </option>
                    ))}
                  </select>
                  {handoffTo && (
                    <button
                      onClick={handleHandoff}
                      disabled={handoffing}
                      className="text-xs px-3 py-1.5 rounded-md bg-agro-600 text-white disabled:opacity-50"
                    >
                      {handoffing ? 'Transferindo...' : 'Transferir'}
                    </button>
                  )}
                  <button
                    onClick={handleClose}
                    disabled={closing}
                    className="text-xs px-3 py-1.5 rounded-md border border-stone-300 text-stone-600 hover:bg-stone-100 disabled:opacity-50 ml-auto"
                  >
                    {closing ? 'Encerrando...' : 'Encerrar'}
                  </button>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-stone-50/40">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderType === 'customer' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-[13.5px] shadow-sm leading-relaxed ${
                      msg.senderType === 'customer'
                        ? 'bg-white border border-stone-200 text-stone-800 rounded-bl-sm'
                        : msg.senderType === 'ai_agent'
                          ? 'bg-blue-50 border border-blue-100 text-stone-800 rounded-br-sm'
                          : 'bg-agro-600 text-white rounded-br-sm'
                    }`}>
                      <div className="flex items-center justify-between gap-3 mb-0.5">
                        <span className={`text-[11px] font-semibold ${
                          msg.senderType === 'customer' ? 'text-stone-400'
                            : msg.senderType === 'ai_agent' ? 'text-blue-500'
                              : 'text-agro-200'
                        }`}>
                          {msg.senderType === 'customer' ? 'Cliente'
                            : msg.senderType === 'ai_agent' ? 'Agente IA'
                              : 'Atendente'}
                        </span>
                        <span className="text-[10px] opacity-60">
                          {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="h-full flex items-center justify-center text-stone-400 text-sm pt-16">
                    Nenhuma mensagem ainda.
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Send input */}
              <div className="p-3 bg-white border-t border-stone-100">
                {selectedConv.status === 'closed' ? (
                  <p className="text-center text-xs text-stone-400 py-1">Conversa encerrada.</p>
                ) : selectedConv.queueState === 'bot' ? (
                  <p className="text-center text-xs text-stone-400 py-1 flex items-center justify-center gap-1.5">
                    <Bot size={13} /> Bot está respondendo — assuma o atendimento para enviar mensagens.
                  </p>
                ) : (
                  <form onSubmit={handleSend} className="flex gap-2">
                    <input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Mensagem para o cliente..."
                      disabled={sending}
                      className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500"
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="bg-agro-600 text-white p-2.5 rounded-xl hover:bg-agro-700 disabled:opacity-50 shrink-0"
                    >
                      {sending
                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <Send size={16} />}
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-400 gap-3">
              <MessageCircle size={36} className="text-stone-200" />
              <div className="text-center">
                <p className="text-[15px] font-medium text-stone-500">Selecione uma conversa</p>
                <p className="text-[13px] mt-0.5">As conversas WhatsApp aparecem aqui em tempo real</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
