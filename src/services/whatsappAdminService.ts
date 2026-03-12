import { supabase } from './supabase';
import type { WhatsappTemplateRow, N8nWebhookLogRow, WhatsappTemplateMetaStatus } from '@/types/whatsapp';

/** Lista templates de mensagem WhatsApp (para submissão à Meta). */
export const getWhatsappTemplates = async (): Promise<WhatsappTemplateRow[]> => {
  const { data, error } = await supabase
    .from('whatsapp_templates')
    .select('*')
    .order('slug');
  if (error) throw error;
  return (data ?? []) as WhatsappTemplateRow[];
};

/** Atualiza um template (body, meta_status, meta_notes). */
export const updateWhatsappTemplate = async (
  id: string,
  updates: { body?: string; meta_status?: WhatsappTemplateMetaStatus; meta_notes?: string | null }
): Promise<WhatsappTemplateRow> => {
  const { data, error } = await supabase
    .from('whatsapp_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as WhatsappTemplateRow;
};

/** Lista registos da fila n8n (envios WhatsApp). */
export const getWebhookLogs = async (params?: {
  status?: string;
  limit?: number;
}): Promise<N8nWebhookLogRow[]> => {
  let q = supabase
    .from('n8n_webhook_logs')
    .select('id, event_type, payload, status, created_at, processed_at')
    .order('created_at', { ascending: false });
  if (params?.status && params.status !== 'all') {
    q = q.eq('status', params.status);
  }
  const limit = params?.limit ?? 50;
  const { data, error } = await q.limit(limit);
  if (error) throw error;
  return (data ?? []) as N8nWebhookLogRow[];
};
