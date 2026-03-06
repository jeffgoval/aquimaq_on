import { env } from "../config/env"
import { logger } from "../utils/logger"

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface Order {
  id: string
  status: string
  total: number
  items: OrderItem[]
  createdAt: string
  trackingCode?: string
}

function supabaseHeaders() {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  }
}

async function getOrder(orderId: string): Promise<Order | null> {
  try {
    // Aceita UUID completo ou fragmento final (8+ chars) que o cliente possa ter colado
    const isUuid = /^[0-9a-f-]{36}$/i.test(orderId)
    const filter = isUuid ? `id=eq.${orderId}` : `id=like.*${orderId.toLowerCase()}`

    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/orders?${filter}&select=id,status,total,tracking_code,created_at,order_items(product_name,quantity,unit_price)&limit=1`,
      { headers: supabaseHeaders() }
    )

    if (!res.ok) {
      logger.warn({ orderId, status: res.status }, "[ECOMMERCE] Erro ao buscar pedido no Supabase")
      return null
    }

    const orders = (await res.json()) as any[]
    if (!orders.length) {
      logger.warn({ orderId }, "[ECOMMERCE] Pedido não encontrado")
      return null
    }

    const o = orders[0]
    return {
      id: String(o.id),
      status: o.status,
      total: Number(o.total),
      items: (o.order_items ?? []).map((i: any) => ({
        name: i.product_name ?? "Produto",
        quantity: i.quantity,
        price: Number(i.unit_price),
      })),
      createdAt: o.created_at,
      trackingCode: o.tracking_code ?? undefined,
    }
  } catch (err) {
    logger.error({ orderId, err }, "[ECOMMERCE] Erro ao buscar pedido")
    return null
  }
}

async function getProductInfo(productId: string): Promise<any> {
  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/products?id=eq.${productId}&select=id,name,price,stock,category,description&limit=1`,
      { headers: supabaseHeaders() }
    )
    if (!res.ok) return null
    const products = (await res.json()) as any[]
    return products[0] ?? null
  } catch {
    return null
  }
}

export const ecommerceService = { getOrder, getProductInfo }
