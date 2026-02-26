import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { ENV } from '@/config/env';
import { Send, Bot, User, RefreshCw, FlaskConical, BookOpen, AlertCircle } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    chunksUsed?: number;
    hasContext?: boolean;
    error?: boolean;
}

const AdminRAGChat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Olá! Sou a IA da Aquimaq com acesso à base de conhecimento. Faça uma pergunta como se fosse um cliente ou vendedor, por exemplo: *"Qual o combustível usado na roçadeira 325iR?"* ou *"Como fazer manutenção do filtro de ar?"*',
            hasContext: false,
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const question = input.trim();
        if (!question || loading) return;

        setInput('');
        const userMsg: Message = { role: 'user', content: question };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        try {
            // Build history for context (exclude first system message)
            const history = messages
                .filter(m => !m.error)
                .map(m => ({ role: m.role, content: m.content }));

            const supabaseUrl = ENV.VITE_SUPABASE_URL;
            const supabaseKey = ENV.VITE_SUPABASE_ANON_KEY;
            const res = await fetch(`${supabaseUrl}/functions/v1/rag-chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                },
                body: JSON.stringify({ question, history })
            });
            const data = await res.json();
            // A função sempre retorna JSON. Se tiver campo `error`, é um erro.
            if (data?.error) throw new Error(data.error);
            if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.answer,
                chunksUsed: data.chunksUsed,
                hasContext: data.hasContext,
            }]);
        } catch (err: any) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Erro: ${err.message}`,
                error: true,
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setMessages([{
            role: 'assistant',
            content: 'Conversa reiniciada. Faça uma nova pergunta!',
            hasContext: false,
        }]);
        setInput('');
    };

    return (
        <div className="space-y-4 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-stone-800 flex items-center gap-2">
                        <FlaskConical className="text-stone-400" size={24} />
                        Teste de IA com RAG
                    </h1>
                    <p className="text-stone-400 text-[13px] mt-0.5">
                        Simule perguntas como cliente ou vendedor e veja exatamente como a IA responde
                    </p>
                </div>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-3 py-1.5 text-[13px] text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                >
                    <RefreshCw size={14} />
                    Reiniciar
                </button>
            </div>

            {/* Chat Container */}
            <div className="bg-white rounded-xl border border-stone-100 shadow-sm flex flex-col h-[calc(100vh-280px)] min-h-[500px]">

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center shrink-0 mt-0.5">
                                    <Bot size={15} className="text-white" />
                                </div>
                            )}

                            <div className={`max-w-[75%] space-y-1.5`}>
                                <div className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed ${msg.role === 'user'
                                    ? 'bg-stone-800 text-white rounded-br-sm'
                                    : msg.error
                                        ? 'bg-red-50 border border-red-100 text-red-700 rounded-bl-sm'
                                        : 'bg-stone-50 border border-stone-100 text-stone-800 rounded-bl-sm'
                                    }`}>
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>

                                {/* RAG Metadata Badge */}
                                {msg.role === 'assistant' && !msg.error && msg.chunksUsed !== undefined && (
                                    <div className="flex items-center gap-2">
                                        {msg.hasContext ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                                <BookOpen size={10} />
                                                {msg.chunksUsed} trechos da base de conhecimento
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                                                <AlertCircle size={10} />
                                                Sem contexto na base de conhecimento
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center shrink-0 mt-0.5">
                                    <User size={15} className="text-stone-600" />
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center shrink-0">
                                <Bot size={15} className="text-white" />
                            </div>
                            <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-stone-50 border border-stone-100">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Suggested Questions */}
                {messages.length <= 1 && (
                    <div className="px-6 pb-4">
                        <p className="text-[11px] text-stone-400 mb-2 uppercase tracking-wide font-medium">Sugestões de pergunta</p>
                        <div className="flex flex-wrap gap-2">
                            {[
                                'Qual combustível usa a roçadeira?',
                                'Como fazer manutenção do filtro de ar?',
                                'Quais as especificações técnicas?',
                                'Como resolver problema de partida?',
                            ].map(q => (
                                <button
                                    key={q}
                                    onClick={() => { setInput(q); }}
                                    className="text-[12px] px-3 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-stone-600 transition-colors"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input */}
                <div className="border-t border-stone-100 p-4">
                    <form onSubmit={handleSend} className="flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Faça uma pergunta como cliente ou vendedor..."
                            disabled={loading}
                            className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-stone-400 focus:bg-white transition-colors disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="bg-stone-800 text-white px-4 py-2.5 rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 text-[13px] font-medium"
                        >
                            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminRAGChat;
