import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { HelpCircle, ChevronDown, ChevronUp, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useStore } from '@/contexts/StoreContext';

const PAYMENT_TYPE_LABELS: Record<string, string> = {
    credit_card: 'cartão de crédito',
    debit_card: 'cartão de débito',
    bank_transfer: 'transferência bancária',
    ticket: 'boleto bancário',
    pix: 'PIX',
};

const FAQPage: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const { settings } = useStore();

    const maxInstallments = settings?.maxInstallments ?? 12;
    const acceptedTypes = settings?.acceptedPaymentTypes ?? ['credit_card', 'ticket', 'pix'];

    const paymentLabels = acceptedTypes.map(t => PAYMENT_TYPE_LABELS[t] ?? t);
    const hasCredit = acceptedTypes.includes('credit_card');

    const paymentAnswer = (() => {
        if (paymentLabels.length === 0) {
            return 'O processamento é feito pelo Mercado Pago, com total segurança para seus dados.';
        }
        const list = paymentLabels.length > 1
            ? `${paymentLabels.slice(0, -1).join(', ')} e ${paymentLabels[paymentLabels.length - 1]}`
            : paymentLabels[0];
        const installmentText = hasCredit ? ` (parcelado em até ${maxInstallments}x no cartão de crédito)` : '';
        return `Aceitamos ${list}${installmentText}. O processamento é feito pelo Mercado Pago, com total segurança para seus dados.`;
    })();

    const storeName = settings?.storeName || 'Aquimaq';

    const faqs = [
        {
            question: 'Quais são os prazos de entrega?',
            answer:
                'Os prazos variam conforme a transportadora e a região de destino. No momento do checkout, você pode consultar as opções de frete com prazos e valores exatos. Em geral, entregamos em todo o Brasil em 3 a 10 dias úteis após a confirmação do pagamento.',
        },
        {
            question: 'Quais formas de pagamento são aceitas?',
            answer: paymentAnswer,
        },
        {
            question: 'Como faço para rastrear meu pedido?',
            answer:
                'Após o envio, você receberá o código de rastreamento por e-mail. Também é possível consultar diretamente em "Minha Conta → Meus Pedidos" no nosso site.',
        },
        {
            question: 'Posso retirar meu pedido no balcão?',
            answer:
                'Sim! Selecione a opção "Retirada no Balcão" na etapa de frete durante o checkout. O prazo para retirada é de 1 a 2 dias úteis após a confirmação do pagamento. Nosso endereço está disponível na página de Contato.',
        },
        {
            question: 'Como funciona a política de troca e devolução?',
            answer:
                'Seguindo o Código de Defesa do Consumidor, você tem até 7 dias corridos após o recebimento para solicitar a devolução por arrependimento. Para produtos com defeito, o prazo é de 30 dias para bens não duráveis e 90 dias para bens duráveis. Consulte nossa Política de Trocas para mais detalhes.',
        },
        {
            question: 'Os produtos têm garantia?',
            answer:
                'Sim. Todos os produtos possuem garantia do fabricante. O prazo varia de acordo com cada produto e marca. Em caso de defeito, entre em contato com nossa Central de Atendimento informando o número do pedido.',
        },
        {
            question: 'É possível emitir nota fiscal?',
            answer:
                `Sim, todas as compras realizadas na ${storeName} incluem nota fiscal eletrônica (NF-e), enviada por e-mail após a confirmação do pagamento.`,
        },
        {
            question: 'Como entro em contato com o suporte?',
            answer:
                'Você pode nos contatar por telefone ou e-mail. Acesse a página "Fale Conosco" para ver todos os canais de atendimento e horários disponíveis.',
        },
    ];

    const toggle = (index: number) => {
        setOpenIndex(prev => (prev === index ? null : index));
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer,
            },
        })),
    };

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Início", "item": "https://aquimaq.com.br/" },
            { "@type": "ListItem", "position": 2, "name": "Perguntas Frequentes", "item": "https://aquimaq.com.br/faq" },
        ],
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <Helmet>
                <title>Perguntas Frequentes | {storeName}</title>
                <meta name="description" content={`Tire suas dúvidas sobre pedidos, entregas, pagamentos e mais na ${storeName}.`} />
                <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
                <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
            </Helmet>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <nav className="flex mb-8 text-sm text-gray-500 items-center gap-1">
                    <Link to={ROUTES.HOME} className="hover:text-agro-700 flex items-center gap-1">
                        <Home size={14} /> Início
                    </Link>
                    <span>/</span>
                    <span className="font-semibold text-gray-900">Perguntas Frequentes</span>
                </nav>

                <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                    <div className="bg-agro-600 px-6 py-8 md:px-10 md:py-12 text-white">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                <HelpCircle size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Perguntas Frequentes</h1>
                                <p className="mt-1 text-white/80">Encontre respostas para as dúvidas mais comuns.</p>
                            </div>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {faqs.map((faq, index) => (
                            <div key={index}>
                                <button
                                    onClick={() => toggle(index)}
                                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                                    aria-expanded={openIndex === index}
                                >
                                    <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                                    {openIndex === index ? (
                                        <ChevronUp size={18} className="text-agro-700 shrink-0" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-400 shrink-0" />
                                    )}
                                </button>
                                {openIndex === index && (
                                    <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
                        <span>Não encontrou o que precisava?</span>
                        <Link to={ROUTES.CONTACT} className="text-agro-700 font-semibold hover:underline">
                            Fale com nosso atendimento
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQPage;
