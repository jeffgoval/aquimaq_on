import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import {
  getCropCalendar,
  createCropCalendarRow,
  updateCropCalendarRow,
  deleteCropCalendarRow,
} from '@/services/cropCalendarService';
import type { CropCalendarRow } from '@/types/database';

const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const AdminCropCalendar: React.FC = () => {
  const [rows, setRows] = useState<CropCalendarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    culture: '',
    region: '',
    month_plant_start: 1,
    month_plant_end: 1,
    month_harvest_start: 1,
    month_harvest_end: 1,
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await getCropCalendar();
      setRows(data);
    } catch (e) {
      setMessage({ type: 'error', text: 'Erro ao carregar calendário.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const resetForm = () => {
    setForm({
      culture: '',
      region: '',
      month_plant_start: 1,
      month_plant_end: 1,
      month_harvest_start: 1,
      month_harvest_end: 1,
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const handleSaveNew = async () => {
    if (!form.culture.trim()) {
      showMessage('error', 'Cultura é obrigatória.');
      return;
    }
    const { data, error } = await createCropCalendarRow({
      culture: form.culture.trim(),
      region: form.region.trim() || null,
      month_plant_start: form.month_plant_start,
      month_plant_end: form.month_plant_end,
      month_harvest_start: form.month_harvest_start,
      month_harvest_end: form.month_harvest_end,
    });
    if (error) {
      showMessage('error', error.message || 'Erro ao criar.');
      return;
    }
    if (data) setRows((prev) => [...prev, data].sort((a, b) => a.culture.localeCompare(b.culture)));
    resetForm();
    showMessage('success', 'Linha adicionada.');
  };

  const handleUpdate = async () => {
    if (!editingId || !form.culture.trim()) return;
    const { data, error } = await updateCropCalendarRow(editingId, {
      culture: form.culture.trim(),
      region: form.region.trim() || null,
      month_plant_start: form.month_plant_start,
      month_plant_end: form.month_plant_end,
      month_harvest_start: form.month_harvest_start,
      month_harvest_end: form.month_harvest_end,
    });
    if (error) {
      showMessage('error', error.message || 'Erro ao atualizar.');
      return;
    }
    if (data) setRows((prev) => prev.map((r) => (r.id === editingId ? data : r)));
    resetForm();
    showMessage('success', 'Atualizado.');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta linha do calendário?')) return;
    const { error } = await deleteCropCalendarRow(id);
    if (error) {
      showMessage('error', error.message || 'Erro ao remover.');
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    showMessage('success', 'Removido.');
  };

  const startEdit = (row: CropCalendarRow) => {
    setEditingId(row.id);
    setForm({
      culture: row.culture,
      region: row.region ?? '',
      month_plant_start: row.month_plant_start,
      month_plant_end: row.month_plant_end,
      month_harvest_start: row.month_harvest_start,
      month_harvest_end: row.month_harvest_end,
    });
    setIsAdding(false);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-2">
        <Calendar size={22} className="text-stone-600" />
        <h2 className="text-lg font-semibold text-stone-900">Calendário de safra</h2>
      </div>
      <p className="text-sm text-stone-500">
        Períodos de plantio e colheita por cultura (e região). Usado para destacar produtos &quot;em época&quot; na loja.
      </p>

      {message && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}
        >
          {message.text}
        </div>
      )}

      {(isAdding || editingId) && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-3">
          <h3 className="text-sm font-medium text-stone-700">{editingId ? 'Editar' : 'Nova linha'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Cultura *</label>
              <input
                type="text"
                value={form.culture}
                onChange={(e) => setForm((f) => ({ ...f, culture: e.target.value }))}
                placeholder="Ex: Soja"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Região (opcional)</label>
              <input
                type="text"
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                placeholder="Ex: Sul"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Plantio início</label>
              <select
                value={form.month_plant_start}
                onChange={(e) => setForm((f) => ({ ...f, month_plant_start: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Plantio fim</label>
              <select
                value={form.month_plant_end}
                onChange={(e) => setForm((f) => ({ ...f, month_plant_end: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Colheita início</label>
              <select
                value={form.month_harvest_start}
                onChange={(e) => setForm((f) => ({ ...f, month_harvest_start: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Colheita fim</label>
              <select
                value={form.month_harvest_end}
                onChange={(e) => setForm((f) => ({ ...f, month_harvest_end: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={editingId ? handleUpdate : handleSaveNew}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-stone-800 hover:bg-stone-700 rounded-lg"
            >
              <Save size={14} />
              {editingId ? 'Atualizar' : 'Adicionar'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-200 rounded-lg"
            >
              <X size={14} />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {!isAdding && !editingId && (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-lg border border-stone-200"
        >
          <Plus size={16} />
          Adicionar cultura
        </button>
      )}

      {loading ? (
        <p className="text-sm text-stone-500">Carregando...</p>
      ) : (
        <div className="rounded-xl border border-stone-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-100">
              <tr>
                <th className="px-4 py-2 font-medium text-stone-700">Cultura</th>
                <th className="px-4 py-2 font-medium text-stone-700">Região</th>
                <th className="px-4 py-2 font-medium text-stone-700">Plantio</th>
                <th className="px-4 py-2 font-medium text-stone-700">Colheita</th>
                <th className="px-4 py-2 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-stone-400">
                    Nenhuma linha. Adicione culturas para o calendário de safra.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-stone-50">
                    <td className="px-4 py-2 font-medium text-stone-800">{row.culture}</td>
                    <td className="px-4 py-2 text-stone-600">{row.region ?? '—'}</td>
                    <td className="px-4 py-2 text-stone-600">
                      {MONTHS[row.month_plant_start - 1]} – {MONTHS[row.month_plant_end - 1]}
                    </td>
                    <td className="px-4 py-2 text-stone-600">
                      {MONTHS[row.month_harvest_start - 1]} – {MONTHS[row.month_harvest_end - 1]}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(row)}
                          className="p-1.5 text-stone-500 hover:bg-stone-200 rounded"
                          aria-label="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          aria-label="Remover"
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
  );
};

export default AdminCropCalendar;
