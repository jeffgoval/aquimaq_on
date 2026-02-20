import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, ShieldCheck, Phone, Mail, MapPin, Facebook, Instagram, Lock } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { ROUTES } from '@/constants/routes';
import { maskPhone } from '@/utils/masks';

const Footer: React.FC = () => {
    const { settings } = useStore();

    const formatCNPJ = (doc: string | null) => {
        if (!doc) return 'CNPJ não cadastrado';
        const cleaned = doc.replace(/\D/g, '');
        if (cleaned.length !== 14) return doc;
        return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    };

    const phone = settings?.phone ? maskPhone(settings.phone) : null;
    const city = settings?.address?.city ?? null;
    const state = settings?.address?.state ?? null;
    const cnpj = formatCNPJ(settings?.cnpj ?? null);

    return (
        <footer role="contentinfo" className="bg-gray-900 text-gray-300 pt-12 pb-20 md:pb-8 border-t border-gray-800 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Institucional */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Institucional</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to={ROUTES.ABOUT} className="hover:text-agro-400 transition-colors">Sobre Nós</Link></li>
                            <li><Link to={ROUTES.POLICY_DELIVERY} className="hover:text-agro-400 transition-colors">Política de Entrega</Link></li>
                            <li><Link to={ROUTES.POLICY_RETURNS} className="hover:text-agro-400 transition-colors">Trocas e Devoluções</Link></li>
                            <li><Link to={ROUTES.WORK_WITH_US} className="hover:text-agro-400 transition-colors">Trabalhe Conosco</Link></li>
                        </ul>
                    </div>

                    {/* Ajuda */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Ajuda</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to={ROUTES.PROFILE} className="hover:text-agro-400 transition-colors">Minha Conta</Link></li>
                            <li><Link to={ROUTES.ORDERS} className="hover:text-agro-400 transition-colors">Meus Pedidos</Link></li>
                            <li><Link to={ROUTES.WISHLIST} className="hover:text-agro-400 transition-colors">Meus Favoritos</Link></li>
                            <li><Link to={ROUTES.CONTACT} className="hover:text-agro-400 transition-colors">Fale Conosco</Link></li>
                            <li><Link to={ROUTES.FAQ} className="hover:text-agro-400 transition-colors">Perguntas Frequentes</Link></li>
                        </ul>
                    </div>

                    {/* Atendimento */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Atendimento</h3>
                        <ul className="space-y-3 text-sm">
                            {phone && (
                                <li className="flex items-center gap-2">
                                    <Phone size={16} className="text-agro-500" />
                                    <span>{phone}</span>
                                </li>
                            )}
                            <li className="flex items-center gap-2">
                                <Mail size={16} className="text-agro-500" />
                                <span>{settings?.email ?? 'sac@aquimaq.com.br'}</span>
                            </li>
                            {(city || state) && (
                                <li className="flex items-start gap-2">
                                    <MapPin size={16} className="text-agro-500 mt-1" />
                                    <span>{[city, state].filter(Boolean).join(' - ')}<br />Enviamos para todo Brasil</span>
                                </li>
                            )}
                        </ul>
                        <div className="flex gap-4 mt-4">
                            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Facebook size={24} /></a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Instagram size={24} /></a>
                        </div>
                    </div>

                    {/* Pagamento e Segurança */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Pagamento</h3>
                        <div className="flex flex-wrap gap-2 mb-6">
                            <div className="bg-white p-1 rounded w-12 h-8 flex items-center justify-center border border-gray-200"><span className="text-[10px] font-bold text-gray-800">PIX</span></div>
                            <div className="bg-white p-1 rounded w-12 h-8 flex items-center justify-center border border-gray-200"><span className="text-[10px] font-bold text-blue-800">VISA</span></div>
                            <div className="bg-white p-1 rounded w-12 h-8 flex items-center justify-center border border-gray-200"><span className="text-[10px] font-bold text-red-600">MASTER</span></div>
                            <div className="bg-white p-1 rounded w-12 h-8 flex items-center justify-center border border-gray-200"><span className="text-[10px] font-bold text-yellow-600">ELO</span></div>
                            <div className="bg-white p-1 rounded w-12 h-8 flex items-center justify-center border border-gray-200"><span className="text-[10px] font-bold text-gray-600">BOLETO</span></div>
                        </div>

                        <h3 className="text-white font-bold text-lg mb-4">Segurança</h3>
                        <div className="flex gap-3">
                            <div className="flex flex-col items-center bg-gray-800 px-3 py-2 rounded border border-gray-700 w-20">
                                <Lock size={20} className="text-green-500 mb-1" />
                                <span className="text-[10px] font-bold text-gray-300 text-center leading-tight">SSL<br />Seguro</span>
                            </div>
                            <div className="flex flex-col items-center bg-gray-800 px-3 py-2 rounded border border-gray-700 w-20">
                                <ShieldCheck size={20} className="text-green-500 mb-1" />
                                <span className="text-[10px] font-bold text-gray-300 text-center leading-tight">Compra<br />Protegida</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 text-center text-xs text-gray-500">
                    <p>&copy; {new Date().getFullYear()} Aquimaq. Todos os direitos reservados.</p>
                    {(cnpj !== 'CNPJ não cadastrado' || city || state) && (
                        <p className="mt-1">{[cnpj !== 'CNPJ não cadastrado' && cnpj, city, state].filter(Boolean).join(' | ')}</p>
                    )}
                </div>
            </div>
        </footer>
    );
};

export default Footer;

