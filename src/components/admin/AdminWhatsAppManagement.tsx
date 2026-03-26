import React, { useState, useEffect } from 'react';
import {
  MessageSquare, RefreshCw, FileText, CheckCircle, AlertCircle,
  Pencil, X, Save, Clock, User, Hash, Lock
} from 'lucide-react';
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
import { cn } from '@/utils/cn';
import { useAuth } from '@/contexts/AuthContext';
import { maskPhone, unmask } from '@/utils/masks';

// ─── Constants ────────────────────────────────────────────────────────────────

const META_STATUS_OPTIONS: { value: WhatsappTemplateMetaStatus; label: string }[] = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'submetido', label: 'Submetido à Meta' },
  { value: 'aprovado', label: 'Aprovado pela Meta' },
];

const LOG_STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'processed', label: 'Enviados' },
  { value: 'failed', label: 'Falhas' },
];

const EVENT_LABELS: Record<string, string> = {
  'cart.abandoned': 'Carrinho abandonado',
  'order.follow_up': 'Lembrete de pagamento',
};

const META_STATUS_STYLES: Record<WhatsappTemplateMetaStatus, string> = {
  rascunho: 'bg-stone-50 text-stone-600 border-stone-200',
  submetido: 'bg-blue-50 text-blue-700 border-blue-200',
  aprovado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const LOG_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  processed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const formatLogPhoneDisplay = (phone: string): string => {
  if (phone === '—' || !phone.trim()) return phone;
  const d = unmask(phone);
  if (d.length >= 10 && d.length <= 13) return maskPhone(phone);
  return phone;
};

const getLogRecipient = (log: N8nWebhookLogRow): { name: string; phone: string; ref?: string } => {
  const p = log.payload as Record<string, unknown> | null;
  if (!p) return { name: '—', phone: '—' };
  const name = (p.name as string) || '—';
  const rawPhone = (p.phone as string) || '—';
  const phone = rawPhone === '—' ? rawPhone : formatLogPhoneDisplay(rawPhone);
  if (log.event_type === 'order.follow_up') {
    const orderId = (p as unknown as OrderFollowUpPayload).order_id;
    return { name, phone, ref: orderId ? `#${String(orderId).slice(-8)}` : undefined };
  }
  return { name, phone };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Badge: React.FC<{ label: string; className: string }> = ({ label, className }) => (
  <span className={cn('text-xs border rounded-full px-2 py-0.5 font-medium', className)}>
    {label}
  </span>
);

type TabId = 'modelos' | 'historico';

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminWhatsAppManagement: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('modelos');

  // Templates state
  const [templates, setTemplates] = useState<WhatsappTemplateRow[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [editMetaStatus, setEditMetaStatus] = useState<WhatsappTemplateMetaStatus>('rascunho');
  const [editMetaNotes, setEditMetaNotes] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Logs state
  const [logs, setLogs] = useState<N8nWebhookLogRow[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logStatusFilter, setLogStatusFilter] = useState('all');

  // Feedback
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      setTemplates(await getWhatsappTemplates());
    } catch {
      showMessage('error', 'Erro ao carregar modelos.');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadLogs = async () => {
    try {
      setLoadingLogs(true);
      setLogs(await getWebhookLogs({ status: logStatusFilter === 'all' ? undefined : logStatusFilter, limit: 100 }));
    } catch {
      showMessage('error', 'Erro ao carregar histórico (verifique permissões RLS).');
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => { loadTemplates(); }, []);
  useEffect(() => { loadLogs(); }, [logStatusFilter]);

  const startEdit = (t: WhatsappTemplateRow) => {
    setEditingId(t.id);
    setEditBody(t.body);
    setEditMetaStatus(t.meta_status as WhatsappTemplateMetaStatus);
    setEditMetaNotes(t.meta_notes ?? '');
  };

  const cancelEdit = () => setEditingId(null);

  const saveTemplate = async () => {
    if (!editingId) return;
    setSavingTemplate(true);
    try {
      await updateWhatsappTemplate(editingId, {
        body: editBody,
        meta_status: editMetaStatus,
        meta_notes: editMetaNotes || null,
      });
      showMessage('success', 'Modelo salvo.');
      setEditingId(null);
      loadTemplates();
    } catch {
      showMessage('error', 'Erro ao salvar modelo.');
    } finally {
      setSavingTemplate(false);
    }
  };

  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'modelos', label: 'Modelos', icon: FileText },
    { id: 'historico', label: 'Histórico de Envios', icon: MessageSquare },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-stone-800">WhatsApp</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Mensagens automáticas enviadas para clientes via WhatsApp — carrinho abandonado e lembretes de pagamento.
          </p>
        </div>
        {message && (
          <span className={cn(
            'flex items-center gap-1.5 text-xs font-medium',
            message.type === 'success' ? 'text-emerald-600' : 'text-red-600'
          )}>
            {message.type === 'success' ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
            {message.text}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === tab.id
                  ? 'border-stone-800 text-stone-900'
                  : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
              )}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab: Modelos ── */}
      {activeTab === 'modelos' && (
        <div className="space-y-4">
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
            <p className="text-xs text-stone-600 leading-relaxed">
              O WhatsApp Business <strong>não permite enviar mensagens livres</strong> para clientes. Toda mensagem automática precisa usar um modelo de texto pré-aprovado pela Meta.
            </p>
            <p className="text-xs text-stone-500 leading-relaxed">
              Edite o texto, use{' '}
              <code className="font-mono bg-white border border-stone-200 px-1.5 py-0.5 rounded">{'{{1}}'}</code>,{' '}
              <code className="font-mono bg-white border border-stone-200 px-1.5 py-0.5 rounded">{'{{2}}'}</code>{' '}
              para os valores variáveis (nome do cliente, valor do pedido...), marque como <strong>Submetido à Meta</strong> e aguarde a aprovação antes de ativar os envios automáticos.
            </p>
          </div>

          {!isAdmin && (
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              <Lock size={14} />
              Modelos de mensagem são gerenciados pelo administrador.
            </div>
          )}

          {loadingTemplates ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-stone-200 border-t-stone-500" />
            </div>
          ) : templates.length === 0 ? (
            <div className="py-12 text-center text-sm text-stone-400">
              Nenhum modelo cadastrado.
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map(t => {
                const isEditing = editingId === t.id;
                return (
                  <div key={t.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                    {/* Template header */}
                    <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <code className="text-xs font-mono text-stone-400 shrink-0">{t.slug}</code>
                        <span className="text-sm font-medium text-stone-800 truncate">{t.name}</span>
                        <Badge
                          label={META_STATUS_OPTIONS.find(o => o.value === t.meta_status)?.label ?? t.meta_status}
                          className={META_STATUS_STYLES[t.meta_status as WhatsappTemplateMetaStatus] ?? 'bg-stone-50 text-stone-500 border-stone-200'}
                        />
                      </div>
                      {!isEditing ? (
                        isAdmin && (
                          <button
                            type="button"
                            onClick={() => startEdit(t)}
                            className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700 transition-colors shrink-0"
                          >
                            <Pencil size={12} />
                            Editar
                          </button>
                        )
                      ) : (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={saveTemplate}
                            disabled={savingTemplate}
                            className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-50 transition-colors"
                          >
                            <Save size={12} />
                            {savingTemplate ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors"
                          >
                            <X size={12} />
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Template body */}
                    <div className="p-5 space-y-4">
                      {isEditing ? (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-stone-600 mb-1.5">Texto da mensagem</label>
                            <textarea
                              value={editBody}
                              onChange={e => setEditBody(e.target.value)}
                              rows={5}
                              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-stone-300"
                              placeholder="Texto com {{1}}, {{2}}..."
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-stone-600 mb-1.5">Estado Meta</label>
                              <select
                                value={editMetaStatus}
                                onChange={e => setEditMetaStatus(e.target.value as WhatsappTemplateMetaStatus)}
                                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
                              >
                                {META_STATUS_OPTIONS.map(o => (
                                  <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-stone-600 mb-1.5">ID / Notas Meta</label>
                              <input
                                type="text"
                                value={editMetaNotes}
                                onChange={e => setEditMetaNotes(e.target.value)}
                                placeholder="ID do template aprovado..."
                                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <pre className="text-sm text-stone-700 whitespace-pre-wrap font-sans leading-relaxed">{t.body}</pre>
                          {t.meta_notes && (
                            <p className="text-xs text-stone-400 flex items-center gap-1">
                              <Hash size={11} />
                              {t.meta_notes}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Histórico ── */}
      {activeTab === 'historico' && (
        <div className="space-y-4">
          <p className="text-xs text-stone-500 leading-relaxed">
            Registo de todas as mensagens WhatsApp disparadas automaticamente para clientes — quem recebeu, qual o motivo e se a entrega foi bem-sucedida. <strong className="text-stone-600">Falhas repetidas</strong> indicam problema na integração com a Meta (token expirado, modelo não aprovado).
          </p>
          {/* Filters */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {LOG_STATUS_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setLogStatusFilter(o.value)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                    logStatusFilter === o.value
                      ? 'bg-stone-800 text-white border-stone-800'
                      : 'text-stone-600 border-stone-200 hover:bg-stone-50'
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={loadLogs}
              disabled={loadingLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={12} className={loadingLogs ? 'animate-spin' : ''} />
              Atualizar
            </button>
          </div>

          {/* Table */}
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            {loadingLogs ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-stone-200 border-t-stone-500" />
              </div>
            ) : logs.length === 0 ? (
              <div className="py-12 text-center text-sm text-stone-400">
                Nenhum registo encontrado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-stone-100">
                      <th className="px-4 py-3 text-xs font-medium text-stone-400">Evento</th>
                      <th className="px-4 py-3 text-xs font-medium text-stone-400">Destinatário</th>
                      <th className="px-4 py-3 text-xs font-medium text-stone-400">Status</th>
                      <th className="px-4 py-3 text-xs font-medium text-stone-400">Criado</th>
                      <th className="px-4 py-3 text-xs font-medium text-stone-400">Processado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {logs.map(log => {
                      const recipient = getLogRecipient(log);
                      const statusStyle = LOG_STATUS_STYLES[log.status] ?? 'bg-stone-50 text-stone-500 border-stone-200';
                      const statusLabel = { pending: 'Pendente', processed: 'Enviado', failed: 'Falha' }[log.status] ?? log.status;
                      return (
                        <tr key={log.id} className="hover:bg-stone-50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium text-stone-700">
                              {EVENT_LABELS[log.event_type] ?? log.event_type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="flex items-center gap-1 text-xs text-stone-700">
                                <User size={11} className="text-stone-400" />
                                {recipient.name}
                              </span>
                              <span className="text-xs text-stone-400">{recipient.phone}</span>
                              {recipient.ref && (
                                <span className="flex items-center gap-1 text-xs text-stone-400">
                                  <Hash size={10} />
                                  {recipient.ref}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge label={statusLabel} className={statusStyle} />
                          </td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1 text-xs text-stone-500">
                              <Clock size={11} className="text-stone-300" />
                              {formatDate(log.created_at)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-stone-500">
                            {formatDate(log.processed_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminWhatsAppManagement;
