import React, { useState, useEffect } from 'react';
import { MessageSquare, RefreshCw, FileText } from 'lucide-react';
import {
  getWhatsappTemplates,
  updateWhatsappTemplate,
  getWebhookLogs,
} from '@/services/whatsappAdminService';
import type {
  WhatsappTemplateRow,
  N8nWebhookLogRow,
  WhatsappTemplateMetaStatus,
  OrderFollowUpPayload,
} from '@/types/whatsapp';

const META_STATUS_OPTIONS: { value: WhatsappTemplateMetaStatus; label: string }[] = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'submetido', label: 'Submetido à Meta' },
  { value: 'aprovado', label: 'Aprovado pela Meta' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'processed', label: 'Enviados' },
  { value: 'failed', label: 'Falhas' },
];

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const payloadSummary = (log: N8nWebhookLogRow): string => {
  const p = log.payload as Record<string, unknown> | null;
  if (!p) return '—';
  const name = (p.name as string) ?? '';
  const phone = (p.phone as string) ?? '';
  if (log.event_type === 'order.follow_up') {
    const orderId = (p as OrderFollowUpPayload).order_id;
    return `${name || '—'} · ${phone || '—'} · Pedido #${orderId ? String(orderId).slice(-8) : '—'}`;
  }
  return `${name || '—'} · ${phone || '—'}`;
};

