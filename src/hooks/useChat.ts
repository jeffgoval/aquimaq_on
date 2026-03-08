import { useState, useCallback, useEffect, useRef } from 'react';
import { sendChatMessage, type ChatProduct } from '@/services/chatService';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
export interface ChatMessageData {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    products?: ChatProduct[];
    timestamp: number;
}

interface UseChatReturn {
    messages: ChatMessageData[];
    isLoading: boolean;
    isHumanTakeover: boolean;
    sendMessage: (text: string) => Promise<void>;
    clearHistory: () => void;
}

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'aquimaq_chat_messages';
const SESSION_KEY = 'aquimaq_chat_session';

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getSessionId(): string {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
        id = generateId();
        sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
}

function loadMessages(): ChatMessageData[] {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as ChatMessageData[];
    } catch {
        return [];
    }
}

function persistMessages(messages: ChatMessageData[]): void {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch { /* quota exceeded — silently ignore */ }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useChat(): UseChatReturn {
    const [messages, setMessages] = useState<ChatMessageData[]>(loadMessages);
    const [isLoading, setIsLoading] = useState(false);
    const [isHumanTakeover, setIsHumanTakeover] = useState(false);
    const sessionId = useRef(getSessionId());

    // Persist whenever messages change
    useEffect(() => {
        persistMessages(messages);
    }, [messages]);

    const sendMessage = useCallback(async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || isLoading) return;

        // Add user message
        const userMsg: ChatMessageData = {
            id: generateId(),
            role: 'user',
            content: trimmed,
            timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const res = await sendChatMessage({
                message: trimmed,
                sessionId: sessionId.current,
                isHumanTakeover,
            });

            if (res.isHumanTakeover) {
                setIsHumanTakeover(true);
            }

            const assistantMsg: ChatMessageData = {
                id: generateId(),
                role: 'assistant',
                content: res.reply,
                products: res.products.length > 0 ? res.products : undefined,
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
        } catch (err) {
            const errorMsg: ChatMessageData = {
                id: generateId(),
                role: 'assistant',
                content:
                    'Desculpe, não consegui processar sua mensagem. Tente novamente em instantes.',
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, errorMsg]);
            console.error('Chat error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, isHumanTakeover]);

    const clearHistory = useCallback(() => {
        setMessages([]);
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(SESSION_KEY);
        sessionId.current = getSessionId();
        setIsHumanTakeover(false);
    }, []);

    return { messages, isLoading, isHumanTakeover, sendMessage, clearHistory };
}
