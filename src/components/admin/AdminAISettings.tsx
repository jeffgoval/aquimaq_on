import React, { useState, useEffect } from 'react';
import {
    Bot, Save, CheckCircle, AlertCircle, Zap, Brain, Sparkles,
    Key, RotateCcw, Thermometer, Package,
} from 'lucide-react';
import { supabase } from '@/services/supabase';
import { cn } from '@/utils/cn';

interface AIConfig {
    model: string;
    system_prompt: string;
    temperature: number;
    max_catalog_products: number;
}

const DEFAULT_SYSTEM_PROMPT = `Você é o atendente virtual do ecommerce da Aquimaq, uma loja agropecuária localizada na cidade de Pedra Bonita - MG, especializada em máquinas, peças, insumos e ferramentas para lavouras de café.

IDENTIDADE E TOM:
- Fale como um vendedor de balcão do interior: simpático, paciente e direto.
- Use linguagem simples e popular.
- Tolere erros de digitação, abreviações e falta de acentos — interprete a intenção sem corrigir o cliente.
- Nunca use termos em inglês (checkout, delivery) nem jargão de internet. Use: "fechar o pedido", "entrega", "loja online".
- Trate o cliente com respeito. Pode usar "o senhor/a senhora" ou "você" conforme o tom da conversa.

CONFIANÇA (o cliente pode desconfiar de compra online):
- Lembre que a Aquimaq é loja física — o cliente pode visitar ou retirar o produto na loja sem custo.
- Nunca pressione para compra. Se houver dúvida, ofereça: atendente humano ou visita presencial.
- Seja transparente sobre prazos, trocas e garantias. Se não souber, diga que vai verificar com a equipe.
- Valide preocupações: "Entendo sua preocupação, aqui na Aquimaq a gente trabalha direitinho."

PRODUTOS E CATÁLOGO:
- O catálogo fornecido é a ÚNICA fonte de verdade sobre o que a loja vende. Todo produto listado com estoque maior que zero, existe na loja, independente da categoria parecer fora do escopo.
- NUNCA negar a existência de um produto que está no catálogo.
- Se o produto não estiver no catálogo, informe gentilmente que não trabalhamos com ele no momento.
- Nunca invente produtos, preços ou especificações fora do catálogo.
- Sobre disponibilidade: diga apenas "temos disponível" ou "está sem estoque no momento, mas pode encomendar" — NUNCA informe quantidade exata de unidades em estoque.
- Se houver desconto por quantidade (atacado), informe a quantidade mínima e o percentual.
- Categorias: Máquinas (Derriçadeiras, Roçadeiras, Pulverizadores, Motopodas), Peças (Hastes, Garras, Carburadores, Filtros), Insumos (Adubos, Fertilizantes, Fungicidas, Inseticidas, Herbicidas), Colheita (Panos de Apanha, Peneiras, Rastelos, Lonas), EPI (Máscaras, Botas, Óculos), Linha Pet e Nutrição Animal.
- Considere a época do ano (safra, entressafra, adubação) para sugerir produtos relevantes.

DOCUMENTOS TÉCNICOS (RAG):
- Quando houver um bloco de DOCUMENTOS TÉCNICOS no contexto, use essas informações (bulas, manuais) para responder sobre dosagem, composição, indicações, modo de uso e segurança.

PAGAMENTO:
- A loja aceita PIX, Boleto, Cartão de Crédito e Débito.
- Para quem prefere "pagar no dinheiro", destaque PIX ("é rapidinho, igual transferência, cai na hora") e Boleto ("imprime e paga no banco ou lotérica").
- Não empurre cartão de crédito como primeira opção.

FRETE E ENTREGA:
- Sempre mencione a Retirada no Balcão (grátis) como opção.
- A loja faz entrega própria (sem custo de frete de transportadora) para endereços em até 25 km de Pedra Bonita-MG.
- NUNCA confirme nem negue entrega para uma cidade específica — você não tem como calcular a distância exata.
- Quando perguntarem se entrega em alguma cidade ou bairro, diga: "A nossa entrega própria cobre até 25 km daqui de Pedra Bonita. Para confirmar se chegamos aí, é melhor falar direto com o vendedor."
- Para entregas fora do raio, oriente retirada na loja ou frete via transportadora (calculado no site).

TRANSFERÊNCIA PARA HUMANO:
- Se o cliente pedir para falar com atendente, fizer reclamação grave, ou você não tiver a informação: responda: "Vou chamar um dos nossos atendentes pra te ajudar melhor, tá bom?".
- Se não souber a resposta: "Vou chamar um dos nossos atendentes pra te ajudar melhor, tá bom?"

FORMATO E LIMITES:
- Respostas curtas (2-4 frases). Evite paredes de texto.
- Nunca invente informações. Seja honesto.
- Divida a resposta em pequenos blocos para a leitura não ficar cansativa e robótica.`;

