import { FastifyRequest, FastifyReply } from "fastify"
import { z } from "zod"
import { messageService } from "../services/message.service"
import { env } from "../config/env"
import { logger } from "../utils/logger"

const sendSchema = z.object({
  phone: z.string().min(10).max(15),
  text: z.string().min(1).max(4096),
  session: z.string().optional(),
})

const handoffSchema = z.object({
  phone: z.string(),
  status: z.enum(["ai", "human", "closed"]),
})

export async function sendMessage(req: FastifyRequest, reply: FastifyReply) {
  const body = sendSchema.parse(req.body)

  const result = await messageService.send({
    session: body.session ?? env.WA_SESSION_NAME,
    phone: body.phone,
    text: body.text,
  })

  logger.info({ phone: body.phone }, "[API] Mensagem enfileirada")
  return reply.status(202).send({ success: true, jobId: result.jobId })
}

export async function getHistory(req: FastifyRequest, reply: FastifyReply) {
  const { phone } = req.params as { phone: string }

  const conversation = await messageService.getConversationHistory(phone)

  if (!conversation) {
    return reply.status(404).send({ error: "Nenhuma conversa encontrada" })
  }

  return reply.send(conversation)
}

export async function setHandoff(req: FastifyRequest, reply: FastifyReply) {
  const body = handoffSchema.parse(req.body)

  const conversation = await messageService.setConversationStatus(body.phone, body.status)

  logger.info({ phone: body.phone, status: body.status }, "[API] Status da conversa atualizado")
  return reply.send({ success: true, conversation })
}
