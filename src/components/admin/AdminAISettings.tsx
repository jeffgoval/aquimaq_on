import React, { useState, useEffect } from 'react';
import { Bot, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/services/supabase';

interface AIConfig {
  model: string;
  system_prompt: string;
}

const MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (rápido e econômico)' },
  { value: 'gpt-4o', label: 'GPT-4o (mais capaz)' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (legado)' },
];

const DEFAULT_SYSTEM_PROMPT = `Você é um assistente virtual da loja. Responda dúvidas sobre produtos, pedidos e políticas da loja de forma clara e objetiva. Se não souber a resposta, informe que um atendente irá ajudar em breve.`;

const AdminAISettings: React.FC = () => {
  const [config, setConfig] = useState<AIConfig>({
    model: 'gpt-4o-mini',
    system_prompt: DEFAULT_SYSTEM_PROMPT,
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('store_settings')
        .select('ai_config')
        .limit(1)
        .single();
      if (data?.ai_config) {
        setConfig(prev => ({ ...prev, ...data.ai_config }));
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatus('idle');
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      const { data: row } = await sb.from('store_settings').select('id').limit(1).single();
      if (!row) throw new Error('Configurações da loja não encontradas.');

      const { error } = await sb
        .from('store_settings')
        .update({ ai_config: config })
        .eq('id', row.id);

      if (error) throw error;
      setStatus('success');
      setStatusMsg('Configurações salvas com sucesso.');
    } catch (e: unknown) {
      setStatus('error');
      setStatusMsg(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Bot size={20} className="text-stone-600" />
        <h1 className="text-lg font-semibold text-stone-800">Configurações de IA</h1>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">

        {/* Model */}
        <div className="p-5 space-y-3">
          <h2 className="text-sm font-semibold text-stone-700">Modelo</h2>
          <div className="space-y-2">
            {MODELS.map(m => (
              <label key={m.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="model"
                  value={m.value}
                  checked={config.model === m.value}
                  onChange={e => setConfig(prev => ({ ...prev, model: e.target.value }))}
                  className="accent-stone-700"
                />
                <span className="text-sm text-stone-700">{m.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* System Prompt */}
        <div className="p-5 space-y-3">
          <h2 className="text-sm font-semibold text-stone-700">Prompt do Sistema</h2>
          <p className="text-xs text-stone-500">Define o comportamento e personalidade do assistente virtual.</p>
          <textarea
            value={config.system_prompt}
            onChange={e => setConfig(prev => ({ ...prev, system_prompt: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none"
          />
          <button
            type="button"
            onClick={() => setConfig(prev => ({ ...prev, system_prompt: DEFAULT_SYSTEM_PROMPT }))}
            className="text-xs text-stone-400 hover:text-stone-600 underline"
          >
            Restaurar padrão
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {status !== 'idle' && (
          <span className={`flex items-center gap-1.5 text-sm ${status === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
            {status === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {statusMsg}
          </span>
        )}
        <div className="ml-auto">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-700 disabled:opacity-50 transition-colors"
          >
            <Save size={15} />
            {saving ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminAISettings;