const AdminWhatsAppManagement: React.FC = () => {
  const [templates, setTemplates] = useState<WhatsappTemplateRow[]>([]);
  const [logs, setLogs] = useState<N8nWebhookLogRow[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logStatusFilter, setLogStatusFilter] = useState('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [editMetaStatus, setEditMetaStatus] = useState<WhatsappTemplateMetaStatus>('rascunho');
  const [editMetaNotes, setEditMetaNotes] = useState('');

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const data = await getWhatsappTemplates();
      setTemplates(data);
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
      setMessage({ type: 'error', text: 'Erro ao carregar modelos.' });
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadLogs = async () => {
    try {
      setLoadingLogs(true);
      const data = await getWebhookLogs({
        status: logStatusFilter === 'all' ? undefined : logStatusFilter,
        limit: 100,
      });
      setLogs(data);
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
      setMessage({ type: 'error', text: 'Erro ao carregar histórico (verifique permissões RLS).' });
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [logStatusFilter]);

  const startEdit = (t: WhatsappTemplateRow) => {
    setEditingId(t.id);
    setEditBody(t.body);
    setEditMetaStatus(t.meta_status as WhatsappTemplateMetaStatus);
    setEditMetaNotes(t.meta_notes ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveTemplate = async () => {
    if (!editingId) return;
    try {
      await updateWhatsappTemplate(editingId, {
        body: editBody,
        meta_status: editMetaStatus,
        meta_notes: editMetaNotes || null,
      });
      setMessage({ type: 'success', text: 'Modelo guardado.' });
      setTimeout(() => setMessage(null), 3000);
      setEditingId(null);
      loadTemplates();
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
      setMessage({ type: 'error', text: 'Erro ao guardar modelo.' });
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pendente', className: 'bg-amber-50 text-amber-700' },
      processed: { label: 'Enviado', className: 'bg-emerald-50 text-emerald-700' },
      failed: { label: 'Falha', className: 'bg-red-50 text-red-700' },
    };
    const c = map[status] ?? { label: status, className: 'bg-stone-100 text-stone-600' };
    return <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${c.className}`}>{c.label}</span>;
  };

  const metaStatusBadge = (s: string) => {
    const map: Record<string, { label: string; className: string }> = {
      rascunho: { label: 'Rascunho', className: 'bg-stone-100 text-stone-600' },
      submetido: { label: 'Submetido', className: 'bg-blue-50 text-blue-700' },
      aprovado: { label: 'Aprovado', className: 'bg-emerald-50 text-emerald-700' },
    };
    const c = map[s] ?? { label: s, className: 'bg-stone-100 text-stone-600' };
    return <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${c.className}`}>{c.label}</span>;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-stone-800">Mensagens WhatsApp</h1>
        <p className="text-stone-500 text-[13px] mt-0.5">
          Modelos para submissão à Meta e histórico de envios (carrinho abandonado / lembrete de pagamento).
        </p>
      </div>

      {message && (
        <div
          className={`px-3 py-2 rounded-lg text-[13px] ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Modelos para submissão à Meta */}
      <section className="bg-white rounded-xl border border-stone-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
          <FileText size={18} className="text-stone-500" />
          <h2 className="text-[15px] font-medium text-stone-800">Modelos para submissão à Meta</h2>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-stone-500 text-[13px]">
            Edite o texto dos modelos e marque o estado da submissão à Meta. Use placeholders como{' '}
            <code className="bg-stone-100 px-1 rounded text-[12px]">{'{{1}}'}</code>,{' '}
            <code className="bg-stone-100 px-1 rounded text-[12px]">{'{{2}}'}</code> conforme a documentação da Meta.
          </p>
          {loadingTemplates ? (
            <div className="py-6 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-stone-200 border-t-stone-500" />
            </div>
          ) : (
            <ul className="space-y-4">
              {templates.map((t) => (
                <li
                  key={t.id}
                  className="border border-stone-100 rounded-lg p-4 bg-stone-25/50"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px] text-stone-500">{t.slug}</span>
                      <span className="text-[13px] font-medium text-stone-700">{t.name}</span>
                      {metaStatusBadge(t.meta_status)}
                    </div>
                    {editingId !== t.id ? (
                      <button
                        type="button"
                        onClick={() => startEdit(t)}
                        className="text-[12px] text-stone-500 hover:text-stone-700"
                      >
                        Editar
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={saveTemplate}
                          className="text-[12px] text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="text-[12px] text-stone-500 hover:text-stone-700"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                  {editingId === t.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-[13px] resize-y"
                        placeholder="Texto do modelo com {{1}}, {{2}}..."
                      />
                      <div className="flex flex-wrap gap-3 items-center">
                        <label className="flex items-center gap-2 text-[13px] text-stone-600">
                          Estado Meta:
                          <select
                            value={editMetaStatus}
                            onChange={(e) => setEditMetaStatus(e.target.value as WhatsappTemplateMetaStatus)}
                            className="px-2 py-1 border border-stone-200 rounded text-[12px]"
                          >
                            {META_STATUS_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <input
                          type="text"
                          value={editMetaNotes}
                          onChange={(e) => setEditMetaNotes(e.target.value)}
                          placeholder="Notas / ID template Meta"
                          className="flex-1 min-w-[180px] px-2 py-1 border border-stone-200 rounded text-[12px]"
                        />
                      </div>
                    </div>
                  ) : (
                    <pre className="text-[12px] text-stone-600 whitespace-pre-wrap font-sans">{t.body}</pre>
                  )}
                  {t.meta_notes && editingId !== t.id && (
                    <p className="text-[11px] text-stone-400 mt-1">Notas: {t.meta_notes}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Histórico de envios */}
      <section className="bg-white rounded-xl border border-stone-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-stone-500" />
            <h2 className="text-[15px] font-medium text-stone-800">Histórico de envios</h2>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={logStatusFilter}
              onChange={(e) => setLogStatusFilter(e.target.value)}
              className="px-2 py-1.5 border border-stone-200 rounded-lg text-[12px] text-stone-600"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={loadLogs}
              className="p-1.5 text-stone-500 hover:bg-stone-100 rounded-lg"
              title="Atualizar"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loadingLogs ? (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-stone-200 border-t-stone-500" />
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="px-4 py-2.5 text-[11px] font-medium text-stone-400 uppercase tracking-wide">
                    Tipo
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-stone-400 uppercase tracking-wide">
                    Destinatário
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-stone-400 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-stone-400 uppercase tracking-wide">
                    Criado
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-stone-400 uppercase tracking-wide">
                    Processado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-stone-400 text-[13px]">
                      Nenhum registo na fila.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-25/50">
                      <td className="px-4 py-2.5">
                        <span className="text-[12px] font-mono text-stone-600">
                          {log.event_type === 'cart.abandoned' ? 'Carrinho abandonado' : 'Lembrete pagamento'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[12px] text-stone-600">
                        {payloadSummary(log)}
                      </td>
                      <td className="px-4 py-2.5">{statusBadge(log.status)}</td>
                      <td className="px-4 py-2.5 text-[12px] text-stone-500">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-2.5 text-[12px] text-stone-500">
                        {formatDate(log.processed_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminWhatsAppManagement;
