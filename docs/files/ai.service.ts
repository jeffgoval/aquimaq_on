import OpenAI from "openai"
import { env } from "../config/env"
import { getHistory } from "./supabase.service"
import { logger } from "../utils/logger"
import { ecommerceService } from "./ecommerce.service"

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Você é a Assistente Virtual da Aquimaq, especializada em ferramentas, peças e sementes para o agronegócio.

Você tem acesso a ferramentas para buscar informações em tempo real. USE-AS sempre que necessário antes de responder.

Regras de ouro:
- Responda SEMPRE em português brasileiro, de forma cordial e objetiva
- NUNCA invente preços, especificações ou prazos — use a ferramenta e informe o que encontrar
- Se não encontrar a informação após usar as ferramentas, seja honesto e ofereça transferir para um atendente
- Use [HANDOFF] no final da resposta para transferir para humano quando:
  • Cliente pedir atendente explicitamente
  • Reclamação grave ou cliente muito insatisfeito
  • Negociação de preço ou condição especial
  • Problema que as ferramentas não resolveram após 2 tentativas`

// ─── Ferramentas disponíveis para o agente ────────────────────────────────────

const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "buscar_pedido",
      description: "Busca detalhes de um pedido: status, total, itens e código de rastreio. Use sempre que o cliente mencionar um ID ou número de pedido.",
      parameters: {
        type: "object",
        properties: {
          order_id: {
            type: "string",
            description: "UUID completo ou fragmento de 8+ caracteres do pedido (ex: 'a1b2c3d4' ou 'a1b2c3d4-e5f6-...')",
          },
        },
        required: ["order_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "buscar_produtos",
      description: "Busca produtos disponíveis no catálogo por nome, categoria ou uso. Use para perguntas sobre preços, disponibilidade e produtos específicos.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Termos de busca descritivos (ex: 'pulverizador costal 20 litros', 'herbicida pré-emergente soja')",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "buscar_conhecimento",
      description: "Busca manuais técnicos, instruções de uso, especificações e documentação. Use para dúvidas técnicas sobre operação, manutenção e calibração.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Pergunta técnica ou termo de busca (ex: 'como calibrar pulverizador', 'troca de óleo motor')",
          },
        },
        required: ["query"],
      },
    },
  },
]

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

async function toolBuscarProdutos(query: string): Promise<string> {
  try {
    // Embedding para busca semântica
    const embRes = await openai.embeddings.create({ model: "text-embedding-3-small", input: query })
    const embedding = embRes.data[0].embedding

    const semRes = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/match_products_semantic`, {
      method: "POST",
      headers: supabaseHeaders(),
      body: JSON.stringify({ query_embedding: embedding, match_threshold: 0.45, match_count: 8 }),
    })
    if (semRes.ok) {
      const products = (await semRes.json()) as any[]
      if (products.length) {
        return products
          .map((p: any) => `• ${p.name}: R$ ${Number(p.price).toFixed(2)} | ${p.stock > 0 ? `Em estoque (${p.stock} un.)` : "Indisponível"} | ${p.category || "Geral"}`)
          .join("\n")
      }
    }

    // Fallback keyword
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

async function toolBuscarConhecimento(query: string): Promise<string> {
  try {
    const embRes = await openai.embeddings.create({ model: "text-embedding-3-small", input: query })
    const embedding = embRes.data[0].embedding

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/match_knowledge_base`, {
      method: "POST",
      headers: supabaseHeaders(),
      body: JSON.stringify({ query_embedding: embedding, match_threshold: 0.60, match_count: 4 }),
    })
    if (!res.ok) return "Erro ao consultar base de conhecimento."
    const docs = (await res.json()) as Array<{ title: string; content: string }>
    if (!docs.length) return "Nenhuma documentação técnica encontrada para essa consulta."
    return docs.map((d) => `[${d.title}]\n${d.content}`).join("\n\n---\n\n")
  } catch {
    return "Erro ao consultar base de conhecimento."
  }
}

async function executeTool(name: string, args: Record<string, string>): Promise<string> {
  switch (name) {
    case "buscar_pedido":
      return toolBuscarPedido(args.order_id)
    case "buscar_produtos":
      return toolBuscarProdutos(args.query)
    case "buscar_conhecimento":
      return toolBuscarConhecimento(args.query)
    default:
      return "Ferramenta desconhecida."
  }
}

// ─── Loop do agente ───────────────────────────────────────────────────────────

const MAX_ITERATIONS = 6

async function runAgentLoop(
  messages: OpenAI.Chat.ChatCompletionMessageParam[]
): Promise<{ reply: string; needsHuman: boolean }> {
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools: TOOLS,
      tool_choice: "auto",
      max_tokens: 1000,
      temperature: 0.3,
    })

    const choice = response.choices[0]
    const assistantMsg = choice.message

    // Agente quer usar ferramentas
    if (choice.finish_reason === "tool_calls" && assistantMsg.tool_calls?.length) {
      messages.push(assistantMsg)
      logger.info({ tools: assistantMsg.tool_calls.map((t) => t.function.name) }, "[AGENT] Chamando ferramentas")

      for (const toolCall of assistantMsg.tool_calls) {
        let result: string
        try {
          const args = JSON.parse(toolCall.function.arguments) as Record<string, string>
          result = await executeTool(toolCall.function.name, args)
        } catch (err) {
          result = `Erro ao executar ferramenta: ${err}`
        }
        messages.push({ role: "tool", tool_call_id: toolCall.id, content: result })
      }
      continue
    }

    // Resposta final
    const rawReply = assistantMsg.content ?? "Desculpe, não consegui processar. Tente novamente."
    const needsHuman = rawReply.includes("[HANDOFF]")
    const reply = rawReply
      .replace("[HANDOFF]", "")
      .trim()
      .concat(needsHuman ? "\n\nTransferindo você para um de nossos atendentes. Aguarde um momento!" : "")

    return { reply, needsHuman }
  }

  // Limite de iterações atingido
  logger.warn("[AGENT] Limite de iterações atingido — handoff")
  return {
    reply: "Não consegui resolver sua solicitação agora. Um atendente vai ajudar você em breve!",
    needsHuman: true,
  }
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

  const history = await getHistory(conversationId, 12)

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: (m.sender_type === "customer" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ]

  logger.info({ conversationId, phone }, "[AGENT] Iniciando agente")
  const result = await runAgentLoop(messages)
  logger.info({ conversationId, needsHuman: result.needsHuman }, "[AGENT] Concluído")

  return result
}

export const aiService = { process }