const MODELS = [
    {
        value: 'gpt-4o-mini',
        label: 'GPT-4o Mini',
        badge: 'Econômico',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        description: 'Ideal para atendimento ao cliente. Rápido, barato e suficiente para a maioria das perguntas.',
        icon: Zap,
    },
    {
        value: 'gpt-4o',
        label: 'GPT-4o',
        badge: 'Intermediário',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        description: 'Respostas mais elaboradas para perguntas técnicas. Equilíbrio entre qualidade e custo.',
        icon: Brain,
    },
    {
        value: 'gpt-4.1',
        label: 'GPT-4.1',
        badge: 'Melhor qualidade',
        badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
        description: 'Melhor seguimento de instruções e conhecimento mais recente. Recomendado para catálogos técnicos.',
        icon: Sparkles,
    },
];

const SectionCard: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({
    title, description, children
}) => (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100">
            <h3 className="text-sm font-semibold text-stone-800">{title}</h3>
            {description && <p className="text-xs text-stone-500 mt-0.5">{description}</p>}
        </div>
        <div className="p-5">{children}</div>
    </div>
);

const AdminAISettings: React.FC = () => {
    const [config, setConfig] = useState<AIConfig>({
        model: 'gpt-4o-mini',
        system_prompt: DEFAULT_SYSTEM_PROMPT,
        temperature: 0.7,
        max_catalog_products: 10,
    });
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [statusMsg, setStatusMsg] = useState('');
    useEffect(() => {
        const load = async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sb = supabase as any;
            const { data } = await sb
                .from('store_settings')
                .select('ai_config')
                .limit(1)
                .single();
            if (data?.ai_config) {
                setConfig(prev => ({
                    ...prev,
                    temperature: 0.7,
                    ...data.ai_config,
                }));
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
            setStatusMsg('Configurações salvas.');
        } catch (e: unknown) {
            setStatus('error');
            setStatusMsg(e instanceof Error ? e.message : 'Erro ao salvar.');
        } finally {
            setSaving(false);
            setTimeout(() => setStatus('idle'), 4000);
        }
    };

    const promptLength = config.system_prompt.length;
    const promptWarning = promptLength > 3500;

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                        <Bot size={18} className="text-stone-600" />
                        Assistente Virtual IA
                    </h1>
                    <p className="text-xs text-stone-500 mt-0.5">
                        Configura o comportamento do chat automático com clientes.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {status !== 'idle' && (
                        <span className={cn(
                            'flex items-center gap-1.5 text-xs font-medium',
                            status === 'success' ? 'text-emerald-600' : 'text-red-600'
                        )}>
                            {status === 'success' ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                            {statusMsg}
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-700 disabled:opacity-50 transition-colors"
                    >
                        <Save size={14} />
                        {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>

            {/* Modelo */}
            <SectionCard
                title="Modelo de linguagem"
                description="Escolha o modelo da OpenAI que o assistente usará para gerar respostas."
            >
                <div className="space-y-2">
                    {MODELS.map(m => {
                        const Icon = m.icon;
                        const selected = config.model === m.value;
                        return (
                            <label
                                key={m.value}
                                className={cn(
                                    'flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors',
                                    selected ? 'border-stone-400 bg-stone-50' : 'border-stone-200 hover:bg-stone-50'
                                )}
                            >
                                <input
                                    type="radio"
                                    name="model"
                                    value={m.value}
                                    checked={selected}
                                    onChange={() => setConfig(p => ({ ...p, model: m.value }))}
                                    className="accent-stone-700 mt-0.5"
                                />
                                <Icon size={15} className={selected ? 'text-stone-700' : 'text-stone-400'} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-medium text-stone-800">{m.label}</span>
                                        <span className={cn('text-xs border rounded-full px-2 py-0.5', m.badgeColor)}>
                                            {m.badge}
                                        </span>
                                    </div>
                                    <p className="text-xs text-stone-500 mt-0.5">{m.description}</p>
                                </div>
                            </label>
                        );
                    })}
                </div>
            </SectionCard>

            {/* Comportamento */}
            <SectionCard
                title="Comportamento"
                description="Define como o assistente se apresenta e responde aos clientes."
            >
                <div className="space-y-5">
                    {/* Temperatura */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-stone-600">
                                <Thermometer size={12} />
                                Criatividade (temperatura)
                            </label>
                            <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                                {config.temperature.toFixed(1)}
                            </span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.1}
                            value={config.temperature}
                            onChange={e => setConfig(p => ({ ...p, temperature: parseFloat(e.target.value) }))}
                            className="w-full accent-stone-700"
                        />
                        <div className="flex justify-between mt-1">
                            <span className="text-xs text-stone-400">Preciso e direto</span>
                            <span className="text-xs text-stone-400">Criativo e variado</span>
                        </div>
                    </div>

                    {/* Máximo de produtos no catálogo */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-stone-600">
                                <Package size={12} />
                                Produtos no contexto do chat
                            </label>
                            <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                                {config.max_catalog_products} produtos
                            </span>
                        </div>
                        <input
                            type="range"
                            min={5}
                            max={30}
                            step={1}
                            value={config.max_catalog_products}
                            onChange={e => setConfig(p => ({ ...p, max_catalog_products: parseInt(e.target.value) }))}
                            className="w-full accent-stone-700"
                        />
                        <div className="flex justify-between mt-1">
                            <span className="text-xs text-stone-400">5 — mais econômico</span>
                            <span className="text-xs text-stone-400">30 — contexto completo</span>
                        </div>
                        <p className="text-xs text-stone-400 mt-1.5">
                            Quantos produtos do catálogo são enviados ao assistente por mensagem. O assistente sempre prioriza os produtos relacionados à pergunta do cliente.
                        </p>
                    </div>

                    {/* System Prompt */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-stone-600">Prompt do sistema</label>
                            <span className={cn(
                                'text-xs font-mono',
                                promptWarning ? 'text-amber-500' : 'text-stone-400'
                            )}>
                                {promptLength} caracteres{promptWarning && ' — prompt longo aumenta o custo'}
                            </span>
                        </div>
                        <textarea
                            value={config.system_prompt}
                            onChange={e => setConfig(p => ({ ...p, system_prompt: e.target.value }))}
                            rows={14}
                            className={cn(
                                'w-full px-3 py-2 text-sm border rounded-lg resize-none',
                                'focus:outline-none focus:ring-2 focus:ring-stone-300',
                                promptWarning ? 'border-amber-300' : 'border-stone-200'
                            )}
                            placeholder="Descreva como o assistente deve se comportar..."
                        />
                        <button
                            type="button"
                            onClick={() => setConfig(p => ({ ...p, system_prompt: DEFAULT_SYSTEM_PROMPT }))}
                            className="flex items-center gap-1 mt-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
                        >
                            <RotateCcw size={11} />
                            Restaurar padrão
                        </button>
                    </div>
                </div>
            </SectionCard>


            {/* API Key */}
            <SectionCard
                title="Chave de API OpenAI"
                description="A chave de API é configurada como variável de ambiente segura no servidor."
            >
                <div className="flex items-start gap-3 text-sm text-stone-600">
                    <Key size={15} className="text-stone-400 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                        <p>Configure a variável <code className="font-mono text-xs bg-stone-100 px-1.5 py-0.5 rounded">OPENAI_API_KEY</code> nas Edge Functions do Supabase.</p>
                        <p className="text-xs text-stone-400">A chave nunca é exposta no frontend por segurança.</p>
                    </div>
                </div>
            </SectionCard>

        </div>
    );
};

export default AdminAISettings;
