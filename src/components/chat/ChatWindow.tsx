import React, { useRef, useEffect, useState, type FormEvent } from 'react';
import { Send, Trash2, Loader2, Sparkles } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import ChatMessage from './ChatMessage';

export default function ChatWindow() {
    const { messages, isLoading, sendMessage, clearHistory } = useChat();
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Focus input when window opens
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendMessage(input);
        setInput('');
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-agro-700 to-agro-600 text-white rounded-t-2xl">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <Sparkles size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold leading-tight">Balconista Digital</h3>
                        <p className="text-[10px] text-agro-100 leading-tight">Aquimaq • Sempre disponível</p>
                    </div>
                </div>
                <button
                    onClick={clearHistory}
                    title="Limpar conversa"
                    className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-white">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8 text-gray-400">
                        <Sparkles size={32} className="mb-3 text-agro-400" />
                        <p className="text-sm font-medium text-gray-500">Olá, parceiro! 👋</p>
                        <p className="text-xs mt-1 max-w-[200px]">
                            Sou o Balconista Digital da Aquimaq. Como posso te ajudar hoje?
                        </p>
                    </div>
                )}

                {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                ))}

                {/* Typing indicator */}
                {isLoading && (
                    <div className="flex justify-start mb-3">
                        <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                            <Loader2 size={14} className="animate-spin text-agro-600" />
                            <span className="text-xs text-gray-500">Assistente digitando...</span>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 px-3 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl"
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Digite sua dúvida..."
                    disabled={isLoading}
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-agro-500/40 focus:border-agro-500 transition-all disabled:opacity-60 placeholder:text-gray-400"
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="p-2.5 bg-agro-600 hover:bg-agro-700 text-white rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
}
