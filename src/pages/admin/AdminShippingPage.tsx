import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Truck, RefreshCw, Printer, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAdminMePrintUrl, getOrderStatus, getShippingOrders, printMelhorEnviosLabel, updateOrderStatus, type ShippingOrderRow } from '@/services/adminService';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { useToast } from '@/contexts/ToastContext';
import { OrderStatus } from '@/types';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  etiqueta_criada:   { label: 'Etiqueta criada',   color: 'bg-blue-100 text-blue-700' },
  etiqueta_paga:     { label: 'Etiqueta paga',      color: 'bg-indigo-100 text-indigo-700' },
  etiqueta_gerada:   { label: 'Etiqueta gerada',    color: 'bg-purple-100 text-purple-700' },
  postado:           { label: 'Postado',             color: 'bg-amber-100 text-amber-700' },
  entregue:          { label: 'Entregue',            color: 'bg-green-100 text-green-700' },
  cancelado:         { label: 'Cancelado',           color: 'bg-red-100 text-red-700' },
  nao_entregue:      { label: 'Não entregue',        color: 'bg-rose-100 text-rose-700' },
  aguardando_pagamento: { label: 'Ag. pagamento',   color: 'bg-gray-100 text-gray-600' },
};

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'etiqueta_criada', label: 'Etiqueta criada' },
  { value: 'etiqueta_paga', label: 'Etiqueta paga' },
  { value: 'etiqueta_gerada', label: 'Etiqueta gerada' },
  { value: 'postado', label: 'Postado' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'nao_entregue', label: 'Não entregue' },
];

const AdminShippingPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<ShippingOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<{ open: boolean; title: string; description: string }>({
    open: false,
    title: '',
    description: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getShippingOrders();
      setOrders(data);
    } catch (e) {
      const err = e as any;
      // PostgrestError normalmente traz { message, details, hint, code }
      console.error('Erro ao carregar pedidos de envio:', {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
        raw: err,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter((o) => {
    const matchStatus = !statusFilter || o.shippingStatus === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o.id.toLowerCase().includes(q) ||
      (o.clienteName ?? '').toLowerCase().includes(q) ||
      (o.trackingCode ?? '').toLowerCase().includes(q) ||
      (o.meOrderId ?? '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const handlePrint = async (order: ShippingOrderRow) => {
    setPrintingId(order.id);
    try {
      await printMelhorEnviosLabel(order.id);

      // Importante: só fazemos awaits depois de abrir a nova aba, para não cair em popup blocker.
      const prevStatus = await getOrderStatus(order.id);
      if (prevStatus === OrderStatus.PAID) {
        await updateOrderStatus(order.id, OrderStatus.PICKING);
        showToast('Status atualizado para “Em Separação”.', 'info', {
          duration: 10000,
          actionLabel: 'Desfazer',
          onAction: () => { void updateOrderStatus(order.id, prevStatus); },
        });
      }
    } catch (e: any) {
      const msg = String(e?.message ?? e ?? 'Erro desconhecido');
      if (msg === 'POPUP_BLOCKED') {
        showToast('Clique para abrir a etiqueta em nova aba.', 'info', {
          duration: 10000,
          actionLabel: 'Abrir etiqueta',
          onAction: () => { void printMelhorEnviosLabel(order.id); },
        });
      } else {
      setAlertState({
        open: true,
        title: 'Erro ao imprimir etiqueta',
        description: msg,
      });
      }
    } finally {
      setPrintingId(null);
    }
  };

  const handlePrintDocs = async (order: ShippingOrderRow) => {
    setPrintingId(order.id);
    try {
      navigate(getAdminMePrintUrl(order.id, 'docs'));
    } catch (e: any) {
      setAlertState({
        open: true,
        title: 'Erro ao abrir documentos',
        description: String(e?.message ?? e ?? 'Erro desconhecido'),
      });
    } finally {
      setPrintingId(null);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

  const StatusBadge = ({ status }: { status: string | null }) => {
    if (!status) return <span className="text-gray-400 text-xs">—</span>;
    const s = STATUS_LABELS[status];
    if (!s) return <span className="text-xs text-gray-500">{status}</span>;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
        {s.label}
      </span>
    );
  };

  return (
    <>
      <Helmet><title>Logística | Aquimaq Admin</title></Helmet>

      <div className="space-y-4">
        <AlertDialog
          open={alertState.open}
          title={alertState.title}
          description={alertState.description}
          tone="danger"
          onClose={() => setAlertState({ open: false, title: '', description: '' })}
        />
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-agro-600" />
            <h1 className="text-xl font-bold text-gray-900">Logística — Melhor Envios</h1>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por pedido, cliente, rastreio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-agro-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-agro-500 bg-white"
          >
            {STATUS_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Truck className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Nenhum envio encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {['Pedido', 'Cliente', 'Transportadora', 'Status envio', 'Rastreio', 'Data', 'Ação'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-gray-700">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{order.clienteName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {order.shippingMethodLabel ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.shippingStatus} />
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">
                        {order.trackingCode ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePrint(order)}
                            disabled={printingId === order.id}
                            title="Imprimir etiqueta térmica 10×15 (recomendado)"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-agro-600 text-white rounded-lg hover:bg-agro-700 disabled:opacity-50 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            {printingId === order.id ? 'Abrindo...' : 'Etiqueta 10×15'}
                          </button>

                          <button
                            onClick={() => handlePrintDocs(order)}
                            disabled={printingId === order.id}
                            title="Abrir link de impressão (pode conter comprovantes/documentos)"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Docs
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400">
          {filtered.length} envio{filtered.length !== 1 ? 's' : ''} listado{filtered.length !== 1 ? 's' : ''}.
          O botão "Etiqueta 10×15" é o recomendado para impressora térmica. "Docs" abre a página/URL de impressão.
        </p>
      </div>
    </>
  );
};

export default AdminShippingPage;
