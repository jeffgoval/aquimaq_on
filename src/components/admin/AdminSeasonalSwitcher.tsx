import React, { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { cn } from '@/utils/cn';

const SEASONAL_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: '', label: 'Automático', description: 'Determinado pelo calendário de safra com base na data atual.' },
  { value: 'PLANTIO_MILHO', label: 'Plantio Milho', description: 'Força o modo de plantio de milho independente da data.' },
  { value: 'COLHEITA_MILHO', label: 'Colheita Milho', description: 'Força o modo de colheita de milho independente da data.' },
  { value: 'PLANTIO_CAFE', label: 'Plantio Café', description: 'Força o modo de plantio de café independente da data.' },
  { value: 'COLHEITA_CAFE', label: 'Colheita Café', description: 'Força o modo de colheita de café independente da data.' },
  { value: 'OFF', label: 'Desativado', description: 'Desliga completamente o comportamento sazonal na loja.' },
];

interface Props {
  onMessage: (type: 'success' | 'error', text: string) => void;
}

const AdminSeasonalSwitcher: React.FC<Props> = ({ onMessage }) => {
  const { settings, saveSettings } = useStoreSettings();
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(settings?.seasonalContext ?? '');
  }, [settings?.seasonalContext]);

  const handleSave = async () => {
    setSaving(true);
    const result = await saveSettings({ seasonalContext: value || null });
    setSaving(false);
    if (result.success) {
      onMessage('success', 'Modo de safra salvo.');
    } else {
      onMessage('error', result.error || 'Erro ao salvar.');
    }
  };

  const selected = SEASONAL_OPTIONS.find(o => o.value === value);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100">
          <h3 className="text-sm font-semibold text-stone-800">Modo de Safra</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Sobrescreve o modo automático. Influencia os banners em destaque e a ordem das recomendações na Home.
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            {SEASONAL_OPTIONS.map(opt => (
              <label
                key={opt.value || 'auto'}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  value === opt.value
                    ? 'border-stone-400 bg-stone-50'
                    : 'border-stone-200 hover:bg-stone-50'
                )}
              >
                <input
                  type="radio"
                  name="seasonal"
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={() => setValue(opt.value)}
                  className="accent-stone-700 mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-stone-800">{opt.label}</span>
                  <p className="text-xs text-stone-500 mt-0.5">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            {selected && value !== '' && value !== 'OFF' && (
              <p className="text-xs text-stone-500">
                Modo manual ativo: <span className="font-medium text-stone-700">{selected.label}</span>
              </p>
            )}
            {(!selected || value === '' || value === 'OFF') && (
              <span />
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-stone-900 hover:bg-stone-700 rounded-lg disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSeasonalSwitcher;
