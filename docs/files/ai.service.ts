import OpenAI from "openai"
import { env } from "../config/env"
import { getHistory } from "./supabase.service"
import { logger } from "../utils/logger"
import { ecommerceService } from "./ecommerce.service"

// ─── Tipos das configs ────────────────────────────────────────────────────────

interface AgentConfig {
  apiKey: string
  chatModel: string
  systemPrompt: string
  temperature: number
  maxTokens: number
  maxIterations: number
  activeTools: string[]
  ragThreshold: number
  productThreshold: number
  handoffTriggers: string[]
}

// ─── Default system prompt ────────────────────────────────────────────────────

const DEFAULT_SYSTEM_PROMPT = `Você é a Assistente Virtual da Aquimaq, especializada em ferramentas, peças e sementes para o agronegócio.

Você tem acesso a ferramentas para buscar informações em tempo real. USE-AS sempre que necessário antes de responder.

Regras:
- Responda SEMPRE em português brasileiro, de forma cordial e objetiva
- NUNCA invente preços, especificações ou prazos — use a ferramenta e informe o que encontrar
- Se não encontrar a informação após usar as ferramentas, seja honesto e ofereça transferir para um atendente
- Use [HANDOFF] no final da resposta para transferir para humano quando:
  • Cliente pedir atendente explicitamente
  • Reclamação grave ou cliente muito insatisfeito
  • Negociação de preço ou condição especial
  • Problema que as ferramentas não resolveram após 2 tentativas`

// ─── Leitura das configs do Supabase ─────────────────────────────────────────

