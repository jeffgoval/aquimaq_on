import React, { useState, useEffect } from 'react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Star, Eye, EyeOff, Trash2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import {
  getReviewsForAdmin,
  setReviewVisibility,
  deleteReview,
  type ReviewForAdmin,
  type GetReviewsForAdminParams,
} from '@/services/reviewService';
import { cn } from '@/utils/cn';

const VISIBILITY_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'yes', label: 'Visíveis' },
  { value: 'no', label: 'Ocultas' },
];

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <Star
        key={n}
        size={12}
        className={n <= rating ? 'text-amber-400 fill-amber-400' : 'text-stone-200 fill-stone-200'}
      />
    ))}
  </div>
);

const AdminReviewsManagement: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewForAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filterRating, setFilterRating] = useState('');
  const [filterVisible, setFilterVisible] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const params: GetReviewsForAdminParams = {};
      if (filterRating) params.rating = Number(filterRating);
      if (filterVisible === 'yes') params.isVisible = true;
      if (filterVisible === 'no') params.isVisible = false;
      setReviews(await getReviewsForAdmin(params));
    } catch {
      showMessage('error', 'Erro ao carregar avaliações.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterRating, filterVisible]);

  const handleToggleVisible = async (id: string, current: boolean) => {
    const { error } = await setReviewVisibility(id, !current);
    if (error) { showMessage('error', error.message || 'Erro ao atualizar.'); return; }
    setReviews(prev => prev.map(r => r.id === id ? { ...r, is_visible: !current } : r));
    showMessage('success', current ? 'Avaliação ocultada.' : 'Avaliação exibida.');
  };

  const doDelete = async (id: string) => {
    const { error } = await deleteReview(id);
    if (error) { showMessage('error', error.message || 'Erro ao eliminar.'); return; }
    setReviews(prev => prev.filter(r => r.id !== id));
    showMessage('success', 'Avaliação eliminada.');
  };

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-stone-800">Avaliações</h1>
            <p className="text-xs text-stone-500 mt-0.5">Modere as avaliações dos clientes — oculte ou elimine.</p>
          </div>
          <div className="flex items-center gap-3">
            {message && (
              <span className={cn(
                'flex items-center gap-1.5 text-xs font-medium',
                message.type === 'success' ? 'text-emerald-600' : 'text-red-600'
              )}>
                {message.type === 'success' ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                {message.text}
              </span>
            )}
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Estrelas</label>
            <select
              value={filterRating}
              onChange={e => setFilterRating(e.target.value)}
              className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-stone-300"
            >
              <option value="">Todas</option>
              {[5, 4, 3, 2, 1].map(n => (
                <option key={n} value={String(n)}>{n} estrelas</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Visibilidade</label>
            <div className="flex items-center gap-1">
              {VISIBILITY_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setFilterVisible(o.value)}
                  className={cn(
                    'px-3 py-2 text-xs font-medium rounded-lg border transition-colors',
                    filterVisible === o.value
                      ? 'bg-stone-800 text-white border-stone-800'
                      : 'text-stone-600 border-stone-200 hover:bg-stone-50'
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-stone-200 border-t-stone-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="px-4 py-3 text-xs font-medium text-stone-400">Produto</th>
                    <th className="px-4 py-3 text-xs font-medium text-stone-400">Cliente</th>
                    <th className="px-4 py-3 text-xs font-medium text-stone-400">Nota</th>
                    <th className="px-4 py-3 text-xs font-medium text-stone-400">Comentário</th>
                    <th className="px-4 py-3 text-xs font-medium text-stone-400">Data</th>
                    <th className="px-4 py-3 text-xs font-medium text-stone-400">Status</th>
                    <th className="px-4 py-3 w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {reviews.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-stone-400">
                        Nenhuma avaliação encontrada.
                      </td>
                    </tr>
                  ) : reviews.map(r => (
                    <tr key={r.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-stone-800 max-w-[140px] truncate">
                        {(r as ReviewForAdmin).products?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-600">
                        {r.profiles?.name ?? r.cliente_id.slice(0, 8) + '…'}
                      </td>
                      <td className="px-4 py-3">
                        <StarRating rating={r.rating} />
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-600 max-w-[180px] truncate">
                        {r.comment || <span className="text-stone-300 italic">sem comentário</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-400">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'text-xs border rounded-full px-2 py-0.5 font-medium',
                          r.is_visible !== false
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-stone-50 text-stone-500 border-stone-200'
                        )}>
                          {r.is_visible !== false ? 'Visível' : 'Oculta'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleVisible(r.id, r.is_visible !== false)}
                            title={r.is_visible !== false ? 'Ocultar' : 'Exibir'}
                            className="p-1.5 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors"
                          >
                            {r.is_visible !== false ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(r.id)}
                            title="Eliminar"
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
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

      </div>

      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Eliminar avaliação"
        description="Tem certeza que deseja eliminar esta avaliação? Esta ação não pode ser desfeita."
        confirmLabel="Eliminar"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) doDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
      />
    </>
  );
};

export default AdminReviewsManagement;
