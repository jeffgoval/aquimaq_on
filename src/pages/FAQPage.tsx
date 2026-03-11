import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { HelpCircle, ChevronDown, ChevronUp, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useStore } from '@/contexts/StoreContext';

const PAYMENT_TYPE_LABELS: Record<string, string> = {
    credit_card: 'cartÃ£o de crÃ©dito',
    debit_card: 'cartÃ£o de dÃ©bito',
    bank_transfer: 'transferÃªncia bancÃ¡ria',
    ticket: 'boleto bancÃ¡rio',
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
            return 'O processamento Ã© feito pelo Mercado Pago, com total seguranÃ§a para seus dados.';
        }
        const list = paymentLabels.length > 1
            ? `${paymentLabels.slice(0, -1).join(', ')} e ${paymentLabels[paymentLabels.length - 1]}`
            : paymentLabels[0];
        const installmentText = hasCredit ? ` (parcelado em atÃ© ${maxInstallments}x no cartÃ£o de crÃ©dito)` : '';
        return `Aceitamos ${list}${installmentText}. O processamento Ã© feito pelo Mercado Pago, com total seguranÃ§a para seus dados.`;
    })();

    const storeName = settings?.storeName || 'Aquimaq';

    const faqs = [
        {
            question: 'Quais sÃ£o os prazos de entrega?',
            answer:
                'Os prazos variam conforme a transportadora e a regiÃ£o de destino. No momento do checkout, vocÃª pode consultar as opÃ§Ãµes de frete com prazos e valores exatos. Em geral, entregamos em todo o Brasil em 3 a 10 dias Ãºteis apÃ³s a confirmaÃ§Ã£o do pagamento.',
        },
        {
            question: 'Quais formas de pagamento sÃ£o aceitas?',
            answer: paymentAnswer,
        },
        {
            question: 'Como faÃ§o para rastrear meu pedido?',
            answer:
                'ApÃ³s o envio, vocÃª receberÃ¡ o cÃ³digo de rastreamento por e-mail. TambÃ©m Ã© possÃ­vel consultar diretamente em "Minha Conta â†’ Meus Pedidos" no nosso site.',
        },
        {
            question: 'Posso retirar meu pedido no balcÃ£o?',
            answer:
                'Sim! Selecione a opÃ§Ã£o "Retirada no BalcÃ£o" na etapa de frete durante o checkout. O prazo para retirada Ã© de 1 a 2 dias Ãºteis apÃ³s a confirmaÃ§Ã£o do pagamento. Nosso endereÃ§o estÃ¡ disponÃ­vel na pÃ¡gina de Contato.',
        },
        {
            question: 'Como funciona a polÃ­tica de troca e devoluÃ§Ã£o?',
            answer:
                'Seguindo o CÃ³digo de Defesa do Consumidor, vocÃª tem atÃ© 7 dias corridos apÃ³s o recebimento para solicitar a devoluÃ§Ã£o por arrependimento. Para produtos com defeito, o prazo Ã© de 30 dias para bens nÃ£o durÃ¡veis e 90 dias para bens durÃ¡veis. Consulte nossa PolÃ­tica de Trocas para mais detalhes.',
        },
        {
            question: 'Os produtos tÃªm garantia?',
            answer:
                'Sim. Todos os produtos possuem garantia do fabricante. O prazo varia de acordo com cada produto e marca. Em caso de defeito, entre em contato com nossa Central de Atendimento informando o nÃºmero do pedido.',
        },
        {
            question: 'Ã‰ possÃ­vel emitir nota fiscal?',
            answer:
                `Sim, todas as compras realizadas na ${storeName} incluem nota fiscal eletrÃ´nica (NF-e), enviada por e-mail apÃ³s a confirmaÃ§Ã£o do pagamento.`,
        },
        {
            question: 'Como entro em contato com o suporte?',
            answer:
                'VocÃª pode nos contatar por telefone ou e-mail. Acesse a pÃ¡gina "Fale Conosco" para ver todos os canais de atendimento e horÃ¡rios disponÃ­veis.',
        },
    ];

    const toggle = (index: number) => {
        setOpenIndex(prev => (prev === index ? null : index));
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <Helmet>
                <title>Perguntas Frequentes | {storeName}</title>
                <meta name="description" content={`Tire suas dÃºvidas sobre pedidos, entregas, pagamentos e mais na ${storeName}.`} />
            </Helmet>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <nav className="flex mb-8 text-sm text-gray-500 items-center gap-1">
                    <Link to={ROUTES.HOME} className="hover:text-agro-700 flex items-center gap-1">
                        <Home size={14} /> InÃ­cio
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
                                <p className="mt-1 text-white/80">Encontre respostas para as dÃºvidas mais comuns.</p>
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
                        <span>NÃ£o encontrou o que precisava?</span>
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
