import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Lock, Truck, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

const policySections = [
    {
        id: 'privacidade',
        title: 'PolÃ­tica de Privacidade',
        description: 'Saiba como a Aquimaq coleta, usa e protege seus dados pessoais, o uso de cookies e as medidas de seguranÃ§a da informaÃ§Ã£o que adotamos.',
        updatedAt: '2024-01-15',
        icon: Lock,
        content: (
            <div className="space-y-4 text-gray-700">
                <p>
                    A Aquimaq se compromete com a privacidade e a seguranÃ§a de seus clientes.
                    Os dados cadastrais dos clientes nÃ£o sÃ£o vendidos, trocados ou divulgados para terceiros,
                    exceto quando essas informaÃ§Ãµes sÃ£o necessÃ¡rias para o processo de entrega, para cobranÃ§a,
                    ou para participaÃ§Ã£o em promoÃ§Ãµes solicitadas pelos clientes.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mt-4">Uso de Cookies</h3>
                <p>
                    Utilizamos cookies para oferecer uma melhor experiÃªncia de navegaÃ§Ã£o.
                    Cookies sÃ£o pequenos arquivos de dados transferidos de um site da web para o disco do seu computador
                    e nÃ£o armazenam dados pessoais.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mt-4">SeguranÃ§a da InformaÃ§Ã£o</h3>
                <p>
                    Para garantir a seguranÃ§a de seus dados, recomendamos que nÃ£o divulgue sua senha a terceiros,
                    mesmo a amigos e parentes. A Aquimaq nunca envia e-mails pedindo seus dados pessoais
                    (informaÃ§Ãµes de pagamento/cadastro) ou solicitando download ou execuÃ§Ã£o de arquivos.
                </p>
            </div>
        )
    },
    {
        id: 'entrega',
        title: 'PolÃ­tica de Entrega',
        description: 'ConheÃ§a os prazos de entrega da Aquimaq, como rastrear seu pedido e o que acontece em caso de tentativas de entrega sem sucesso.',
        updatedAt: '2024-01-15',
        icon: Truck,
        content: (
            <div className="space-y-4 text-gray-700">
                <p>
                    O prazo para entrega dos produtos varia de acordo com o local solicitado para entrega,
                    forma de pagamento escolhida e disponibilidade do produto adquirido.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mt-4">Rastreamento</h3>
                <p>
                    VocÃª pode acompanhar seu pedido atravÃ©s do nosso site, na Ã¡rea "Meus Pedidos".
                    AlÃ©m disso, vocÃª receberÃ¡ e-mails com atualizaÃ§Ãµes de status da entrega.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mt-4">Tentativas de Entrega</h3>
                <p>
                    SerÃ£o realizadas atÃ© 3 tentativas de entrega. Caso nenhuma delas tenha sucesso,
                    o produto retornarÃ¡ ao nosso Centro de DistribuiÃ§Ã£o e entraremos em contato.
                </p>
            </div>
        )
    },
    {
        id: 'trocas',
        title: 'Trocas e DevoluÃ§Ãµes',
        description: 'Entenda as condiÃ§Ãµes para troca e devoluÃ§Ã£o de produtos na Aquimaq: direito de arrependimento em atÃ© 7 dias conforme o CÃ³digo de Defesa do Consumidor.',
        updatedAt: '2024-01-15',
        icon: RefreshCcw,
        content: (
            <div className="space-y-4 text-gray-700">
                <p>
                    A Aquimaq segue o CÃ³digo de Defesa do Consumidor, garantindo
                    o direito de arrependimento em atÃ© 7 dias corridos apÃ³s o recebimento do produto.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mt-4">Como solicitar</h3>
                <p>
                    Para solicitar a troca ou devoluÃ§Ã£o, entre em contato com nossa Central de Atendimento
                    ou acesse "Meus Pedidos" e selecione a opÃ§Ã£o "Devolver ou Trocar".
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mt-4">CondiÃ§Ãµes</h3>
                <p>
                    O produto deve ser devolvido em sua embalagem original, sem indÃ­cios de uso,
                    acompanhado da Nota Fiscal, manual e todos os seus acessÃ³rios.
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
                <meta name="description" content={policy.description} />
            </Helmet>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <nav className="flex mb-8 text-sm text-gray-500">
                    <Link to={ROUTES.HOME} className="hover:text-agro-700">InÃ­cio</Link>
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

                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600 flex-wrap gap-2">
                        <span className="text-gray-400 text-xs">
                            Ãšltima atualizaÃ§Ã£o: {new Date(policy.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                        <div className="flex items-center gap-4">
                            <span>Ainda tem dÃºvidas?</span>
                            <Link to={ROUTES.CONTACT} className="text-agro-700 font-semibold hover:underline">
                                Fale com nosso atendimento
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PolicyPage;
