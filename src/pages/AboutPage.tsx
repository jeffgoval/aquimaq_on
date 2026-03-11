import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Home, Leaf, Users, ShieldCheck, Tractor } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

const values = [
    {
        icon: ShieldCheck,
        title: 'Qualidade',
        description: 'Trabalhamos apenas com marcas e fornecedores homologados, garantindo produtos durÃ¡veis e eficientes para o campo.',
    },
    {
        icon: Users,
        title: 'Atendimento',
        description: 'Nossa equipe conhece as necessidades do produtor rural. Estamos aqui para orientar e agilizar sua operaÃ§Ã£o.',
    },
    {
        icon: Leaf,
        title: 'Sustentabilidade',
        description: 'Valorizamos prÃ¡ticas responsÃ¡veis e buscamos soluÃ§Ãµes que respeitem o meio ambiente e o futuro do agronegÃ³cio.',
    },
];

const AboutPage: React.FC = () => {
    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <Helmet>
                <title>Sobre NÃ³s | Aquimaq</title>
                <meta name="description" content="ConheÃ§a a Aquimaq â€” referÃªncia em ferramentas, peÃ§as e insumos para o agronegÃ³cio." />
            </Helmet>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <nav className="flex mb-8 text-sm text-gray-500 items-center gap-1">
                    <Link to={ROUTES.HOME} className="hover:text-agro-700 flex items-center gap-1">
                        <Home size={14} /> InÃ­cio
                    </Link>
                    <span>/</span>
                    <span className="font-semibold text-gray-900">Sobre NÃ³s</span>
                </nav>

                <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                    <div className="bg-agro-600 px-6 py-8 md:px-10 md:py-12 text-white">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                <Tractor size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Sobre a Aquimaq</h1>
                                <p className="mt-1 text-white/80">SoluÃ§Ãµes para o campo, na palma da mÃ£o.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-10 space-y-10">
                        {/* HistÃ³ria */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">Nossa HistÃ³ria</h2>
                            <div className="space-y-3 text-gray-700">
                                <p>
                                    A Aquimaq nasceu da necessidade real do produtor rural de ter acesso rÃ¡pido a ferramentas, peÃ§as e
                                    insumos de qualidade, sem precisar percorrer longas distÃ¢ncias atÃ© centros urbanos.
                                </p>
                                <p>
                                    Fundada com o propÃ³sito de digitalizar o abastecimento do campo, a Aquimaq conecta produtores,
                                    tÃ©cnicos e cooperativas aos melhores produtos do mercado agro â€” com entrega direta na propriedade.
                                </p>
                                <p>
                                    Hoje atendemos produtores em todo o Brasil, com um catÃ¡logo diversificado e atendimento especializado
                                    por profissionais que entendem o dia a dia do agronegÃ³cio.
                                </p>
                            </div>
                        </section>

                        {/* MissÃ£o e VisÃ£o */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-5 bg-agro-50 border border-agro-100 rounded-xl">
                                <h3 className="font-bold text-agro-800 mb-2">Nossa MissÃ£o</h3>
                                <p className="text-gray-700 text-sm">
                                    Facilitar o acesso do produtor rural a produtos, peÃ§as e equipamentos com qualidade, agilidade e preÃ§o justo.
                                </p>
                            </div>
                            <div className="p-5 bg-agro-50 border border-agro-100 rounded-xl">
                                <h3 className="font-bold text-agro-800 mb-2">Nossa VisÃ£o</h3>
                                <p className="text-gray-700 text-sm">
                                    Ser o principal marketplace de suprimentos agro do Brasil, reconhecido pela confianÃ§a e excelÃªncia no atendimento.
                                </p>
                            </div>
                        </section>

                        {/* Valores */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Nossos Valores</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {values.map(({ icon: Icon, title, description }) => (
                                    <div key={title} className="p-5 bg-gray-50 border border-gray-100 rounded-xl text-center">
                                        <div className="w-12 h-12 bg-agro-100 text-agro-700 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Icon size={22} />
                                        </div>
                                        <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                                        <p className="text-gray-600 text-sm">{description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AboutPage;
