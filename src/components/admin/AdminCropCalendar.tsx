import React, { useState, useEffect } from 'react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import {
  getCropCalendar,
  createCropCalendarRow,
  updateCropCalendarRow,
  deleteCropCalendarRow,
} from '@/services/cropCalendarService';
import type { CropCalendarRow } from '@/types/database';
import { cn } from '@/utils/cn';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const EMPTY_FORM = {
  culture: '',
  region: '',
  month_plant_start: 1,
  month_plant_end: 1,
  month_harvest_start: 1,
  month_harvest_end: 1,
};

interface Props {
  onMessage: (type: 'success' | 'error', text: string) => void;
}

const MonthSelect: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
}> = ({ label, value, onChange }) => (
  <div>
    <label className="block text-xs font-medium text-stone-600 mb-1.5">{label}</label>
    <select
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
    >
      {MONTHS.map((m, i) => (
        <option key={i} value={i + 1}>{m}</option>
      ))}
    </select>
  </div>
);

const AdminCropCalendar: React.FC<Props> = ({ onMessage }) => {
  const [rows, setRows] = useState<CropCalendarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await getCropCalendar());
    } catch {
      onMessage('error', 'Erro ao carregar calendário.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!form.culture.trim()) { onMessage('error', 'Cultura é obrigatória.'); return; }
    setSaving(true);
    const payload = {
      culture: form.culture.trim(),
      region: form.region.trim() || null,
      month_plant_start: form.month_plant_start,
      month_plant_end: form.month_plant_end,
      month_harvest_start: form.month_harvest_start,
      month_harvest_end: form.month_harvest_end,
    };

    if (editingId) {
      const { data, error } = await updateCropCalendarRow(editingId, payload);
      if (error) { onMessage('error', error.message || 'Erro ao atualizar.'); setSaving(false); return; }
      if (data) setRows(prev => prev.map(r => r.id === editingId ? data : r));
      onMessage('success', 'Cultura atualizada.');
    } else {
      const { data, error } = await createCropCalendarRow(payload);
      if (error) { onMessage('error', error.message || 'Erro ao criar.'); setSaving(false); return; }
      if (data) setRows(prev => [...prev, data].sort((a, b) => a.culture.localeCompare(b.culture)));
      onMessage('success', 'Cultura adicionada.');
    }
    setSaving(false);
    resetForm();
  };

  const doDelete = async (id: string) => {
    const { error } = await deleteCropCalendarRow(id);
    if (error) { onMessage('error', error.message || 'Erro ao remover.'); return; }
    setRows(prev => prev.filter(r => r.id !== id));
    onMessage('success', 'Cultura removida.');
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
    <>
      <div className="space-y-4">
        <p className="text-xs text-stone-500">
          Períodos de plantio e colheita por cultura e região. Usado para destacar produtos "em época" na loja quando o modo automático está ativo.
        </p>

        {/* Form (add/edit) */}
        {(isAdding || editingId) && (
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100">
              <h3 className="text-sm font-semibold text-stone-800">
                {editingId ? 'Editar cultura' : 'Nova cultura'}
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5">Cultura <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={form.culture}
                    onChange={e => setForm(f => ({ ...f, culture: e.target.value }))}
                    placeholder="Ex: Soja"
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5">Região <span className="text-stone-300 font-normal">(opcional)</span></label>
                  <input
                    type="text"
                    value={form.region}
                    onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                    placeholder="Ex: Sul"
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MonthSelect label="Plantio início" value={form.month_plant_start} onChange={v => setForm(f => ({ ...f, month_plant_start: v }))} />
                <MonthSelect label="Plantio fim" value={form.month_plant_end} onChange={v => setForm(f => ({ ...f, month_plant_end: v }))} />
                <MonthSelect label="Colheita início" value={form.month_harvest_start} onChange={v => setForm(f => ({ ...f, month_harvest_start: v }))} />
                <MonthSelect label="Colheita fim" value={form.month_harvest_end} onChange={v => setForm(f => ({ ...f, month_harvest_end: v }))} />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-stone-900 hover:bg-stone-700 rounded-lg disabled:opacity-50 transition-colors"
                >
                  <Save size={14} />
                  {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Adicionar'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-stone-600 border border-stone-200 hover:bg-stone-50 rounded-lg transition-colors"
                >
                  <X size={14} />
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {!isAdding && !editingId && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-stone-700 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
          >
            <Plus size={15} />
            Adicionar cultura
          </button>
        )}

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
                    <th className="px-4 py-3 text-xs font-medium text-stone-400">Cultura</th>
                    <th className="px-4 py-3 text-xs font-medium text-stone-400">Região</th>
                    <th className="px-4 py-3 text-xs font-medium text-stone-400">Plantio</th>
                    <th className="px-4 py-3 text-xs font-medium text-stone-400">Colheita</th>
                    <th className="px-4 py-3 w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-stone-400">
                        Nenhuma cultura cadastrada. Adicione para ativar o modo automático.
                      </td>
                    </tr>
                  ) : rows.map(row => (
                    <tr
                      key={row.id}
                      className={cn('hover:bg-stone-50 transition-colors', editingId === row.id && 'bg-stone-50')}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-stone-800">{row.culture}</td>
                      <td className="px-4 py-3 text-sm text-stone-500">{row.region ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-stone-600">
                        {MONTHS[row.month_plant_start - 1]} – {MONTHS[row.month_plant_end - 1]}
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-600">
                        {MONTHS[row.month_harvest_start - 1]} – {MONTHS[row.month_harvest_end - 1]}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(row)}
                            className="p-1.5 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(row.id)}
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
        title="Remover cultura"
        description="Tem certeza que deseja remover esta entrada do calendário de safra?"
        confirmLabel="Remover"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) doDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
      />
    </>
  );
};

export default AdminCropCalendar;
