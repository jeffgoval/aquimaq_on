import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, MapPin, Clock, Home } from 'lucide-react';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useStore } from '@/contexts/StoreContext';
import { maskPhone } from '@/utils/masks';

const ContactPage: React.FC = () => {
    const { settings } = useStore();

    const phone = settings?.phone || '';
    const email = settings?.email || '';
    const openingHours = settings?.openingHours || '';
    const address = settings?.address;
    const storeName = settings?.storeName || 'Aquimaq';

    const addressLine = address && address.street
        ? [
            `${address.street}, ${address.number}${address.complement ? ` — ${address.complement}` : ''}`,
            `${address.district ? address.district + ', ' : ''}${address.city}/${address.state}`,
            address.zip ? `CEP ${address.zip.replace(/(\d{5})(\d{3})/, '$1-$2')}` : '',
          ].filter(Boolean).join(' — ')
        : null;

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <Helmet>
                <title>Fale Conosco | {storeName}</title>
                <meta name="description" content={`Entre em contato com a ${storeName}. Estamos prontos para atender você.`} />
            </Helmet>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <nav className="flex mb-8 text-sm text-gray-500 items-center gap-1">
                    <Link to={ROUTES.HOME} className="hover:text-agro-700 flex items-center gap-1">
                        <Home size={14} /> Início
                    </Link>
                    <span>/</span>
                    <span className="font-semibold text-gray-900">Fale Conosco</span>
                </nav>

                <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                    <div className="bg-agro-700 px-6 py-8 md:px-10 md:py-12 text-white">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                <WhatsAppIcon size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Fale Conosco</h1>
                                <p className="mt-1 text-white/80">Estamos aqui para ajudar você.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {phone && (
                                <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="p-3 bg-blue-100 text-blue-700 rounded-full shrink-0">
                                        <WhatsAppIcon size={22} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">WhatsApp</h3>
                                        <p className="text-gray-500 text-sm mb-2">Fale conosco pelo WhatsApp</p>
                                        <a href={`https://wa.me/55${phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-blue-700 font-semibold hover:underline">
                                            {maskPhone(phone)}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {email && (
                                <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="p-3 bg-agro-100 text-agro-700 rounded-full shrink-0">
                                        <Mail size={22} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">E-mail</h3>
                                        <p className="text-gray-500 text-sm mb-2">Envie sua dúvida ou pedido</p>
                                        <a href={`mailto:${email}`} className="text-agro-700 font-semibold hover:underline">
                                            {email}
                                        </a>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="p-3 bg-orange-100 text-orange-700 rounded-full shrink-0">
                                    <Clock size={22} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Horário de Atendimento</h3>
                                    {openingHours ? (
                                        <p className="text-gray-700 text-sm whitespace-pre-line">{openingHours}</p>
                                    ) : (
                                        <>
                                            <p className="text-gray-700 text-sm">Segunda a Sexta: <span className="font-medium">8h às 18h</span></p>
                                            <p className="text-gray-700 text-sm">Sábado: <span className="font-medium">8h às 12h</span></p>
                                            <p className="text-gray-500 text-sm">Domingo: fechado</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {addressLine && (
                            <div className="mt-6 flex items-start gap-4 p-5 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="p-3 bg-red-100 text-red-700 rounded-full shrink-0">
                                    <MapPin size={22} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Endereço</h3>
                                    <p className="text-gray-600 text-sm">{addressLine}</p>
                                    <p className="text-gray-500 text-sm mt-1">Retirada no balcão disponível nos horários de atendimento.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
