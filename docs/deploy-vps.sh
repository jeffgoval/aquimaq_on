#!/bin/bash
# Deploy script — roda no VPS como root ou com sudo
# Copia novos arquivos do bot e reinicia o processo PM2
set -e

BOT_DIR="/opt/aquimaq-bot"

echo "=== 1/4  Copiando supabase.service.ts ==="
cat > "$BOT_DIR/src/services/supabase.service.ts" << 'ENDOFFILE'
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
  }).catch((e) => console.error("[heartbeat] erro:", e))
}

export async function incrementBotStat(field: "messages_today" | "handoffs_today"): Promise<void> {
  await rest(`/rpc/increment_bot_stat`, {
    method: "POST",
    body: JSON.stringify({ stat_field: field }),
  }).catch(() => {/* ignore if RPC not available */})
}
ENDOFFILE

echo "=== 2/4  Copiando baileys.events.ts ==="
cat > "$BOT_DIR/src/whatsapp/baileys.events.ts" << 'ENDOFFILE'
import { WASocket, proto } from "@whiskeysockets/baileys"
import { logger } from "../utils/logger"
import { aiService } from "../services/ai.service"
import { sendMessage } from "./baileys.client"
import { env } from "../config/env"
import {
  getSession,
  upsertSession,
  updateSession,
  createConversation,
  updateConversation,
  saveMessage,
  incrementBotStat,
} from "../services/supabase.service"

export async function handleIncomingMessage(
  _sock: WASocket,
  msg: proto.IWebMessageInfo
) {
  const remoteJid = msg.key.remoteJid
  if (!remoteJid) return
  if (remoteJid.includes("@g.us") || remoteJid.includes("@broadcast")) return

  const phone = remoteJid.replace(/@.*$/, "")

  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    ""

  if (!text) return

  logger.info({ phone, text }, "[WA] Mensagem recebida")

  try {
    const session = await getSession(phone)
    let conversationId = session?.conversation_id ?? null
    const humanMode = session?.human_mode ?? false

    if (!conversationId) {
      const conv = await createConversation(phone)
      conversationId = conv.id
      await upsertSession({
        phone,
        conversation_id: conversationId,
        human_mode: false,
        assigned_agent: null,
        unread_count: 1,
      })
    } else {
      await updateSession(phone, {
        unread_count: (session?.unread_count ?? 0) + 1,
      })
    }

    await saveMessage({
      conversation_id: conversationId,
      sender_type: "customer",
      content: text,
      external_message_id: msg.key.id ?? null,
      delivery_status: "delivered",
      metadata: { channel: "whatsapp", source: "baileys" },
    })

    await updateConversation(conversationId, {
      status: "active",
      current_queue_state: humanMode ? "assigned" : "bot",
    })

    if (humanMode) {
      logger.info({ phone }, "[WA] Modo humano — ignorando IA")
      return
    }

    const { reply, needsHuman } = await aiService.process({
      conversationId,
      phone,
      message: text,
    })

    await saveMessage({
      conversation_id: conversationId,
      sender_type: "ai_agent",
      content: reply,
      delivery_status: "sent",
      metadata: { channel: "whatsapp" },
    })

    await incrementBotStat("messages_today")

    let sent = false
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        await sendMessage(env.WA_SESSION_NAME, remoteJid, reply)
        sent = true
        break
      } catch (sendErr: any) {
        if (attempt < 3) {
          logger.warn({ phone, attempt, err: sendErr?.message }, "[WA] Erro ao enviar, aguardando...")
          await new Promise((r) => setTimeout(r, 3000))
        }
      }
    }
    if (!sent) logger.error({ phone }, "[WA] Falha definitiva ao enviar após 4 tentativas")

    if (needsHuman) {
      await doHandoff(conversationId, phone)
    }
  } catch (err) {
    logger.error({ phone, err }, "[WA] Erro ao processar mensagem")
  }
}

async function doHandoff(conversationId: string, phone: string) {
  logger.info({ conversationId, phone }, "[WA] Handoff — marcando waiting_human no Supabase")

  await updateConversation(conversationId, {
    status: "waiting_human",
    current_queue_state: "waiting_human",
    assigned_agent: null,
  })

  await updateSession(phone, { human_mode: false, assigned_agent: null })
  await incrementBotStat("handoffs_today")
}
ENDOFFILE

echo "=== 3/4  Copiando ai.service.ts ==="
cat > "$BOT_DIR/src/services/ai.service.ts" << 'ENDOFFILE'
import OpenAI from "openai"
import { env } from "../config/env"
import { getHistory } from "./supabase.service"
import { logger } from "../utils/logger"
import { ecommerceService } from "./ecommerce.service"

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Você é a Assistente Virtual da Aquimaq, especializada em ferramentas, peças e sementes para o agronegócio.

Você tem acesso a ferramentas para buscar informações em tempo real. USE-AS sempre que necessário antes de responder.

