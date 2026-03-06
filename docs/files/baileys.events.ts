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
}
