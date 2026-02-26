import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, ShieldCheck, Phone, Mail, MapPin, Facebook, Instagram, Lock, MessageCircle } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { ROUTES } from '@/constants/routes';
import { maskPhone } from '@/utils/masks';

const Footer: React.FC = () => {
    const { settings } = useStore();

    const formatCNPJ = (doc: string | null) => {
        if (!doc) return null;
        const cleaned = doc.replace(/\D/g, '');
        if (cleaned.length !== 14) return doc;
        return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    };

    const phone = settings?.phone ? maskPhone(settings.phone) : null;
    const phoneRaw = settings?.phone?.replace(/\D/g, '') ?? null;
    const email = settings?.email ?? null;
    const city = settings?.address?.city ?? null;
    const state = settings?.address?.state ?? null;
    const cnpj = formatCNPJ(settings?.cnpj ?? null);
    const storeName = settings?.storeName || 'Aquimaq';

    const whatsappNumber = (settings?.whatsapp || settings?.phone || '').replace(/\D/g, '');
    const whatsappHref = whatsappNumber
        ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Olá, preciso de ajuda!')}`
        : null;

    const facebookUrl = settings?.socialMedia?.facebook || null;
    const instagramUrl = settings?.socialMedia?.instagram || null;

    return (
        <footer role="contentinfo" className="bg-gray-900 text-gray-300 pt-12 pb-20 md:pb-8 border-t border-gray-800 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

                    {/* Institucional */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Institucional</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to={ROUTES.POLICY_DELIVERY} className="hover:text-agro-400 transition-colors">Política de Entrega</Link></li>
                            <li><Link to={ROUTES.POLICY_RETURNS} className="hover:text-agro-400 transition-colors">Trocas e Devoluções</Link></li>
                            <li><Link to={ROUTES.POLICY_PRIVACY} className="hover:text-agro-400 transition-colors">Política de Privacidade</Link></li>
                        </ul>
                    </div>

                    {/* Ajuda */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Ajuda</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to={ROUTES.ACCOUNT} className="hover:text-agro-400 transition-colors">Minha Conta</Link></li>
                            <li><Link to={ROUTES.WISHLIST} className="hover:text-agro-400 transition-colors">Meus Favoritos</Link></li>
                            <li><Link to={ROUTES.CART} className="hover:text-agro-400 transition-colors">Meu Carrinho</Link></li>
                            {whatsappHref && (
                                <li>
                                    <a
                                        href={whatsappHref}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-agro-400 transition-colors inline-flex items-center gap-1.5"
                                    >
                                        <MessageCircle size={13} />
                                        Fale Conosco
                                    </a>
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Atendimento */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Atendimento</h3>
                        <ul className="space-y-3 text-sm">
                            {phone && phoneRaw && (
                                <li>
                                    <a
                                        href={`tel:${phoneRaw}`}
                                        className="flex items-center gap-2 hover:text-white transition-colors"
                                    >
                                        <Phone size={16} className="text-agro-500 shrink-0" />
                                        {phone}
                                    </a>
                                </li>
                            )}
                            {email && (
                                <li>
                                    <a
                                        href={`mailto:${email}`}
                                        className="flex items-center gap-2 hover:text-white transition-colors break-all"
                                    >
                                        <Mail size={16} className="text-agro-500 shrink-0" />
                                        {email}
                                    </a>
                                </li>
                            )}
                            {(city || state) && (
                                <li className="flex items-start gap-2">
                                    <MapPin size={16} className="text-agro-500 mt-0.5 shrink-0" />
                                    <span>{[city, state].filter(Boolean).join(' - ')}<br />Enviamos para todo Brasil</span>
                                </li>
                            )}
                        </ul>

                        {/* Redes sociais */}
                        {(facebookUrl || instagramUrl) && (
                            <div className="flex gap-4 mt-5">
                                {facebookUrl && (
                                    <a
                                        href={facebookUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Facebook"
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        <Facebook size={24} />
                                    </a>
                                )}
                                {instagramUrl && (
                                    <a
                                        href={instagramUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Instagram"
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        <Instagram size={24} />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Pagamento & Segurança */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-3">Pagamento</h3>
                        <div className="flex flex-wrap gap-2 mb-5">
                            {[
                                { label: 'PIX',    color: 'text-gray-800' },
                                { label: 'VISA',   color: 'text-blue-800' },
                                { label: 'MC',     color: 'text-red-600' },
                                { label: 'ELO',    color: 'text-yellow-600' },
                                { label: 'BOLETO', color: 'text-gray-600' },
                            ].map(({ label, color }) => (
                                <div
                                    key={label}
                                    className="bg-white rounded w-12 h-8 flex items-center justify-center border border-gray-200"
                                >
                                    <span className={`text-[10px] font-bold ${color}`}>{label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-gray-800 pt-4">
                            <h3 className="text-white font-bold text-sm mb-3">Segurança</h3>
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
                </div>

                {/* Bottom bar */}
                <div className="border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
                    <p>&copy; {new Date().getFullYear()} {storeName}. Todos os direitos reservados.</p>
                    {(cnpj || city || state) && (
                        <p className="mt-1">{[cnpj, city, state].filter(Boolean).join(' | ')}</p>
                    )}
                </div>
            </div>
        </footer>
    );
};

export default Footer;
