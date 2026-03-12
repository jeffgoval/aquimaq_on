/**
 * Tipos para gestão de mensagens WhatsApp e templates Meta.
 */

export type WhatsappTemplateMetaStatus = 'rascunho' | 'submetido' | 'aprovado';

export interface WhatsappTemplateRow {
  id: string;
  slug: string;
  name: string;
  body: string;
  meta_status: WhatsappTemplateMetaStatus;
  meta_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface N8nWebhookLogRow {
  id: string;
  event_type: string;
  payload: Record<string, unknown> | null;
  status: string;
  created_at: string;
  processed_at: string | null;
}

export interface CartAbandonedPayload {
  user_id: string;
  phone: string;
  name: string;
  email?: string;
  items: unknown[];
  subtotal: number;
  item_count: number;
  cart_updated_at: string;
}

export interface OrderFollowUpPayload {
  order_id: string;
  user_id: string;
  phone: string;
  name: string;
  email?: string;
  total: number;
  created_at: string;
}

export type WebhookLogPayload = CartAbandonedPayload | OrderFollowUpPayload;
