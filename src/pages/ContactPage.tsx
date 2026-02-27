import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Phone, Mail, MapPin, Clock, MessageCircle, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

const ContactPage: React.FC = () => {
    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <Helmet>
                <title>Fale Conosco | Aquimaq</title>
                <meta name="description" content="Entre em contato com a Aquimaq. Estamos prontos para atender você." />
            </Helmet>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <nav className="flex mb-8 text-sm text-gray-500 items-center gap-1">
                    <Link to={ROUTES.HOME} className="hover:text-agro-600 flex items-center gap-1">
                        <Home size={14} /> Início
                    </Link>
                    <span>/</span>
                    <span className="font-semibold text-gray-900">Fale Conosco</span>
                </nav>

                <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                    <div className="bg-agro-600 px-6 py-8 md:px-10 md:py-12 text-white">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                <MessageCircle size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Fale Conosco</h1>
                                <p className="mt-1 text-white/80">Estamos aqui para ajudar você.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="p-3 bg-green-100 text-green-700 rounded-full shrink-0">
                                    <MessageCircle size={22} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">WhatsApp</h3>
                                    <p className="text-gray-500 text-sm mb-2">Atendimento rápido pelo WhatsApp</p>
                                    <a
                                        href="https://wa.me/5500000000000"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-green-700 font-semibold hover:underline"
                                    >
                                        (00) 00000-0000
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="p-3 bg-blue-100 text-blue-700 rounded-full shrink-0">
                                    <Phone size={22} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Telefone</h3>
                                    <p className="text-gray-500 text-sm mb-2">Ligue para nossa central</p>
                                    <a href="tel:+5500000000000" className="text-blue-700 font-semibold hover:underline">
                                        (00) 0000-0000
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="p-3 bg-agro-100 text-agro-700 rounded-full shrink-0">
                                    <Mail size={22} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">E-mail</h3>
                                    <p className="text-gray-500 text-sm mb-2">Envie sua dúvida ou pedido</p>
                                    <a href="mailto:contato@aquimaq.com.br" className="text-agro-700 font-semibold hover:underline">
                                        contato@aquimaq.com.br
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="p-3 bg-orange-100 text-orange-700 rounded-full shrink-0">
                                    <Clock size={22} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Horário de Atendimento</h3>
                                    <p className="text-gray-700 text-sm">Segunda a Sexta: <span className="font-medium">8h às 18h</span></p>
                                    <p className="text-gray-700 text-sm">Sábado: <span className="font-medium">8h às 12h</span></p>
                                    <p className="text-gray-500 text-sm">Domingo: fechado</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-start gap-4 p-5 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="p-3 bg-red-100 text-red-700 rounded-full shrink-0">
                                <MapPin size={22} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Endereço</h3>
                                <p className="text-gray-600 text-sm">Rua Exemplo, 000 — Bairro, Cidade/UF — CEP 00000-000</p>
                                <p className="text-gray-500 text-sm mt-1">Retirada no balcão disponível nos horários de atendimento.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
