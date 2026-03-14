import React, { useState, useEffect } from 'react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Star, Eye, EyeOff, Trash2, RefreshCw } from 'lucide-react';
import {
  getReviewsForAdmin,
  setReviewVisibility,
  deleteReview,
  type ReviewForAdmin,
  type GetReviewsForAdminParams,
} from '@/services/reviewService';

const AdminReviewsManagement: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewForAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filterRating, setFilterRating] = useState<string>('');
  const [filterVisible, setFilterVisible] = useState<string>('');

  const load = async () => {
    setLoading(true);
    try {
      const params: GetReviewsForAdminParams = {};
      if (filterRating) params.rating = Number(filterRating);
      if (filterVisible === 'yes') params.isVisible = true;
      if (filterVisible === 'no') params.isVisible = false;
      const data = await getReviewsForAdmin(params);
      setReviews(data);
    } catch (e) {
      setMessage({ type: 'error', text: 'Erro ao carregar avaliações.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterRating, filterVisible]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleToggleVisible = async (id: string, current: boolean) => {
    const { error } = await setReviewVisibility(id, !current);
    if (error) {
      showMessage('error', error.message || 'Erro ao atualizar.');
      return;
    }
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, is_visible: !current } : r)));
    showMessage('success', current ? 'Avaliação ocultada.' : 'Avaliação exibida.');
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => setConfirmDeleteId(id);

  const doDelete = async (id: string) => {
    const { error } = await deleteReview(id);
    if (error) {
      showMessage('error', error.message || 'Erro ao eliminar.');
      return;
    }
    setReviews((prev) => prev.filter((r) => r.id !== id));
    showMessage('success', 'Avaliação eliminada.');
  };

  return (
    <>
    <div className="max-w-6xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-stone-100">
            <Star size={24} className="text-stone-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-stone-800">Avaliações</h2>
            <p className="text-sm text-stone-500 mt-0.5">Moderar avaliações: ocultar ou eliminar</p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-stone-500 hover:bg-stone-100 rounded-lg text-[13px] font-medium"
        >
          <RefreshCw size={14} />
          Atualizar
        </button>
      </div>

      {message && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Estrelas</label>
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white"
          >
            <option value="">Todas</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={String(n)}>{n} estrelas</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Visível</label>
          <select
            value={filterVisible}
            onChange={(e) => setFilterVisible(e.target.value)}
            className="px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white"
          >
            <option value="">Todas</option>
            <option value="yes">Sim</option>
            <option value="no">Ocultas</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-6 w-6 border-2 border-stone-200 border-t-stone-500 rounded-full animate-spin mb-2" />
            <p className="text-stone-400 text-[13px]">A carregar...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-medium text-stone-500 uppercase tracking-wide">Produto</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-stone-500 uppercase tracking-wide">Cliente</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-stone-500 uppercase tracking-wide">Estrelas</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-stone-500 uppercase tracking-wide">Comentário</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-stone-500 uppercase tracking-wide">Data</th>
                  <th className="px-4 py-3 text-[11px] font-medium text-stone-500 uppercase tracking-wide">Visível</th>
                  <th className="px-4 py-3 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-stone-400 text-[13px]">
                      Nenhuma avaliação encontrada.
                    </td>
                  </tr>
                ) : (
                  reviews.map((r) => (
                    <tr key={r.id} className="hover:bg-stone-50">
                      <td className="px-4 py-3 font-medium text-stone-800">
                        {(r as ReviewForAdmin).products?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {r.profiles?.name ?? r.cliente_id.slice(0, 8) + '…'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-amber-600">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                      </td>
                      <td className="px-4 py-3 text-stone-600 max-w-[200px] truncate">
                        {r.comment || '—'}
                      </td>
                      <td className="px-4 py-3 text-stone-500 text-[12px]">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                            r.is_visible !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {r.is_visible !== false ? 'Sim' : 'Oculta'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleVisible(r.id, r.is_visible !== false)}
                            className="p-1.5 text-stone-500 hover:bg-stone-200 rounded"
                            title={r.is_visible !== false ? 'Ocultar' : 'Exibir'}
                          >
                            {r.is_visible !== false ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>

    <ConfirmDialog
      open={!!confirmDeleteId}
      title="Eliminar Avaliação"
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
