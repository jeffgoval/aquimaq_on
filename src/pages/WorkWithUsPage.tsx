import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Briefcase, Mail, Star, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

const openings = [
    { role: 'Analista de E-commerce', area: 'Digital', type: 'CLT' },
    { role: 'Atendente de Suporte ao Cliente', area: 'Atendimento', type: 'CLT' },
    { role: 'Auxiliar de Logística', area: 'Operações', type: 'CLT' },
    { role: 'Representante Comercial Agro', area: 'Vendas', type: 'PJ' },
];

const WorkWithUsPage: React.FC = () => {
    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <Helmet>
                <title>Trabalhe Conosco | Aquimaq</title>
                <meta name="description" content="Faça parte da equipe Aquimaq. Veja as vagas disponíveis e envie seu currículo." />
            </Helmet>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <nav className="flex mb-8 text-sm text-gray-500 items-center gap-1">
                    <Link to={ROUTES.HOME} className="hover:text-agro-600 flex items-center gap-1">
                        <Home size={14} /> Início
                    </Link>
                    <span>/</span>
                    <span className="font-semibold text-gray-900">Trabalhe Conosco</span>
                </nav>

                <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                    <div className="bg-agro-600 px-6 py-8 md:px-10 md:py-12 text-white">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                <Briefcase size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Trabalhe Conosco</h1>
                                <p className="mt-1 text-white/80">Venha crescer com a gente no agronegócio.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-10 space-y-8">
                        {/* Chamada */}
                        <section>
                            <p className="text-gray-700">
                                A Aquimaq está sempre em busca de pessoas apaixonadas pelo agronegócio e pelo atendimento ao produtor rural.
                                Se você quer fazer parte de uma equipe dinâmica, com propósito e que valoriza o campo, envie seu currículo!
                            </p>
                        </section>

                        {/* Vagas abertas */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Star size={20} className="text-agro-600" /> Vagas em Aberto
                            </h2>
                            <div className="space-y-3">
                                {openings.map((opening, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl"
                                    >
                                        <div>
                                            <p className="font-semibold text-gray-900">{opening.role}</p>
                                            <p className="text-sm text-gray-500">{opening.area}</p>
                                        </div>
                                        <span className="text-xs font-bold px-3 py-1 bg-agro-100 text-agro-700 rounded-full">
                                            {opening.type}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Como se candidatar */}
                        <section className="p-5 bg-agro-50 border border-agro-100 rounded-xl">
                            <h2 className="text-lg font-bold text-agro-900 mb-2 flex items-center gap-2">
                                <Mail size={18} /> Como se candidatar
                            </h2>
                            <p className="text-gray-700 text-sm mb-3">
                                Envie seu currículo com o título da vaga de interesse no assunto para o e-mail abaixo.
                                Entraremos em contato em até 5 dias úteis.
                            </p>
                            <a
                                href="mailto:rh@aquimaq.com.br"
                                className="inline-block text-agro-700 font-bold hover:underline"
                            >
                                rh@aquimaq.com.br
                            </a>
                        </section>
                    </div>

                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
                        <span>Dúvidas sobre as vagas?</span>
                        <Link to={ROUTES.CONTACT} className="text-agro-600 font-semibold hover:underline">
                            Fale com nosso atendimento
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkWithUsPage;
