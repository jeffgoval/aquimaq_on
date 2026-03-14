import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import type { ShippingRule } from '@/types/store';
import { ProductCategory } from '@/types';
import { cn } from '@/utils/cn';

const SHIPPING_METHODS: { value: ShippingRule['shipping_method']; label: string; description: string }[] = [
  { value: 'local_pickup_only', label: 'Apenas retirada na loja', description: 'Transportadora desabilitada. Cliente deve retirar pessoalmente.' },
  { value: 'regional_fleet_only', label: 'Entrega regional (frota própria)', description: 'Entrega feita pela própria equipa, sem cotação externa.' },
];

const CATEGORY_OPTIONS = Object.values(ProductCategory);

const defaultRule = (): ShippingRule => ({
  category: ProductCategory.DEFENSIVES,
  shipping_method: 'local_pickup_only',
  message: 'Produtos desta categoria só podem ser retirados na loja.',
});

const inputCls = 'w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300';

const SectionCard: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, description, action, children }) => (
  <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
    <div className="px-5 py-4 border-b border-stone-100 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-stone-800">{title}</h3>
        {description && <p className="text-xs text-stone-500 mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const AdminShippingGuard: React.FC = () => {
  const { settings, saveSettings } = useStoreSettings();
  const [rules, setRules] = useState<ShippingRule[]>([]);
  const [globalMessage, setGlobalMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (settings?.shippingRules?.length) setRules([...settings.shippingRules]);
    setGlobalMessage(settings?.shippingRestrictionMessage ?? '');
  }, [settings?.shippingRules, settings?.shippingRestrictionMessage]);

  const addRule = () => setRules(prev => [...prev, defaultRule()]);

  const updateRule = (index: number, patch: Partial<ShippingRule>) =>
    setRules(prev => prev.map((r, i) => i === index ? { ...r, ...patch } : r));

  const removeRule = (index: number) =>
    setRules(prev => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    setSaving(true);
    const result = await saveSettings({
      shippingRules: rules,
      shippingRestrictionMessage: globalMessage || undefined,
    });
    setSaving(false);
    if (result.success) {
      setMessage({ type: 'success', text: 'Configurações salvas.' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao salvar.' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-stone-800">Logística</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Restrições de entrega por categoria e mensagem exibida no produto e no checkout.
          </p>
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
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-stone-900 hover:bg-stone-700 rounded-lg disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Salvar
          </button>
        </div>
      </div>

      {/* Mensagem global */}
      <SectionCard
        title="Mensagem global de restrição"
        description="Exibida quando nenhuma mensagem específica está definida na regra."
      >
        <input
          type="text"
          value={globalMessage}
          onChange={e => setGlobalMessage(e.target.value)}
          placeholder="Ex.: Produtos com restrição logística só podem ser retirados na loja."
          className={inputCls}
        />
      </SectionCard>

      {/* Regras */}
      <SectionCard
        title="Regras por categoria"
        description="Defina restrições de entrega para categorias específicas de produto."
        action={
          <button
            type="button"
            onClick={addRule}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors shrink-0"
          >
            <Plus size={13} />
            Adicionar regra
          </button>
        }
      >
        {rules.length === 0 ? (
          <div className="py-8 text-center text-sm text-stone-400 border border-dashed border-stone-200 rounded-lg">
            Nenhuma regra definida. Todas as categorias usam os métodos padrão de envio.
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule, index) => (
              <div key={index} className="p-4 border border-stone-200 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1.5">Categoria</label>
                    <select
                      value={rule.category}
                      onChange={e => updateRule(index, { category: e.target.value })}
                      className={inputCls}
                    >
                      {CATEGORY_OPTIONS.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1.5">Método de entrega</label>
                    <select
                      value={rule.shipping_method}
                      onChange={e => updateRule(index, { shipping_method: e.target.value as ShippingRule['shipping_method'] })}
                      className={inputCls}
                    >
                      {SHIPPING_METHODS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-stone-400">
                      {SHIPPING_METHODS.find(m => m.value === rule.shipping_method)?.description}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-stone-600 mb-1.5">
                      Mensagem de aviso <span className="text-stone-300 font-normal">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={rule.message ?? ''}
                      onChange={e => updateRule(index, { message: e.target.value || undefined })}
                      placeholder="Ex.: Apenas retirada na loja."
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeRule(index)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={12} />
                    Remover regra
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

    </div>
  );
};

export default AdminShippingGuard;
