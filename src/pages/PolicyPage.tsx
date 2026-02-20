import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, Lock, Truck, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

const policySections = [
    {
        id: 'privacidade',
        title: 'Política de Privacidade',
        icon: Lock,
        content: (
            <div className="space-y-4 text-gray-700">
                <p>
                    A Aquimaq se compromete com a privacidade e a segurança de seus clientes.
                    Os dados cadastrais dos clientes não são vendidos, trocados ou divulgados para terceiros,
                    exceto quando essas informações são necessárias para o processo de entrega, para cobrança,
                    ou para participação em promoções solicitadas pelos clientes.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mt-4">Uso de Cookies</h3>
                <p>
                    Utilizamos cookies para oferecer uma melhor experiência de navegação.
                    Cookies são pequenos arquivos de dados transferidos de um site da web para o disco do seu computador
                    e não armazenam dados pessoais.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mt-4">Segurança da Informação</h3>
                <p>
                    Para garantir a segurança de seus dados, recomendamos que não divulgue sua senha a terceiros,
                    mesmo a amigos e parentes. A Aquimaq nunca envia e-mails pedindo seus dados pessoais
                    (informações de pagamento/cadastro) ou solicitando download ou execução de arquivos.
                </p>
            </div>
        )
    },
    {
        id: 'entrega',
        title: 'Política de Entrega',
        icon: Truck,
        content: (
            <div className="space-y-4 text-gray-700">
                <p>
                    O prazo para entrega dos produtos varia de acordo com o local solicitado para entrega,
                    forma de pagamento escolhida e disponibilidade do produto adquirido.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mt-4">Rastreamento</h3>
                <p>
                    Você pode acompanhar seu pedido através do nosso site, na área "Meus Pedidos".
                    Além disso, você receberá e-mails com atualizações de status da entrega.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mt-4">Tentativas de Entrega</h3>
                <p>
                    Serão realizadas até 3 tentativas de entrega. Caso nenhuma delas tenha sucesso,
                    o produto retornará ao nosso Centro de Distribuição e entraremos em contato.
                </p>
            </div>
        )
    },
    {
        id: 'trocas',
        title: 'Trocas e Devoluções',
        icon: RefreshCcw,
        content: (
            <div className="space-y-4 text-gray-700">
                <p>
                    A Aquimaq segue o Código de Defesa do Consumidor, garantindo
                    o direito de arrependimento em até 7 dias corridos após o recebimento do produto.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mt-4">Como solicitar</h3>
                <p>
                    Para solicitar a troca ou devolução, entre em contato com nossa Central de Atendimento
                    ou acesse "Meus Pedidos" e selecione a opção "Devolver ou Trocar".
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mt-4">Condições</h3>
                <p>
                    O produto deve ser devolvido em sua embalagem original, sem indícios de uso,
                    acompanhado da Nota Fiscal, manual e todos os seus acessórios.
                </p>
            </div>
        )
    }
];

const PolicyPage: React.FC<{ type: 'privacidade' | 'entrega' | 'trocas' }> = ({ type }) => {
    const policy = policySections.find(p => p.id === type) || policySections[0];

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <Helmet>
                <title>{policy.title} | Aquimaq</title>
                <meta name="description" content={`Confira nossa ${policy.title}.`} />
            </Helmet>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <nav className="flex mb-8 text-sm text-gray-500">
                    <Link to="/" className="hover:text-agro-600">Início</Link>
                    <span className="mx-2">/</span>
                    <span className="font-semibold text-gray-900">{policy.title}</span>
                </nav>

                <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                    <div className="bg-agro-600 px-6 py-8 md:px-10 md:py-12 text-white">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                <policy.icon size={32} />
                            </div>
                            <h1 className="text-3xl font-bold">{policy.title}</h1>
                        </div>
                    </div>

                    <div className="p-6 md:p-10">
                        {policy.content}
                    </div>

                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
                        <span>Ainda tem dúvidas?</span>
                        <Link to="/contato" className="text-agro-600 font-semibold hover:underline">
                            Fale com nosso atendimento
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PolicyPage;
