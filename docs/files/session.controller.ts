import { FastifyRequest, FastifyReply } from "fastify"
import { prisma } from "../db/prisma"
import { createSession, getSession } from "../whatsapp/baileys.client"
import { logger } from "../utils/logger"

export async function listSessions(req: FastifyRequest, reply: FastifyReply) {
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: "desc" },
  })
  return reply.send(sessions)
}

export async function getSessionStatus(req: FastifyRequest, reply: FastifyReply) {
  const { name } = req.params as { name: string }

  const session = await prisma.session.findUnique({ where: { name } })
  if (!session) return reply.status(404).send({ error: "Sessão não encontrada" })

  const isActive = !!getSession(name)
  return reply.send({ ...session, active: isActive })
}

export async function reconnectSession(req: FastifyRequest, reply: FastifyReply) {
  const { name } = req.params as { name: string }

  logger.info({ name }, "[API] Reconectando sessão")
  await createSession(name)

  return reply.send({ success: true, message: "Reconexão iniciada" })
}
