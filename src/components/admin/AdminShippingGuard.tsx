import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Loader2, Truck } from 'lucide-react';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import type { ShippingRule } from '@/types/store';
import { ProductCategory } from '@/types';

const SHIPPING_METHODS: { value: ShippingRule['shipping_method']; label: string }[] = [
  { value: 'local_pickup_only', label: 'Apenas retirada na loja' },
  { value: 'regional_fleet_only', label: 'Entrega regional (frota própria)' },
];

const CATEGORY_OPTIONS = Object.values(ProductCategory);

const defaultRule = (): ShippingRule => ({
  category: ProductCategory.DEFENSIVES,
  shipping_method: 'local_pickup_only',
  message: 'Produtos desta categoria só podem ser retirados na loja.',
});

const AdminShippingGuard: React.FC = () => {
  const { settings, saveSettings } = useStoreSettings();
  const [rules, setRules] = useState<ShippingRule[]>([]);
  const [globalMessage, setGlobalMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings?.shippingRules?.length) {
      setRules([...settings.shippingRules]);
    }
    setGlobalMessage(settings?.shippingRestrictionMessage ?? '');
  }, [settings?.shippingRules, settings?.shippingRestrictionMessage]);

  const addRule = () => {
    setRules((prev) => [...prev, defaultRule()]);
  };

  const updateRule = (index: number, patch: Partial<ShippingRule>) => {
    setRules((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const removeRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await saveSettings({
      shippingRules: rules,
      shippingRestrictionMessage: globalMessage || undefined,
    });
    setSaving(false);
    if (!result.success) {
      console.error(result.error);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
            <Truck size={20} />
            Políticas logísticas (Shipping Guard)
          </h2>
          <p className="text-sm text-stone-500 mt-0.5">
            Defina quais categorias têm restrição de entrega (ex.: apenas retirada) e a mensagem exibida no produto e no checkout.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addRule}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Adicionar regra
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-agro-600 hover:bg-agro-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar
          </button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-stone-50 rounded-lg border border-stone-200">
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Mensagem global de restrição (fallback)
        </label>
        <input
          type="text"
          value={globalMessage}
          onChange={(e) => setGlobalMessage(e.target.value)}
          placeholder="Ex.: Produtos com restrição logística só podem ser retirados na loja."
          className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-agro-500 focus:border-agro-500"
        />
      </div>

      <ul className="space-y-4">
        {rules.length === 0 && (
          <li className="py-8 text-center text-stone-500 border border-dashed border-stone-200 rounded-lg">
            Nenhuma regra. Clique em &quot;Adicionar regra&quot; para definir restrições por categoria (ex.: Defensivos = apenas retirada).
          </li>
        )}
        {rules.map((rule, index) => (
          <li
            key={index}
            className="p-4 bg-white border border-stone-200 rounded-lg flex flex-col sm:flex-row gap-4 sm:items-start"
          >
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Categoria</label>
                <select
                  value={rule.category}
                  onChange={(e) => updateRule(index, { category: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-agro-500"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Método de entrega</label>
                <select
                  value={rule.shipping_method}
                  onChange={(e) => updateRule(index, { shipping_method: e.target.value as ShippingRule['shipping_method'] })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-agro-500"
                >
                  {SHIPPING_METHODS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-stone-500 mb-1">Mensagem de aviso (opcional)</label>
                <input
                  type="text"
                  value={rule.message ?? ''}
                  onChange={(e) => updateRule(index, { message: e.target.value || undefined })}
                  placeholder="Ex.: Apenas retirada na loja."
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-agro-500 focus:border-agro-500"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeRule(index)}
              className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors self-start"
              aria-label="Remover regra"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminShippingGuard;
