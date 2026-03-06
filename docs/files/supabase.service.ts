/**
 * Supabase REST client para o bot VPS.
 * Usa fetch nativo — sem SDK — para manter o bundle leve.
 */
import { env } from "../config/env"

function headers(prefer?: string): Record<string, string> {
  const h: Record<string, string> = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  }
  if (prefer) h["Prefer"] = prefer
  return h
}

async function rest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1${path}`, {
    ...init,
    headers: { ...headers(), ...(init?.headers as Record<string, string> ?? {}) },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Supabase REST ${res.status}: ${body}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : ([] as unknown as T)
}

// ─── Sessão WhatsApp ──────────────────────────────────────────────────────────

export type WaSession = {
  id: string
  phone: string
  conversation_id: string | null
  human_mode: boolean
  assigned_agent: string | null
  unread_count: number
}

export async function getSession(phone: string): Promise<WaSession | null> {
  const rows = await rest<WaSession[]>(
    `/whatsapp_sessions?phone=eq.${encodeURIComponent(phone)}&limit=1`
  )
  return rows[0] ?? null
}

export async function upsertSession(data: Partial<WaSession> & { phone: string }): Promise<void> {
  await rest(`/whatsapp_sessions`, {
    method: "POST",
    headers: headers("resolution=merge-duplicates"),
    body: JSON.stringify(data),
  })
}

export async function updateSession(phone: string, data: Partial<WaSession>): Promise<void> {
  await rest(`/whatsapp_sessions?phone=eq.${encodeURIComponent(phone)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

// ─── Conversas ────────────────────────────────────────────────────────────────

export type WaConversation = {
  id: string
  status: string
  channel: string
  contact_phone: string | null
  assigned_agent: string | null
  current_queue_state: string
}

export async function getConversation(id: string): Promise<WaConversation | null> {
  const rows = await rest<WaConversation[]>(`/chat_conversations?id=eq.${id}&limit=1`)
  return rows[0] ?? null
}

export async function createConversation(phone: string): Promise<WaConversation> {
  const rows = await rest<WaConversation[]>(`/chat_conversations`, {
    method: "POST",
    headers: headers("return=representation"),
    body: JSON.stringify({
      status: "active",
      channel: "whatsapp",
      subject: "Atendimento WhatsApp",
      contact_phone: phone,
      current_queue_state: "bot",
      assigned_agent: null,
      customer_id: null,
    }),
  })
  return rows[0]
}

export async function updateConversation(id: string, data: Partial<WaConversation> & Record<string, unknown>): Promise<void> {
  await rest(`/chat_conversations?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ ...data, updated_at: new Date().toISOString() }),
  })
}

// ─── Mensagens ────────────────────────────────────────────────────────────────

export type WaMessage = {
  id?: string
  conversation_id: string
  sender_type: "customer" | "ai_agent" | "human_agent"
  sender_id?: string | null
  content: string
  external_message_id?: string | null
  delivery_status?: string
  metadata?: Record<string, unknown>
}

export async function saveMessage(msg: WaMessage): Promise<void> {
  await rest(`/chat_messages`, {
    method: "POST",
    body: JSON.stringify(msg),
  })
}

export async function getHistory(
  conversationId: string,
  limit = 12
): Promise<Array<{ sender_type: string; content: string }>> {
  return rest(
    `/chat_messages?conversation_id=eq.${conversationId}&order=created_at.asc&limit=${limit}&select=sender_type,content`
  )
}

// ─── Status do bot (heartbeat) ────────────────────────────────────────────────

export async function updateBotStatus(
  status: "connected" | "disconnected" | "connecting",
  phoneNumber?: string
): Promise<void> {
  await rest(`/whatsapp_bot_status`, {
    method: "POST",
    headers: headers("resolution=merge-duplicates"),
    body: JSON.stringify({
      id: "default",
      status,
      phone_number: phoneNumber ?? null,
      last_seen: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  })
}

export async function incrementBotStat(field: "messages_today" | "handoffs_today"): Promise<void> {
  await rest(`/rpc/increment_bot_stat`, {
    method: "POST",
    body: JSON.stringify({ stat_field: field }),
  }).catch(() => {/* ignore if RPC not available */})
}
