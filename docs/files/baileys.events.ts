import { WASocket, proto } from "@whiskeysockets/baileys"
import { logger } from "../utils/logger"
import { prisma } from "../db/prisma"
import { aiService } from "../services/ai.service"
import { sendMessage } from "./baileys.client"
import { env } from "../config/env"

export async function handleIncomingMessage(
  sock: WASocket,
  msg: proto.IWebMessageInfo
) {
  const phone = msg.key.remoteJid?.replace("@s.whatsapp.net", "")
  if (!phone) return

  // Ignorar mensagens de grupos
  if (msg.key.remoteJid?.includes("@g.us")) return

  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    ""

  if (!text) return

  logger.info({ phone, text }, "[WA] Mensagem recebida")

  try {
    // Buscar ou criar cliente
    const customer = await prisma.customer.upsert({
      where: { phone },
      update: {},
      create: { phone },
    })

    // Buscar conversa ativa ou criar nova
    let conversation = await prisma.conversation.findFirst({
      where: {
        customerId: customer.id,
        status: { in: ["ai", "human"] },
      },
      orderBy: { createdAt: "desc" },
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { customerId: customer.id, status: "ai" },
      })
    }

    // Salvar mensagem do usuário
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: text,
      },
    })

    // Se conversa está com humano, não processar com IA
    if (conversation.status === "human") {
      logger.info({ phone }, "[WA] Conversa em atendimento humano - ignorando IA")
      return
    }

    // Processar com IA
    const { reply, needsHuman } = await aiService.process({
      conversationId: conversation.id,
      phone,
      message: text,
    })

    // Salvar resposta da IA
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "ai",
        content: reply,
      },
    })

    // Enviar resposta para o cliente
    await sendMessage(env.WA_SESSION_NAME, phone, reply)

    // Fazer handoff se necessário
    if (needsHuman) {
      await doHandoff(conversation.id, phone, text)
    }
  } catch (err) {
    logger.error({ phone, err }, "[WA] Erro ao processar mensagem")
  }
}

async function doHandoff(conversationId: string, customerPhone: string, lastMessage: string) {
  logger.info({ conversationId, customerPhone }, "[WA] Iniciando handoff para vendedor")

  // Atualizar status da conversa
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { status: "human" },
  })

  // Notificar vendedor via WhatsApp
  const notificationText =
    `🔔 *Novo atendimento para você!*\n\n` +
    `📱 Cliente: ${customerPhone}\n` +
    `💬 Última mensagem: "${lastMessage}"\n\n` +
    `A IA não conseguiu resolver. Entre em contato diretamente com o cliente.`

  await sendMessage(env.WA_SESSION_NAME, env.SELLER_PHONE, notificationText)

  logger.info({ customerPhone }, "[WA] Vendedor notificado via WhatsApp")
}
