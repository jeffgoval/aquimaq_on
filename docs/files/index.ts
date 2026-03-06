import "dotenv/config"
import { env } from "./config/env"
import { logger } from "./utils/logger"
import { startServer } from "./api/server"
import { createSession } from "./whatsapp/baileys.client"
import { startWorker } from "./queue/queue.worker"
import { prisma } from "./db/prisma"

async function main() {
  logger.info("🚀 Iniciando WhatsApp API...")

  // Conectar banco
  await prisma.$connect()
  logger.info("[DB] Conectado ao PostgreSQL")

  // Iniciar worker de fila
  startWorker()
  logger.info("[QUEUE] Worker BullMQ iniciado")

  // Iniciar sessão WhatsApp
  await createSession(env.WA_SESSION_NAME)
  logger.info(`[WA] Sessão '${env.WA_SESSION_NAME}' iniciada`)

  // Iniciar servidor HTTP
  await startServer()

  // Graceful shutdown
  process.on("SIGINT", async () => {
    logger.info("Encerrando serviço...")
    await prisma.$disconnect()
    process.exit(0)
  })
}

main().catch((err) => {
  logger.error(err, "Erro fatal ao iniciar")
  process.exit(1)
})
