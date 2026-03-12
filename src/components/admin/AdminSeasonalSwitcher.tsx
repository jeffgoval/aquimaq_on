import React, { useState, useEffect } from 'react';
import { Calendar, Save, Loader2 } from 'lucide-react';
import { useStoreSettings } from '@/hooks/useStoreSettings';

const SEASONAL_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Automático (calendário de safra)' },
  { value: 'PLANTIO_MILHO', label: 'Plantio Milho' },
  { value: 'COLHEITA_MILHO', label: 'Colheita Milho' },
  { value: 'PLANTIO_SOJA', label: 'Plantio Soja' },
  { value: 'COLHEITA_SOJA', label: 'Colheita Soja' },
  { value: 'PLANTIO_CAFE', label: 'Plantio Café' },
  { value: 'COLHEITA_CAFE', label: 'Colheita Café' },
  { value: 'OFF', label: 'Desativado' },
];

const AdminSeasonalSwitcher: React.FC = () => {
  const { settings, saveSettings } = useStoreSettings();
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(settings?.seasonalContext ?? '');
  }, [settings?.seasonalContext]);

  const handleSave = async () => {
    setSaving(true);
    const result = await saveSettings({
      seasonalContext: value || null,
    });
    setSaving(false);
    if (!result.success) {
      console.error(result.error);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-2">
        <Calendar size={22} className="text-stone-600" />
        <h2 className="text-lg font-semibold text-stone-900">Sazonalidade (Modo de Safra)</h2>
      </div>
      <p className="text-sm text-stone-500 mb-6">
        Quando definido, este modo sobrescreve o comportamento automático baseado no calendário de safra e influencia
        os banners em destaque e a ordem das recomendações na Home.
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[220px]">
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Modo de Safra</label>
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-stone-400 focus:border-stone-500 bg-white"
          >
            {SEASONAL_OPTIONS.map((opt) => (
              <option key={opt.value || 'auto'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Salvar
        </button>
      </div>

      {value && value !== 'OFF' && (
        <p className="mt-4 text-xs text-stone-500">
          Modo atual: <strong>{SEASONAL_OPTIONS.find((o) => o.value === value)?.label ?? value}</strong>
        </p>
      )}
    </div>
  );
};

export default AdminSeasonalSwitcher;
