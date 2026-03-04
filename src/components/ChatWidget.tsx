import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, ChevronDown, Bot, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  createConversation,
  sendMessage,
  getMessages,
  getConversationById,
  subscribeToMessages,
} from '@/services/chatService';
import type { ChatMessage } from '@/types';

const STORAGE_KEY = 'aquimaq_chat_conversation_id';

// ─── Message Bubble ────────────────────────────────────────────────────────────

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isCustomer = message.senderType === 'customer';
  const isAI = message.senderType === 'ai_agent';
  const time = new Date(message.createdAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex flex-col gap-0.5 ${isCustomer ? 'items-end' : 'items-start'}`}>
      {!isCustomer && (
        <div className="flex items-center gap-1 px-1">
          {isAI ? (
            <Bot size={11} className="text-blue-400" />
          ) : (
            <User size={11} className="text-gray-400" />
          )}
          <span className="text-xs text-gray-400">
            {isAI ? 'Assistente IA' : 'Atendente'}
          </span>
        </div>
      )}
      <div
        className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words leading-relaxed ${
          isCustomer
            ? 'bg-agro-600 text-white rounded-tr-sm'
            : isAI
            ? 'bg-blue-50 text-gray-800 rounded-tl-sm border border-blue-100'
            : 'bg-gray-100 text-gray-800 rounded-tl-sm'
        } ${message.id.startsWith('temp-') ? 'opacity-60' : ''}`}
      >
        {message.content}
      </div>
      <span className="text-xs text-gray-300 px-1">{time}</span>
    </div>
  );
};

// ─── Chat Widget ───────────────────────────────────────────────────────────────

const ChatWidget: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { pathname } = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY),
  );
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Clear state when user logs out
  useEffect(() => {
    if (!user) {
      setMessages([]);
      setConversationId(null);
      setIsClosed(false);
      setUnread(0);
    }
  }, [user]);

  // Load messages when opening with existing conversation
  useEffect(() => {
    if (!isOpen || !user || !conversationId) return;

    setLoadingMessages(true);
    setError(null);

    Promise.all([getMessages(conversationId), getConversationById(conversationId)])
      .then(([msgs, conv]) => {
        if (!conv) {
          // Conversation no longer exists
          localStorage.removeItem(STORAGE_KEY);
          setConversationId(null);
          return;
        }
        setMessages(msgs);
        setIsClosed(conv.status === 'closed');
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
        setConversationId(null);
      })
      .finally(() => setLoadingMessages(false));
  }, [isOpen, user, conversationId]);

  // Real-time subscription
  useEffect(() => {
    if (!conversationId || !user) return;

    const unsubscribe = subscribeToMessages(conversationId, (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        // Replace optimistic customer message with same content
        let base = prev;
        if (msg.senderType === 'customer') {
          base = prev.filter(
            (m) => !(m.id.startsWith('temp-') && m.content === msg.content),
          );
        }
        return [...base, msg];
      });

      if (!isOpen && msg.senderType !== 'customer') {
        setUnread((n) => n + 1);
      }
    });

    return unsubscribe;
  }, [conversationId, user, isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input and clear unread when opening
  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || isClosed || !user) return;

    setInput('');
    setSending(true);
    setError(null);

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        conversationId: conversationId ?? '',
        senderType: 'customer' as const,
        senderId: user.id,
        content: text,
        createdAt: new Date().toISOString(),
        deliveryStatus: 'pending' as const,
        metadata: null,
      },
    ]);

    try {
      let convId = conversationId;
      if (!convId) {
        const conv = await createConversation('Atendimento via chat');
        convId = conv.id;
        setConversationId(convId);
        localStorage.setItem(STORAGE_KEY, convId);
      }
      await sendMessage(convId, text);
    } catch {
      setError('Erro ao enviar. Tente novamente.');
      setInput(text);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleNewConversation = () => {
    localStorage.removeItem(STORAGE_KEY);
    setConversationId(null);
    setMessages([]);
    setIsClosed(false);
    setError(null);
  };

  // Don't render on admin pages or while auth is loading
  if (pathname.startsWith('/admin') || authLoading) return null;

  return (
    <>
      {/* Chat window */}
      {isOpen && (
        <div
          className="fixed right-6 z-50 w-80 sm:w-96 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200"
          style={{ height: '520px', bottom: '88px' }}
        >
          {/* Header */}
          <div className="bg-agro-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 bg-agro-500 rounded-full flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-agro-600 rounded-full" />
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">Suporte Aquimaq</p>
                <p className="text-xs text-agro-100 leading-tight">Online agora</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-agro-100 hover:text-white p-1.5 rounded-lg hover:bg-agro-500 transition-colors"
            >
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Body */}
          {!user ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="w-14 h-14 bg-agro-50 rounded-full flex items-center justify-center">
                <MessageCircle size={28} className="text-agro-400" />
              </div>
              <div>
                <p className="text-gray-800 font-medium">Fale com nossa equipe</p>
                <p className="text-sm text-gray-500 mt-1">
                  Entre na sua conta para iniciar o atendimento.
                </p>
              </div>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="bg-agro-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-agro-700 transition-colors"
              >
                Fazer login
              </Link>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {loadingMessages && (
                  <div className="flex justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-agro-400" />
                  </div>
                )}

                {!loadingMessages && messages.length === 0 && !isClosed && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-agro-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageCircle size={24} className="text-agro-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">Olá! Como podemos ajudar?</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Nossa IA responde na hora. Atendentes disponíveis em horário comercial.
                    </p>
                  </div>
                )}

                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}

                {sending && (
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot size={12} className="text-blue-400" />
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl rounded-tl-sm px-3 py-2.5 flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}

                {isClosed && (
                  <div className="text-center py-3 space-y-2">
                    <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1 inline-block">
                      Conversa encerrada
                    </span>
                    <div>
                      <button
                        onClick={handleNewConversation}
                        className="text-xs text-agro-600 hover:underline font-medium"
                      >
                        Iniciar nova conversa
                      </button>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs text-red-500 text-center px-4 py-1 flex-shrink-0">{error}</p>
              )}

              {/* Input */}
              {!isClosed && (
                <div className="border-t border-gray-100 p-3 flex gap-2 flex-shrink-0 bg-gray-50">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Digite sua mensagem..."
                    disabled={sending}
                    className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-agro-500 focus:border-transparent disabled:opacity-50 bg-white"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="bg-agro-600 text-white p-2.5 rounded-xl hover:bg-agro-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? 'Fechar chat' : 'Abrir chat'}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-agro-600 hover:bg-agro-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={24} />}
        {!isOpen && unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </>
  );
};

export default ChatWidget;