Regras de ouro:
- Responda SEMPRE em português brasileiro, de forma cordial e objetiva
- NUNCA invente preços, especificações ou prazos — use a ferramenta e informe o que encontrar
- Se não encontrar a informação após usar as ferramentas, seja honesto e ofereça transferir para um atendente
- Use [HANDOFF] no final da resposta para transferir para humano quando:
  • Cliente pedir atendente explicitamente
  • Reclamação grave ou cliente muito insatisfeito
  • Negociação de preço ou condição especial
  • Problema que as ferramentas não resolveram após 2 tentativas`

// ─── Ferramentas disponíveis para o agente ────────────────────────────────────

const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "buscar_pedido",
      description: "Busca detalhes de um pedido: status, total, itens e código de rastreio. Use sempre que o cliente mencionar um ID ou número de pedido.",
      parameters: {
        type: "object",
        properties: {
          order_id: {
            type: "string",
            description: "UUID completo ou fragmento de 8+ caracteres do pedido (ex: 'a1b2c3d4' ou 'a1b2c3d4-e5f6-...')",
          },
        },
        required: ["order_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "buscar_produtos",
      description: "Busca produtos disponíveis no catálogo por nome, categoria ou uso. Use para perguntas sobre preços, disponibilidade e produtos específicos.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Termos de busca descritivos (ex: 'pulverizador costal 20 litros', 'herbicida pré-emergente soja')",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "buscar_conhecimento",
      description: "Busca manuais técnicos, instruções de uso, especificações e documentação. Use para dúvidas técnicas sobre operação, manutenção e calibração.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Pergunta técnica ou termo de busca (ex: 'como calibrar pulverizador', 'troca de óleo motor')",
          },
        },
        required: ["query"],
      },
    },
  },
]

// ─── Implementação das ferramentas ────────────────────────────────────────────

function supabaseHeaders() {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  }
}

async function toolBuscarPedido(orderId: string): Promise<string> {
  const order = await ecommerceService.getOrder(orderId)
  if (!order) return "Pedido não encontrado. Verifique o ID e tente novamente."
  const items = order.items
    .map((i) => `${i.name} (x${i.quantity}) — R$ ${Number(i.price).toFixed(2)}`)
    .join("; ")
  return JSON.stringify({
    id: order.id,
    status: order.status,
    total: `R$ ${Number(order.total).toFixed(2)}`,
    itens: items,
    rastreio: order.trackingCode ?? "sem rastreio",
    criado_em: order.createdAt,
  })
}

async function toolBuscarProdutos(query: string): Promise<string> {
  try {
    const embRes = await openai.embeddings.create({ model: "text-embedding-3-small", input: query })
    const embedding = embRes.data[0].embedding

    const semRes = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/match_products_semantic`, {
      method: "POST",
      headers: supabaseHeaders(),
      body: JSON.stringify({ query_embedding: embedding, match_threshold: 0.45, match_count: 8 }),
    })
    if (semRes.ok) {
      const products = (await semRes.json()) as any[]
      if (products.length) {
        return products
          .map((p: any) => `• ${p.name}: R$ ${Number(p.price).toFixed(2)} | ${p.stock > 0 ? `Em estoque (${p.stock} un.)` : "Indisponível"} | ${p.category || "Geral"}`)
          .join("\n")
      }
    }

    const ignoreWords = new Set(["tem", "preco", "preço", "valor", "estoque", "quanto", "custa", "vende", "vocês"])
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3 && !ignoreWords.has(w))

    if (!terms.length) return "Nenhum produto encontrado. Tente termos mais específicos."

    const orFilter = terms.map((t) => `name.ilike.*${t}*,category.ilike.*${t}*`).join(",")
    const kwRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/products?is_active=eq.true&or=(${orFilter})&select=name,price,stock,category&limit=8`,
      { headers: supabaseHeaders() }
    )
    if (!kwRes.ok) return "Erro ao buscar produtos."
    const products = (await kwRes.json()) as any[]
    if (!products.length) return "Nenhum produto encontrado para essa busca."
    return products
      .map((p: any) => `• ${p.name}: R$ ${Number(p.price).toFixed(2)} | ${p.stock > 0 ? `Em estoque (${p.stock} un.)` : "Indisponível"} | ${p.category || "Geral"}`)
      .join("\n")
  } catch {
    return "Erro ao consultar catálogo de produtos."
  }
}

async function toolBuscarConhecimento(query: string): Promise<string> {
  try {
    const embRes = await openai.embeddings.create({ model: "text-embedding-3-small", input: query })
    const embedding = embRes.data[0].embedding

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/match_knowledge_base`, {
      method: "POST",
      headers: supabaseHeaders(),
      body: JSON.stringify({ query_embedding: embedding, match_threshold: 0.60, match_count: 4 }),
    })
    if (!res.ok) return "Erro ao consultar base de conhecimento."
    const docs = (await res.json()) as Array<{ title: string; content: string }>
    if (!docs.length) return "Nenhuma documentação técnica encontrada para essa consulta."
    return docs.map((d) => `[${d.title}]\n${d.content}`).join("\n\n---\n\n")
  } catch {
    return "Erro ao consultar base de conhecimento."
  }
}

