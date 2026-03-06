import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from "@whiskeysockets/baileys"
import { Boom } from "@hapi/boom"
import path from "path"
import { logger } from "../utils/logger"
import { prisma } from "../db/prisma"
import { env } from "../config/env"
import { handleIncomingMessage } from "./baileys.events"

const sessions = new Map<string, WASocket>()

const BACKOFF_DELAYS = [1000, 5000, 10000, 30000]

export async function createSession(sessionName: string): Promise<WASocket> {
  const sessionDir = path.resolve("sessions", sessionName)

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger as any),
    },
    printQRInTerminal: true,
    logger: logger.child({ module: "baileys" }) as any,
    generateHighQualityLinkPreview: false,
    // Anti-ban: não marcar mensagens como lidas automaticamente
    markOnlineOnConnect: false,
  })

  sessions.set(sessionName, sock)

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      logger.info({ session: sessionName }, "[WA] QR Code gerado - escaneie no terminal")
    }

    if (connection === "open") {
      logger.info({ session: sessionName }, "[WA] Conectado com sucesso")
      await prisma.session.upsert({
        where: { name: sessionName },
        update: { status: "connected", lastSeen: new Date() },
        create: { name: sessionName, status: "connected" },
      })
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut

      logger.warn({ session: sessionName, statusCode }, "[WA] Conexão encerrada")

      await prisma.session.upsert({
        where: { name: sessionName },
        update: { status: "disconnected" },
        create: { name: sessionName, status: "disconnected" },
      })

      if (shouldReconnect) {
        reconnectWithBackoff(sessionName, 0)
      } else {
        logger.error({ session: sessionName }, "[WA] Sessão deslogada - escaneie o QR novamente")
        sessions.delete(sessionName)
      }
    }
  })

  // Receber mensagens
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return
    for (const msg of messages) {
      if (!msg.key.fromMe && msg.message) {
        await handleIncomingMessage(sock, msg)
      }
    }
  })

  return sock
}

async function reconnectWithBackoff(sessionName: string, attempt: number) {
  const delay = BACKOFF_DELAYS[Math.min(attempt, BACKOFF_DELAYS.length - 1)]
  logger.info({ session: sessionName, attempt, delay }, "[WA] Reconectando em ${delay}ms")

  setTimeout(async () => {
    try {
      await createSession(sessionName)
    } catch (err) {
      logger.error({ session: sessionName, err }, "[WA] Falha na reconexão")
      reconnectWithBackoff(sessionName, attempt + 1)
    }
  }, delay)
}

export function getSession(sessionName: string): WASocket | undefined {
  return sessions.get(sessionName)
}

export async function sendMessage(
  sessionName: string,
  phone: string,
  text: string
): Promise<void> {
  const sock = getSession(sessionName)
  if (!sock) throw new Error(`Sessão ${sessionName} não encontrada ou desconectada`)

  const jid = `${phone}@s.whatsapp.net`

  // Anti-ban: simular digitação com jitter
  await sock.sendPresenceUpdate("composing", jid)
  const typingDelay = 1000 + Math.random() * 4000 // 1–5s
  await new Promise((r) => setTimeout(r, typingDelay))
  await sock.sendPresenceUpdate("paused", jid)

  // Jitter antes de enviar
  const sendDelay = 3000 + Math.random() * 6000 // 3–9s
  await new Promise((r) => setTimeout(r, sendDelay))

  await sock.sendMessage(jid, { text })

  logger.info({ session: sessionName, phone }, "[WA] Mensagem enviada")
}