async function loadConfig(): Promise<AgentConfig> {
  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/ai_settings?select=api_key,chat_model,system_prompt,temperature,max_tokens,max_iterations,active_tools,rag_threshold,product_threshold,handoff_triggers&limit=1`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          Accept: "application/json",
        },
      }
    )
    const rows = res.ok ? await res.json() : []
    const d = rows[0] ?? {}

    const triggers = (d.handoff_triggers ?? "atendente,quero falar com humano,preciso de ajuda humana")
      .split(",")
      .map((t: string) => t.trim().toLowerCase())
      .filter(Boolean)

    return {
      apiKey:           d.api_key          ?? env.OPENAI_API_KEY,
      chatModel:        d.chat_model       ?? "gpt-4o-mini",
      systemPrompt:     d.system_prompt    ?? DEFAULT_SYSTEM_PROMPT,
      temperature:      Number(d.temperature    ?? 0.3),
      maxTokens:        Number(d.max_tokens     ?? 1000),
      maxIterations:    Number(d.max_iterations ?? 6),
      activeTools:      Array.isArray(d.active_tools) ? d.active_tools : ["buscar_produtos", "buscar_pedido", "buscar_conhecimento"],
      ragThreshold:     Number(d.rag_threshold     ?? 0.60),
      productThreshold: Number(d.product_threshold ?? 0.45),
      handoffTriggers:  triggers,
    }
  } catch (e) {
    logger.warn({ e }, "[AGENT] Falha ao carregar config, usando defaults")
    return {
      apiKey:           env.OPENAI_API_KEY,
      chatModel:        "gpt-4o-mini",
      systemPrompt:     DEFAULT_SYSTEM_PROMPT,
      temperature:      0.3,
      maxTokens:        1000,
      maxIterations:    6,
      activeTools:      ["buscar_produtos", "buscar_pedido", "buscar_conhecimento"],
      ragThreshold:     0.60,
      productThreshold: 0.45,
      handoffTriggers:  ["atendente", "quero falar com humano", "preciso de ajuda humana"],
    }
  }
}

// ─── Definições das ferramentas ───────────────────────────────────────────────

const TOOL_DEFINITIONS: Record<string, OpenAI.Chat.ChatCompletionTool> = {
  buscar_pedido: {
    type: "function",
    function: {
      name: "buscar_pedido",
      description: "Busca detalhes de um pedido: status, total, itens e código de rastreio.",
      parameters: {
        type: "object",
        properties: {
          order_id: { type: "string", description: "UUID ou fragmento do pedido" },
        },
        required: ["order_id"],
      },
    },
  },
  buscar_produtos: {
    type: "function",
    function: {
      name: "buscar_produtos",
      description: "Busca produtos disponíveis no catálogo por nome, categoria ou uso.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Termos de busca descritivos" },
        },
        required: ["query"],
      },
    },
  },
  buscar_conhecimento: {
    type: "function",
    function: {
      name: "buscar_conhecimento",
      description: "Busca manuais técnicos, instruções de uso e documentação.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Pergunta técnica ou termo de busca" },
        },
        required: ["query"],
      },
    },
  },
}

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

async function toolBuscarProdutos(query: string, openai: OpenAI, productThreshold: number): Promise<string> {
  try {
    const embRes = await openai.embeddings.create({ model: "text-embedding-3-small", input: query })
    const embedding = embRes.data[0].embedding

    const semRes = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/match_products_semantic`, {
      method: "POST",
      headers: supabaseHeaders(),
      body: JSON.stringify({ query_embedding: embedding, match_threshold: productThreshold, match_count: 8 }),
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

async function toolBuscarConhecimento(query: string, openai: OpenAI, ragThreshold: number): Promise<string> {
  try {
    const embRes = await openai.embeddings.create({ model: "text-embedding-3-small", input: query })
    const embedding = embRes.data[0].embedding

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/match_knowledge_base`, {
      method: "POST",
      headers: supabaseHeaders(),
      body: JSON.stringify({ query_embedding: embedding, match_threshold: ragThreshold, match_count: 4 }),
    })
    if (!res.ok) return "Erro ao consultar base de conhecimento."
    const docs = (await res.json()) as Array<{ title: string; content: string }>
    if (!docs.length) return "Nenhuma documentação técnica encontrada para essa consulta."
    return docs.map((d) => `[${d.title}]\n${d.content}`).join("\n\n---\n\n")
  } catch {
    return "Erro ao consultar base de conhecimento."
  }
}

// ─── Loop do agente ───────────────────────────────────────────────────────────

async function runAgentLoop(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  config: AgentConfig,
  openai: OpenAI
): Promise<{ reply: string; needsHuman: boolean }> {
  const tools = config.activeTools
    .filter((id) => TOOL_DEFINITIONS[id])
    .map((id) => TOOL_DEFINITIONS[id])

  for (let i = 0; i < config.maxIterations; i++) {
    const response = await openai.chat.completions.create({
      model: config.chatModel,
      messages,
      tools: tools.length ? tools : undefined,
      tool_choice: tools.length ? "auto" : undefined,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    })

    const choice = response.choices[0]
    const assistantMsg = choice.message

    if (choice.finish_reason === "tool_calls" && assistantMsg.tool_calls?.length) {
      messages.push(assistantMsg)
      logger.info({ tools: assistantMsg.tool_calls.map((t) => t.function.name) }, "[AGENT] Ferramentas")

      for (const toolCall of assistantMsg.tool_calls) {
        let result: string
        try {
          const args = JSON.parse(toolCall.function.arguments) as Record<string, string>
          switch (toolCall.function.name) {
            case "buscar_pedido":
              result = await toolBuscarPedido(args.order_id)
              break
            case "buscar_produtos":
              result = await toolBuscarProdutos(args.query, openai, config.productThreshold)
              break
            case "buscar_conhecimento":
              result = await toolBuscarConhecimento(args.query, openai, config.ragThreshold)
              break
            default:
              result = "Ferramenta desconhecida."
          }
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

  logger.warn("[AGENT] Limite de iterações — handoff")
  return {
    reply: "Não consegui resolver sua solicitação. Um atendente vai ajudar você em breve!",
    needsHuman: true,
  }
}

// ─── Verificação de gatilhos ──────────────────────────────────────────────────

function checkHandoffTriggers(message: string, triggers: string[]): boolean {
  const lower = message.toLowerCase()
  return triggers.some((t) => lower.includes(t))
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

  // Carrega configs a cada chamada — reflete mudanças do painel sem reiniciar o bot
  const config = await loadConfig()
  const openai = new OpenAI({ apiKey: config.apiKey })

  // Gatilhos de transferência imediata (sem chamar IA)
  if (checkHandoffTriggers(message, config.handoffTriggers)) {
    logger.info({ phone }, "[AGENT] Gatilho de handoff detectado")
    return {
      reply: "Entendido! Vou transferir você para um de nossos atendentes agora. Aguarde um momento!",
      needsHuman: true,
    }
  }

  const history = await getHistory(conversationId, 12)

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: config.systemPrompt },
    ...history.map((m) => ({
      role: (m.sender_type === "customer" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ]

  logger.info({ conversationId, phone, model: config.chatModel }, "[AGENT] Iniciando")
  const result = await runAgentLoop(messages, config, openai)
  logger.info({ conversationId, needsHuman: result.needsHuman }, "[AGENT] Concluído")

  return result
}

export const aiService = { process }
