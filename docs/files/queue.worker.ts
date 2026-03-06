import { Worker, Job } from "bullmq"
import { env } from "../config/env"
import { sendMessage } from "../whatsapp/baileys.client"
import { logger } from "../utils/logger"

interface MessageJobData {
  session: string
  phone: string
  text: string
  metadata?: Record<string, any>
}

export function startWorker() {
  const worker = new Worker<MessageJobData>(
    "messages",
    async (job: Job<MessageJobData>) => {
      const { session, phone, text } = job.data

      logger.info({ jobId: job.id, phone }, "[WORKER] Processando mensagem")

      await sendMessage(session, phone, text)

      logger.info({ jobId: job.id, phone }, "[WORKER] Mensagem enviada com sucesso")
    },
    {
      connection: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
      },
      concurrency: 3, // máx 3 mensagens simultâneas (anti-ban)
    }
  )

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id }, "[WORKER] Job concluído")
  })

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err }, "[WORKER] Job falhou")
  })

  logger.info("[WORKER] Worker iniciado")

  return worker
}
