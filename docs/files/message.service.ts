import { messageQueue } from "../queue/message.queue"
import { prisma } from "../db/prisma"
import { logger } from "../utils/logger"

interface SendMessageInput {
  session: string
  phone: string
  text: string
  metadata?: Record<string, any>
}

async function send(input: SendMessageInput) {
  const { session, phone, text, metadata } = input

  logger.info({ phone, session }, "[SERVICE] Enfileirando mensagem")

  const job = await messageQueue.add(
    "send-message",
    { session, phone, text, metadata },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  )

  return { jobId: job.id }
}

async function getConversationHistory(phone: string) {
  const customer = await prisma.customer.findUnique({
    where: { phone },
    include: {
      conversations: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 20,
          },
        },
      },
    },
  })

  return customer?.conversations[0] ?? null
}

async function setConversationStatus(phone: string, status: "ai" | "human" | "closed") {
  const customer = await prisma.customer.findUnique({ where: { phone } })
  if (!customer) throw new Error("Cliente não encontrado")

  const conversation = await prisma.conversation.findFirst({
    where: { customerId: customer.id, status: { in: ["ai", "human"] } },
    orderBy: { createdAt: "desc" },
  })

  if (!conversation) throw new Error("Conversa ativa não encontrada")

  return prisma.conversation.update({
    where: { id: conversation.id },
    data: { status },
  })
}

export const messageService = { send, getConversationHistory, setConversationStatus }
