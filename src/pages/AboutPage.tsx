import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Home, Leaf, Users, ShieldCheck, Tractor } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

const values = [
    {
        icon: ShieldCheck,
        title: 'Qualidade',
        description: 'Trabalhamos apenas com marcas e fornecedores homologados, garantindo produtos duráveis e eficientes para o campo.',
    },
    {
        icon: Users,
        title: 'Atendimento',
        description: 'Nossa equipe conhece as necessidades do produtor rural. Estamos aqui para orientar e agilizar sua operação.',
    },
    {
        icon: Leaf,
        title: 'Sustentabilidade',
        description: 'Valorizamos práticas responsáveis e buscamos soluções que respeitem o meio ambiente e o futuro do agronegócio.',
    },
];

const AboutPage: React.FC = () => {
    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <Helmet>
                <title>Sobre Nós | Aquimaq</title>
                <meta name="description" content="Conheça a Aquimaq — referência em ferramentas, peças e insumos para o agronegócio." />
            </Helmet>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <nav className="flex mb-8 text-sm text-gray-500 items-center gap-1">
                    <Link to={ROUTES.HOME} className="hover:text-agro-600 flex items-center gap-1">
                        <Home size={14} /> Início
                    </Link>
                    <span>/</span>
                    <span className="font-semibold text-gray-900">Sobre Nós</span>
                </nav>

                <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                    <div className="bg-agro-600 px-6 py-8 md:px-10 md:py-12 text-white">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                <Tractor size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Sobre a Aquimaq</h1>
                                <p className="mt-1 text-white/80">Soluções para o campo, na palma da mão.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-10 space-y-10">
                        {/* História */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">Nossa História</h2>
                            <div className="space-y-3 text-gray-700">
                                <p>
                                    A Aquimaq nasceu da necessidade real do produtor rural de ter acesso rápido a ferramentas, peças e
                                    insumos de qualidade, sem precisar percorrer longas distâncias até centros urbanos.
                                </p>
                                <p>
                                    Fundada com o propósito de digitalizar o abastecimento do campo, a Aquimaq conecta produtores,
                                    técnicos e cooperativas aos melhores produtos do mercado agro — com entrega direta na propriedade.
                                </p>
                                <p>
                                    Hoje atendemos produtores em todo o Brasil, com um catálogo diversificado e atendimento especializado
                                    por profissionais que entendem o dia a dia do agronegócio.
                                </p>
                            </div>
                        </section>

                        {/* Missão e Visão */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-5 bg-agro-50 border border-agro-100 rounded-xl">
                                <h3 className="font-bold text-agro-800 mb-2">Nossa Missão</h3>
                                <p className="text-gray-700 text-sm">
                                    Facilitar o acesso do produtor rural a produtos, peças e equipamentos com qualidade, agilidade e preço justo.
                                </p>
                            </div>
                            <div className="p-5 bg-agro-50 border border-agro-100 rounded-xl">
                                <h3 className="font-bold text-agro-800 mb-2">Nossa Visão</h3>
                                <p className="text-gray-700 text-sm">
                                    Ser o principal marketplace de suprimentos agro do Brasil, reconhecido pela confiança e excelência no atendimento.
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

                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
                        <span>Quer fazer parte da nossa equipe?</span>
                        <Link to={ROUTES.WORK_WITH_US} className="text-agro-600 font-semibold hover:underline">
                            Trabalhe Conosco
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
