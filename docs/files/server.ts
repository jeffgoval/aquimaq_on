import Fastify from "fastify"
import cors from "@fastify/cors"
import rateLimit from "@fastify/rate-limit"
import { env } from "../config/env"
import { logger } from "../utils/logger"
import { messageRoutes } from "../routes/message.routes"
import { sessionRoutes } from "../routes/session.routes"

export async function buildServer() {
  const app = Fastify({ logger: false })

  // CORS
  await app.register(cors, { origin: true })

  // Rate limit
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    errorResponseBuilder: () => ({
      error: "Too Many Requests",
      message: "Limite de 100 requisições por minuto atingido",
    }),
  })

  // Auth middleware via API Key
  app.addHook("preHandler", async (req, reply) => {
    const apiKey = req.headers["x-api-key"]
    if (apiKey !== env.API_KEY) {
      return reply.status(401).send({ error: "API Key inválida" })
    }
  })

  // Health check (sem auth)
  app.get("/health", { config: { skipAuth: true } }, async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))

  // Rotas
  await app.register(messageRoutes, { prefix: "/message" })
  await app.register(sessionRoutes, { prefix: "/session" })

  return app
}

export async function startServer() {
  const app = await buildServer()

  await app.listen({ port: env.PORT, host: "0.0.0.0" })
  logger.info({ port: env.PORT }, "[API] Servidor iniciado")

  return app
}
