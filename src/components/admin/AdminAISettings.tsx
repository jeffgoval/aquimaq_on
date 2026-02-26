import React, { useState, useEffect } from 'react';
import { getAISettings, saveAISettings, type AISettings } from '@/services/adminService';
import { Settings2, Save, Key, RefreshCw, Cpu } from 'lucide-react';

const AdminAISettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [formData, setFormData] = useState<Omit<AISettings, 'id'>>({
        provider: 'openai',
        api_key: '',
        model: 'text-embedding-3-small',
    });

    useEffect(() => {
        const loadSettings = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getAISettings();
                if (data) {
                    setFormData({
                        provider: data.provider,
                        api_key: data.api_key,
                        model: data.model || 'text-embedding-3-small',
                    });
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erro ao carregar configurações de IA');
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            if (!formData.api_key.trim()) {
                throw new Error('A chave da API (API Key) é obrigatória.');
            }

            await saveAISettings(formData);
            setSuccess('Configurações de IA salvas com sucesso!');

            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <RefreshCw className="animate-spin text-stone-400" size={24} />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-stone-800 flex items-center gap-2">
                        <Cpu className="text-stone-400" size={24} />
                        Integração com IA
                    </h1>
                    <p className="text-stone-400 text-[13px] mt-0.5">
                        Configure as chaves e modelos para o sistema ler documentos PDF.
                    </p>
                </div>
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-[13px] border border-red-100 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    {error}
                </div>
            )}

            {success && (
                <div className="p-3 rounded-lg bg-green-50 text-green-700 text-[13px] border border-green-100 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    {success}
                </div>
            )}

            <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-stone-50 pb-6">

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[13px] font-medium text-stone-700 mb-1.5">
                                Provedor de IA
                            </label>
                            <select
                                name="provider"
                                value={formData.provider}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400 focus:bg-white transition-colors"
                                required
                            >
                                <option value="openai">OpenAI</option>
                                <option value="anthropic" disabled>Anthropic (Em Breve)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[13px] font-medium text-stone-700 mb-1.5">
                                Modelo (Embeddings)
                            </label>
                            <input
                                type="text"
                                name="model"
                                value={formData.model || ''}
                                onChange={handleChange}
                                placeholder="text-embedding-3-small"
                                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400 focus:bg-white transition-colors"
                            />
                            <p className="text-[11px] text-stone-400 mt-1.5">
                                Modelo usado para converter o texto em vetores. Recomendado: `text-embedding-3-small`.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[13px] font-medium text-stone-700 mb-1.5 flex items-center gap-1.5">
                                <Key size={14} className="text-stone-400" />
                                Chave da API (API Key)
                            </label>
                            <input
                                type="password"
                                name="api_key"
                                value={formData.api_key}
                                onChange={handleChange}
                                placeholder="sk-..."
                                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400 focus:bg-white transition-colors font-mono"
                                required
                            />
                            <p className="text-[11px] text-stone-400 mt-1.5">
                                Sua chave secreta da OpenAI. Mantenha em segurança.
                            </p>
                        </div>
                    </div>

                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 bg-stone-800 text-white rounded-lg text-[13px] font-medium hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                        {saving ? (
                            <><RefreshCw size={14} className="animate-spin" /> Salvando...</>
                        ) : (
                            <><Save size={14} /> Salvar Configurações</>
                        )}
                    </button>
                </div>
            </form>

            <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-5 mt-8">
                <h3 className="text-sm font-medium text-blue-800 flex items-center gap-2 mb-2">
                    <Settings2 size={16} className="text-blue-500" />
                    Como isso funciona?
                </h3>
                <p className="text-blue-600/80 text-[13px] leading-relaxed">
                    Ao salvar sua chave da OpenAI, o sistema será capaz de ler o conteúdo literal de qualquer PDF novo enviado para a Base de Conhecimento.
                    O arquivo PDF será processado usando o modelo de <i>Embeddings</i> (vetores) para que a Inteligência Artificial entenda e possa
                    pesquisar as informações (arquitetura RAG).
                </p>
            </div>

        </div>
    );
};

export default AdminAISettings;