async function executeTool(name: string, args: Record<string, string>): Promise<string> {
  switch (name) {
    case "buscar_pedido":
      return toolBuscarPedido(args.order_id)
    case "buscar_produtos":
      return toolBuscarProdutos(args.query)
    case "buscar_conhecimento":
      return toolBuscarConhecimento(args.query)
    default:
      return "Ferramenta desconhecida."
  }
}

// ─── Loop do agente ───────────────────────────────────────────────────────────

const MAX_ITERATIONS = 6

async function runAgentLoop(
  messages: OpenAI.Chat.ChatCompletionMessageParam[]
): Promise<{ reply: string; needsHuman: boolean }> {
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools: TOOLS,
      tool_choice: "auto",
      max_tokens: 1000,
      temperature: 0.3,
    })

    const choice = response.choices[0]
    const assistantMsg = choice.message

    if (choice.finish_reason === "tool_calls" && assistantMsg.tool_calls?.length) {
      messages.push(assistantMsg)
      logger.info({ tools: assistantMsg.tool_calls.map((t) => t.function.name) }, "[AGENT] Chamando ferramentas")

      for (const toolCall of assistantMsg.tool_calls) {
        let result: string
        try {
          const args = JSON.parse(toolCall.function.arguments) as Record<string, string>
          result = await executeTool(toolCall.function.name, args)
        } catch (err) {
          result = `Erro ao executar ferramenta: ${err}`
        }
        messages.push({ role: "tool", tool_call_id: toolCall.id, content: result })
      }
      continue
    }

    const rawReply = assistantMsg.content ?? "Desculpe, não consegui processar. Tente novamente."
    const needsHuman = rawReply.includes("[HANDOFF]")
    const reply = rawReply
      .replace("[HANDOFF]", "")
      .trim()
      .concat(needsHuman ? "\n\nTransferindo você para um de nossos atendentes. Aguarde um momento!" : "")

    return { reply, needsHuman }
  }

  logger.warn("[AGENT] Limite de iterações atingido — handoff")
  return {
    reply: "Não consegui resolver sua solicitação agora. Um atendente vai ajudar você em breve!",
    needsHuman: true,
  }
}

// ─── Entrada pública ──────────────────────────────────────────────────────────

interface ProcessInput {
  conversationId: string
  phone: string
  message: string
}

interface ProcessOutput {
  reply: string
  needsHuman: boolean
}

async function process(input: ProcessInput): Promise<ProcessOutput> {
  const { conversationId, phone, message } = input

  const history = await getHistory(conversationId, 12)

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: (m.sender_type === "customer" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ]

  logger.info({ conversationId, phone }, "[AGENT] Iniciando agente")
  const result = await runAgentLoop(messages)
  logger.info({ conversationId, needsHuman: result.needsHuman }, "[AGENT] Concluído")

  return result
}

export const aiService = { process }
ENDOFFILE

echo "=== 4/4  Adicionando heartbeat ao baileys.client.ts ==="

# Verifica se o heartbeat já existe
if grep -q "updateBotStatus" "$BOT_DIR/src/whatsapp/baileys.client.ts"; then
  echo "    Heartbeat já presente — pulando."
else
  # Adiciona import do updateBotStatus logo após os outros imports
  node - << 'NODEEOF'
const fs = require("fs")
const file = "/opt/aquimaq-bot/src/whatsapp/baileys.client.ts"
let src = fs.readFileSync(file, "utf8")

// 1) Adiciona import
const importLine = 'import { updateBotStatus } from "../services/supabase.service"\n'
src = src.replace(/^(import .+\n)(?!import)/m, (m) => m + importLine)

// 2) No evento "connection.update", adiciona chamadas de heartbeat após o logger
// Padrão esperado: sock.ev.on("connection.update", ...
// Insere updateBotStatus nas transições de estado

// Insere no bloco connection.update — após a linha que loga "conectado"
src = src.replace(
  /logger\.info\([^)]*"connected"[^)]*\)/,
  (m) => m + '\n      updateBotStatus("connected", update.qr ? undefined : undefined).catch(() => {})'
)

// Marca heartbeat a cada 30s quando conectado
const heartbeatCode = `
// ─── Heartbeat a cada 30 s ────────────────────────────────────────────────────
setInterval(async () => {
  if (currentQR === null) {
    await updateBotStatus("connected").catch(() => {})
  }
}, 30_000)
`

// Adiciona antes do export default / module.exports / última linha exportando
if (!src.includes("setInterval") && !src.includes("Heartbeat")) {
  src = src.replace(/^(export (default|const|function|async function) \w)/m, heartbeatCode + "\n$1")
}

fs.writeFileSync(file, src)
console.log("    baileys.client.ts atualizado com heartbeat.")
NODEEOF
fi

echo ""
echo "=== Reiniciando PM2 ==="
pm2 restart aquimaq-bot --update-env
pm2 save

echo ""
echo "=== Pronto! ==="
echo "Aguarde ~30s e verifique o painel /admin/whatsapp"
pm2 logs aquimaq-bot --lines 20 --nostream
