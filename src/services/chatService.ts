import { ENV } from '@/config/env';

// ---------------------------------------------------------------------------
// Tipos compartilhados do Chat
// ---------------------------------------------------------------------------
export interface ChatProduct {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
}

export interface ChatResponse {
    reply: string;
    products: ChatProduct[];
    sessionId: string;
    isHumanTakeover?: boolean;
}

export interface ChatRequest {
    message: string;
    sessionId: string;
    isHumanTakeover: boolean;
}

// ---------------------------------------------------------------------------
// Serviço de comunicação com a Edge Function chat-ai
// ---------------------------------------------------------------------------
const CHAT_FUNCTION_URL = `${ENV.VITE_SUPABASE_URL}/functions/v1/chat-ai`;

export async function sendChatMessage(
    payload: ChatRequest
): Promise<ChatResponse> {
    const res = await fetch(CHAT_FUNCTION_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            apikey: ENV.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(
            (errorBody as Record<string, string>).error ?? `Erro ${res.status}`
        );
    }

    return res.json() as Promise<ChatResponse>;
}
