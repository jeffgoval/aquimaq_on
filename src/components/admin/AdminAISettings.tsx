import React, { useState, useEffect } from 'react';
import { getAISettings, saveAISettings, AI_SETTINGS_DEFAULTS, type AISettings } from '@/services/adminService';
import { supabase } from '@/services/supabase';
import {
    Settings2, Save, Key, RefreshCw, Cpu, Database,
    Bot, Wrench, MessageSquare, ChevronDown, ChevronUp, Info
} from 'lucide-react';

type Tab = 'credentials' | 'agent' | 'tools' | 'behavior';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'credentials', label: 'Credenciais', icon: <Key size={14} /> },
    { id: 'agent',       label: 'Agente IA',   icon: <Bot size={14} /> },
    { id: 'tools',       label: 'Ferramentas', icon: <Wrench size={14} /> },
    { id: 'behavior',    label: 'Comportamento', icon: <MessageSquare size={14} /> },
];

const CHAT_MODELS = [
    { value: 'gpt-4o-mini',   label: 'GPT-4o Mini (rápido, econômico)' },
    { value: 'gpt-4o',        label: 'GPT-4o (mais capaz)' },
    { value: 'gpt-4-turbo',   label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (barato)' },
];

const EMBEDDING_MODELS = [
    { value: 'text-embedding-3-small', label: 'text-embedding-3-small (recomendado)' },
    { value: 'text-embedding-3-large', label: 'text-embedding-3-large (melhor qualidade)' },
    { value: 'text-embedding-ada-002', label: 'text-embedding-ada-002 (legado)' },
];

const ALL_TOOLS = [
    { id: 'buscar_produtos',    label: 'Buscar Produtos',    desc: 'Consulta estoque, preços e disponibilidade em tempo real' },
    { id: 'buscar_pedido',      label: 'Buscar Pedido',      desc: 'Consulta status, itens e rastreio de pedidos por ID' },
    { id: 'buscar_conhecimento', label: 'Base de Conhecimento', desc: 'RAG: busca em manuais, bulas e documentos técnicos' },
];

const DEFAULT_SYSTEM_PROMPT = `Você é a Assistente Virtual da Aquimaq, especializada em ferramentas, peças e sementes para o agronegócio.

Você tem acesso a ferramentas para buscar informações em tempo real. USE-AS sempre que necessário antes de responder.

Regras:
- Responda SEMPRE em português brasileiro, de forma cordial e objetiva
- NUNCA invente preços, especificações ou prazos — use a ferramenta e informe o que encontrar
- Se não encontrar a informação após usar as ferramentas, seja honesto e ofereça transferir para um atendente
- Use [HANDOFF] no final da resposta para transferir para humano quando:
  • Cliente pedir atendente explicitamente
  • Reclamação grave ou cliente muito insatisfeito
  • Negociação de preço ou condição especial
  • Problema que as ferramentas não resolveram após 2 tentativas`;

type FormData = Omit<AISettings, 'id'>;

const AdminAISettings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('credentials');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [promptExpanded, setPromptExpanded] = useState(false);

    const [form, setForm] = useState<FormData>({
        ...AI_SETTINGS_DEFAULTS,
        api_key: '',
        system_prompt: DEFAULT_SYSTEM_PROMPT,
    });

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await getAISettings();
                if (data) {
                    setForm({
                        provider:          data.provider          ?? AI_SETTINGS_DEFAULTS.provider,
                        api_key:           data.api_key           ?? '',
                        model:             data.model             ?? AI_SETTINGS_DEFAULTS.model,
                        chat_model:        data.chat_model        ?? AI_SETTINGS_DEFAULTS.chat_model,
                        system_prompt:     data.system_prompt     ?? DEFAULT_SYSTEM_PROMPT,
                        temperature:       data.temperature       ?? AI_SETTINGS_DEFAULTS.temperature,
                        max_tokens:        data.max_tokens        ?? AI_SETTINGS_DEFAULTS.max_tokens,
                        max_iterations:    data.max_iterations    ?? AI_SETTINGS_DEFAULTS.max_iterations,
                        active_tools:      data.active_tools      ?? AI_SETTINGS_DEFAULTS.active_tools,
                        rag_threshold:     data.rag_threshold     ?? AI_SETTINGS_DEFAULTS.rag_threshold,
                        product_threshold: data.product_threshold ?? AI_SETTINGS_DEFAULTS.product_threshold,
                        greeting_message:  data.greeting_message  ?? AI_SETTINGS_DEFAULTS.greeting_message,
                        handoff_triggers:  data.handoff_triggers  ?? AI_SETTINGS_DEFAULTS.handoff_triggers,
                    });
                }
            } catch (e) {
                setError('Erro ao carregar configurações.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const set = (field: keyof FormData, value: unknown) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const toggleTool = (toolId: string) => {
        const current = form.active_tools ?? [];
        set('active_tools', current.includes(toolId)
            ? current.filter(t => t !== toolId)
            : [...current, toolId]);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const key = form.api_key.trim();
            if (!key) throw new Error('A chave da API (API Key) é obrigatória.');
            if (form.provider === 'openai' && !key.startsWith('sk-'))
                throw new Error('Chave inválida — chaves OpenAI começam com "sk-".');
            if (!form.active_tools?.length)
                throw new Error('Ative pelo menos uma ferramenta para o agente.');
            await saveAISettings(form);
            setSuccess('Configurações salvas com sucesso!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao salvar.');
        } finally {
            setSaving(false);
        }
    };

    const handleSyncEmbeddings = async () => {
        setSyncing(true);
        setError(null);
        setSuccess(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Sessão expirada.');
            const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-product-embeddings`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ only_missing: true }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? `Erro ${res.status}`);
            setSuccess(`Embeddings: ${data?.updated ?? 0} produtos atualizados de ${data?.total ?? 0}.`);
            setTimeout(() => setSuccess(null), 5000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao sincronizar embeddings.');
        } finally {
            setSyncing(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <RefreshCw className="animate-spin text-stone-400" size={24} />
        </div>
    );

    return (
        <div className="space-y-5 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-stone-800 flex items-center gap-2">
                        <Cpu className="text-stone-400" size={24} />
                        Configurações do Agente IA
                    </h1>
                    <p className="text-stone-400 text-[13px] mt-0.5">
                        Controle completo do comportamento, modelo e ferramentas do agente WhatsApp.
                    </p>
                </div>
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-[13px] border border-red-100 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />{error}
                </div>
            )}
            {success && (
                <div className="p-3 rounded-lg bg-green-50 text-green-700 text-[13px] border border-green-100 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />{success}
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-stone-200">
                <div className="flex gap-1">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
                                activeTab === tab.id
                                    ? 'border-stone-800 text-stone-800'
                                    : 'border-transparent text-stone-400 hover:text-stone-600'
                            }`}
                        >
                            {tab.icon}{tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-5">

                {/* ── ABA: CREDENCIAIS ── */}
                {activeTab === 'credentials' && (
                    <div className="bg-white rounded-xl border border-stone-100 shadow-sm p-6 space-y-5">
                        <h2 className="text-[13px] font-semibold text-stone-700 uppercase tracking-wide">Credenciais OpenAI</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[13px] font-medium text-stone-700 mb-1.5 flex items-center gap-1.5">
                                    <Key size={13} className="text-stone-400" /> Chave da API (API Key)
                                </label>
                                <input
                                    type="password"
                                    value={form.api_key}
                                    onChange={e => set('api_key', e.target.value)}
                                    placeholder="sk-..."
                                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-[13px] font-mono focus:outline-none focus:border-stone-400"
                                    required
                                />
                                <p className="text-[11px] text-stone-400 mt-1">Chave secreta da OpenAI. Não compartilhe.</p>
                            </div>
                            <div>
                                <label className="block text-[13px] font-medium text-stone-700 mb-1.5">Modelo de Embeddings</label>
                                <select
                                    value={form.model ?? ''}
                                    onChange={e => set('model', e.target.value)}
                                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400"
                                >
                                    {EMBEDDING_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                                <p className="text-[11px] text-stone-400 mt-1">Usado para indexar produtos e documentos (RAG).</p>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-stone-50">
                            <p className="text-[12px] font-medium text-stone-600 mb-2">Sincronização de Embeddings</p>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleSyncEmbeddings}
                                    disabled={syncing}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {syncing ? <><RefreshCw size={13} className="animate-spin" />Sincronizando...</> : <><Database size={13} />Sincronizar Produtos</>}
                                </button>
                                <p className="text-[12px] text-stone-400">Gera vetores para produtos sem embedding (necessário para busca semântica).</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── ABA: AGENTE IA ── */}
                {activeTab === 'agent' && (
                    <div className="bg-white rounded-xl border border-stone-100 shadow-sm p-6 space-y-5">
                        <h2 className="text-[13px] font-semibold text-stone-700 uppercase tracking-wide">Modelo & Parâmetros</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[13px] font-medium text-stone-700 mb-1.5">Modelo Conversacional</label>
                                <select
                                    value={form.chat_model}
                                    onChange={e => set('chat_model', e.target.value)}
                                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400"
                                >
                                    {CHAT_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                                <p className="text-[11px] text-stone-400 mt-1">Modelo que gera as respostas para os clientes.</p>
                            </div>
                            <div>
                                <label className="block text-[13px] font-medium text-stone-700 mb-1.5">
                                    Temperatura: <span className="text-stone-500 font-mono">{form.temperature}</span>
                                </label>
                                <input
                                    type="range" min="0" max="1" step="0.05"
                                    value={form.temperature}
                                    onChange={e => set('temperature', parseFloat(e.target.value))}
                                    className="w-full accent-stone-700"
                                />
                                <div className="flex justify-between text-[11px] text-stone-400 mt-0.5">
                                    <span>0 — preciso/direto</span>
                                    <span>1 — criativo/variado</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[13px] font-medium text-stone-700 mb-1.5">Máx. Tokens por Resposta</label>
                                <input
                                    type="number" min="200" max="4000" step="100"
                                    value={form.max_tokens}
                                    onChange={e => set('max_tokens', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-[13px] font-mono focus:outline-none focus:border-stone-400"
                                />
                                <p className="text-[11px] text-stone-400 mt-1">Limite de tokens por mensagem. 1000 ≈ ~750 palavras.</p>
                            </div>
                            <div>
                                <label className="block text-[13px] font-medium text-stone-700 mb-1.5">
                                    Máx. Iterações de Ferramentas: <span className="text-stone-500 font-mono">{form.max_iterations}</span>
                                </label>
                                <input
                                    type="range" min="1" max="10" step="1"
                                    value={form.max_iterations}
                                    onChange={e => set('max_iterations', parseInt(e.target.value))}
                                    className="w-full accent-stone-700"
                                />
                                <div className="flex justify-between text-[11px] text-stone-400 mt-0.5">
                                    <span>1 — uma chamada</span>
                                    <span>10 — máx loops</span>
                                </div>
                                <p className="text-[11px] text-stone-400 mt-1">Quantas vezes o agente pode chamar ferramentas antes de responder. Recomendado: 4–6.</p>
                            </div>
                        </div>

                        {/* System Prompt */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[13px] font-medium text-stone-700">Prompt do Sistema</label>
                                <button
                                    type="button"
                                    onClick={() => setPromptExpanded(v => !v)}
                                    className="flex items-center gap-1 text-[12px] text-stone-400 hover:text-stone-600"
                                >
                                    {promptExpanded ? <><ChevronUp size={13} />Recolher</> : <><ChevronDown size={13} />Expandir</>}
                                </button>
                            </div>
                            <textarea
                                value={form.system_prompt ?? ''}
                                onChange={e => set('system_prompt', e.target.value)}
                                rows={promptExpanded ? 20 : 6}
                                placeholder="Defina a personalidade, regras e restrições do agente..."
                                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-[13px] font-mono focus:outline-none focus:border-stone-400 resize-none leading-relaxed"
                            />
                            <p className="text-[11px] text-stone-400 mt-1 flex items-center gap-1">
                                <Info size={11} />
                                Use <code className="bg-stone-100 px-1 rounded">[HANDOFF]</code> no prompt para indicar quando transferir para humano.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── ABA: FERRAMENTAS ── */}
                {activeTab === 'tools' && (
                    <div className="bg-white rounded-xl border border-stone-100 shadow-sm p-6 space-y-6">
                        <h2 className="text-[13px] font-semibold text-stone-700 uppercase tracking-wide">Ferramentas Disponíveis</h2>

                        <div className="space-y-3">
                            {ALL_TOOLS.map(tool => {
                                const active = (form.active_tools ?? []).includes(tool.id);
                                return (
                                    <div
                                        key={tool.id}
                                        onClick={() => toggleTool(tool.id)}
                                        className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                                            active
                                                ? 'border-stone-300 bg-stone-50'
                                                : 'border-stone-100 bg-white opacity-60 hover:opacity-80'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${active ? 'bg-stone-800' : 'border-2 border-stone-300'}`}>
                                            {active && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[13px] font-medium text-stone-800">{tool.label}</p>
                                            <p className="text-[12px] text-stone-400">{tool.desc}</p>
                                        </div>
                                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                                            {active ? 'ativa' : 'inativa'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="border-t border-stone-100 pt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[13px] font-medium text-stone-700 mb-1.5">
                                    Threshold Base de Conhecimento: <span className="font-mono text-stone-500">{form.rag_threshold}</span>
                                </label>
                                <input
                                    type="range" min="0.3" max="0.95" step="0.05"
                                    value={form.rag_threshold}
                                    onChange={e => set('rag_threshold', parseFloat(e.target.value))}
                                    className="w-full accent-stone-700"
                                />
                                <div className="flex justify-between text-[11px] text-stone-400 mt-0.5">
                                    <span>0.3 — mais resultados</span>
                                    <span>0.95 — só muito similares</span>
                                </div>
                                <p className="text-[11px] text-stone-400 mt-1">Similaridade mínima para retornar um trecho de manual/bula. Recomendado: 0.55–0.65.</p>
                            </div>
                            <div>
                                <label className="block text-[13px] font-medium text-stone-700 mb-1.5">
                                    Threshold Busca de Produtos: <span className="font-mono text-stone-500">{form.product_threshold}</span>
                                </label>
                                <input
                                    type="range" min="0.2" max="0.90" step="0.05"
                                    value={form.product_threshold}
                                    onChange={e => set('product_threshold', parseFloat(e.target.value))}
                                    className="w-full accent-stone-700"
                                />
                                <div className="flex justify-between text-[11px] text-stone-400 mt-0.5">
                                    <span>0.2 — mais resultados</span>
                                    <span>0.9 — só exatos</span>
                                </div>
                                <p className="text-[11px] text-stone-400 mt-1">Similaridade mínima para busca semântica de produtos. Recomendado: 0.40–0.50.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── ABA: COMPORTAMENTO ── */}
                {activeTab === 'behavior' && (
                    <div className="bg-white rounded-xl border border-stone-100 shadow-sm p-6 space-y-5">
                        <h2 className="text-[13px] font-semibold text-stone-700 uppercase tracking-wide">Mensagens & Transferência</h2>

                        <div>
                            <label className="block text-[13px] font-medium text-stone-700 mb-1.5">Mensagem de Saudação</label>
                            <textarea
                                value={form.greeting_message ?? ''}
                                onChange={e => set('greeting_message', e.target.value)}
                                rows={3}
                                placeholder="Ex: Olá! Sou a assistente virtual da Aquimaq. Como posso ajudar?"
                                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400 resize-none"
                            />
                            <p className="text-[11px] text-stone-400 mt-1">Enviada automaticamente quando o cliente manda a primeira mensagem.</p>
                        </div>

                        <div>
                            <label className="block text-[13px] font-medium text-stone-700 mb-1.5">Gatilhos de Transferência para Humano</label>
                            <textarea
                                value={form.handoff_triggers ?? ''}
                                onChange={e => set('handoff_triggers', e.target.value)}
                                rows={4}
                                placeholder="atendente,quero falar com humano,preciso de ajuda humana"
                                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-[13px] font-mono focus:outline-none focus:border-stone-400 resize-none"
                            />
                            <p className="text-[11px] text-stone-400 mt-1 flex items-center gap-1">
                                <Info size={11} />
                                Frases separadas por vírgula. Quando o cliente escrever qualquer uma, o agente usa [HANDOFF] imediatamente.
                            </p>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                            <p className="text-[13px] font-medium text-amber-800 mb-1">Como funciona o handoff?</p>
                            <p className="text-[12px] text-amber-700 leading-relaxed">
                                Quando o agente detecta que precisa transferir (gatilho ou situação complexa), ele inclui <code className="bg-amber-100 px-1 rounded">[HANDOFF]</code> na resposta.
                                A conversa muda para status <strong>Aguardando Humano</strong> no painel de Atendimento e um gerente/vendedor pode assumir.
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center">
                    <p className="text-[12px] text-stone-400">
                        As alterações são aplicadas imediatamente — o agente usa as novas configs a partir da próxima mensagem.
                    </p>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2.5 bg-stone-800 text-white rounded-lg text-[13px] font-medium hover:bg-stone-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                        {saving ? <><RefreshCw size={14} className="animate-spin" />Salvando...</> : <><Save size={14} />Salvar Configurações</>}
                    </button>
                </div>
            </form>

            <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-5">
                <h3 className="text-sm font-medium text-blue-800 flex items-center gap-2 mb-2">
                    <Settings2 size={15} className="text-blue-500" />
                    Dica: Fluxo recomendado
                </h3>
                <ol className="text-[12px] text-blue-700 space-y-1 list-decimal list-inside leading-relaxed">
                    <li>Configure a chave OpenAI e clique em <strong>Sincronizar Produtos</strong> para ativar a busca semântica.</li>
                    <li>Faça upload de manuais e bulas em <strong>Base de Conhecimento</strong> para o RAG responder dúvidas técnicas.</li>
                    <li>Ajuste o <strong>Prompt do Sistema</strong> com o nome da empresa, tom de voz e regras específicas.</li>
                    <li>Defina os <strong>Gatilhos de Transferência</strong> de acordo com as palavras que seus clientes usam.</li>
                </ol>
            </div>
        </div>
    );
};

export default AdminAISettings;
