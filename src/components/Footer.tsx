import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Facebook, Instagram, Youtube, Clock, HelpCircle, Package } from 'lucide-react';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { useStore } from '@/contexts/StoreContext';
import { ROUTES } from '@/constants/routes';
import { maskPhone } from '@/utils/masks';

// ─── SVG payment logos ────────────────────────────────────────────────────────

const VisaSVG: React.FC = () => (
    <svg viewBox="0 0 48 16" className="h-4 w-auto" aria-label="Visa">
        <text x="0" y="13" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="15" fill="#1A1F71" letterSpacing="-0.5">VISA</text>
    </svg>
);

const MastercardSVG: React.FC = () => (
    <svg viewBox="0 0 38 24" className="h-5 w-auto" aria-label="Mastercard">
        <circle cx="14" cy="12" r="10" fill="#EB001B" />
        <circle cx="24" cy="12" r="10" fill="#F79E1B" />
        <path d="M19 4.8a10 10 0 0 1 0 14.4A10 10 0 0 1 19 4.8z" fill="#FF5F00" />
    </svg>
);

const EloSVG: React.FC = () => (
    <svg viewBox="0 0 48 20" className="h-4 w-auto" aria-label="Elo">
        <text x="0" y="15" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="16" fill="#000">
            <tspan fill="#FFB800">E</tspan>
            <tspan fill="#000">lo</tspan>
        </text>
    </svg>
);

const PixSVG: React.FC = () => (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-label="Pix" fill="none">
        <path d="M24 4L4 24l20 20 20-20L24 4z" fill="#32BCAD" />
        <path d="M24 10l-14 14 14 14 14-14L24 10z" fill="#fff" />
        <path d="M24 16l-8 8 8 8 8-8-8-8z" fill="#32BCAD" />
    </svg>
);

const BoletoSVG: React.FC = () => (
    <svg viewBox="0 0 48 24" className="h-4 w-auto" aria-label="Boleto">
        {[0, 4, 8, 11, 15, 19, 22, 26, 30, 34, 38, 42].map((x, i) => (
            <rect key={i} x={x} y="2" width={i % 3 === 1 ? 2 : 3} height="20" fill="#333" rx="0.5" />
        ))}
    </svg>
);

const DebitCardSVG: React.FC = () => (
    <svg viewBox="0 0 32 22" className="h-4 w-auto" aria-label="Débito">
        <rect x="1" y="1" width="30" height="20" rx="3" fill="none" stroke="#555" strokeWidth="1.5" />
        <rect x="1" y="6" width="30" height="4" fill="#555" />
        <rect x="4" y="14" width="10" height="2" rx="1" fill="#999" />
    </svg>
);

// ─── Reclame Aqui badge ────────────────────────────────────────────────────────

const ReclameAquiBadge: React.FC<{ url: string }> = ({ url }) => (
    <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-[#E8232A] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
        aria-label="Reclame Aqui"
    >
        <svg viewBox="0 0 20 20" className="w-4 h-4 shrink-0" fill="currentColor" aria-hidden="true">
            <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm.75 12.5h-1.5v-1.5h1.5v1.5zm0-3h-1.5V5.5h1.5V11.5z" />
        </svg>
        Reclame Aqui
    </a>
);

// ─── Payment badge wrapper ─────────────────────────────────────────────────────

const PaymentBadge: React.FC<{ children: React.ReactNode; label?: string }> = ({ children, label }) => (
    <div
        className="bg-white rounded-md min-w-[64px] h-9 px-2.5 flex items-center justify-center border border-gray-200 gap-1.5"
        title={label}
    >
        {children}
    </div>
);

// ─── Section heading ───────────────────────────────────────────────────────────

const FooterHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="mb-5">
        <h3 className="font-display text-white text-base leading-tight">{children}</h3>
        <div className="mt-1.5 w-8 h-0.5 bg-agro-600 rounded-full" />
    </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

const Footer: React.FC = () => {
    const { settings } = useStore();

    const formatCNPJ = (doc: string | null) => {
        if (!doc) return null;
        const cleaned = doc.replace(/\D/g, '');
        if (cleaned.length !== 14) return doc;
        return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    };

    const formatCEP = (zip: string | null) => {
        if (!zip) return null;
        const cleaned = zip.replace(/\D/g, '');
        if (cleaned.length !== 8) return zip;
        return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
    };

    const phone = settings?.phone ? maskPhone(settings.phone) : null;
    const phoneRaw = settings?.phone?.replace(/\D/g, '') ?? null;
    const email = settings?.email ?? null;
    const cnpj = formatCNPJ(settings?.cnpj ?? null);
    const razaoSocial = settings?.razaoSocial || null;
    const storeName = settings?.storeName || 'Aquimaq';
    const openingHours = settings?.openingHours || null;
    const reclameAquiUrl = settings?.reclameAquiUrl || null;

    const addr = settings?.address;
    const hasFullAddress = addr?.street && addr?.city;
    const addrLine1 = hasFullAddress
        ? [addr!.street, addr!.number].filter(Boolean).join(', ')
        : null;
    const addrLine2 = hasFullAddress
        ? [addr!.district, addr!.city, addr!.state].filter(Boolean).join(', ')
        : addr?.city
            ? [addr.city, addr.state].filter(Boolean).join(' - ')
            : null;
    const addrCEP = formatCEP(addr?.zip ?? null);

    const facebookUrl = settings?.socialMedia?.facebook || null;
    const instagramUrl = settings?.socialMedia?.instagram || null;
    const youtubeUrl = settings?.socialMedia?.youtube || null;

    const acceptedPaymentTypes = settings?.acceptedPaymentTypes ?? ['credit_card', 'debit_card', 'bank_transfer', 'ticket'];
    const maxInstallments = settings?.maxInstallments ?? 12;

    return (
        <footer role="contentinfo" className="bg-forest-900 grain-overlay text-agro-200 pt-12 pb-20 md:pb-8 font-sans">
            {/* Accent stripe */}
            <div className="h-0.5 bg-gradient-to-r from-transparent via-agro-600 to-transparent mb-12 -mt-12 opacity-60" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Main grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

                    {/* Coluna 1 — Institucional */}
                    <div>
                        <FooterHeading>Institucional</FooterHeading>
                        <ul className="space-y-2.5 text-sm">
                            <li><Link to={ROUTES.ABOUT} className="hover:text-white transition-colors">Sobre Nós</Link></li>
                            <li><Link to={ROUTES.POLICY_DELIVERY} className="hover:text-white transition-colors">Política de Entrega</Link></li>
                            <li><Link to={ROUTES.POLICY_RETURNS} className="hover:text-white transition-colors">Trocas e Devoluções</Link></li>
                            <li><Link to={ROUTES.POLICY_PRIVACY} className="hover:text-white transition-colors">Política de Privacidade</Link></li>
                        </ul>
                    </div>

                    {/* Coluna 2 — Ajuda */}
                    <div>
                        <FooterHeading>Ajuda</FooterHeading>
                        <ul className="space-y-2.5 text-sm">
                            <li>
                                <Link to={ROUTES.FAQ} className="hover:text-white transition-colors flex items-center gap-1.5">
                                    <HelpCircle size={13} className="text-agro-400 shrink-0" />
                                    Perguntas Frequentes
                                </Link>
                            </li>
                            <li>
                                <Link to={ROUTES.ORDERS} className="hover:text-white transition-colors flex items-center gap-1.5">
                                    <Package size={13} className="text-agro-400 shrink-0" />
                                    Rastrear Pedido
                                </Link>
                            </li>
                            <li><Link to={ROUTES.CONTACT} className="hover:text-white transition-colors">Fale Conosco</Link></li>
                        </ul>
                    </div>

                    {/* Coluna 3 — Atendimento */}
                    <div>
                        <FooterHeading>Atendimento</FooterHeading>
                        <ul className="space-y-3 text-sm">
                            {phone && phoneRaw && (
                                <li>
                                    <a href={`https://wa.me/55${phoneRaw}`} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-2 hover:text-white transition-colors">
                                        <WhatsAppIcon size={15} className="text-agro-400 shrink-0" />
                                        {phone}
                                    </a>
                                </li>
                            )}
                            {email && (
                                <li>
                                    <a href={`mailto:${email}`}
                                        className="flex items-center gap-2 hover:text-white transition-colors break-all">
                                        <Mail size={15} className="text-agro-400 shrink-0" />
                                        {email}
                                    </a>
                                </li>
                            )}
                            {openingHours && (
                                <li className="flex items-start gap-2">
                                    <Clock size={15} className="text-agro-400 mt-0.5 shrink-0" />
                                    <span className="leading-snug">{openingHours}</span>
                                </li>
                            )}
                            {addrLine2 && (
                                <li className="flex items-start gap-2">
                                    <MapPin size={15} className="text-agro-400 mt-0.5 shrink-0" />
                                    <span className="leading-snug">
                                        {addrLine1 && <>{addrLine1}<br /></>}
                                        {addrLine2}
                                        {addrCEP && <><br />CEP {addrCEP}</>}
                                        <br /><span className="text-agro-300/60 text-xs">Enviamos para todo o Brasil</span>
                                    </span>
                                </li>
                            )}
                        </ul>

                        {/* Redes sociais */}
                        {(facebookUrl || instagramUrl || youtubeUrl) && (
                            <div className="flex gap-2 mt-5">
                                {facebookUrl && (
                                    <a href={facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-forest-800 hover:bg-agro-700 text-agro-300 hover:text-white transition-all">
                                        <Facebook size={18} />
                                    </a>
                                )}
                                {instagramUrl && (
                                    <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-forest-800 hover:bg-agro-700 text-agro-300 hover:text-white transition-all">
                                        <Instagram size={18} />
                                    </a>
                                )}
                                {youtubeUrl && (
                                    <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-forest-800 hover:bg-agro-700 text-agro-300 hover:text-white transition-all">
                                        <Youtube size={18} />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Coluna 4 — Pagamento & Segurança */}
                    <div>
                        <FooterHeading>Pagamento</FooterHeading>

                        <div className="flex flex-wrap gap-2 mb-2">
                            {acceptedPaymentTypes.includes('credit_card') && <>
                                <PaymentBadge label="Visa Crédito"><VisaSVG /></PaymentBadge>
                                <PaymentBadge label="Mastercard Crédito"><MastercardSVG /></PaymentBadge>
                                <PaymentBadge label="Elo Crédito"><EloSVG /></PaymentBadge>
                            </>}
                            {acceptedPaymentTypes.includes('debit_card') && (
                                <PaymentBadge label="Cartão de Débito">
                                    <DebitCardSVG />
                                    <span className="text-[10px] text-gray-500 font-semibold">Débito</span>
                                </PaymentBadge>
                            )}
                            {acceptedPaymentTypes.includes('bank_transfer') && (
                                <PaymentBadge label="Pix">
                                    <PixSVG />
                                    <span className="text-[10px] font-bold text-[#32BCAD]">Pix</span>
                                </PaymentBadge>
                            )}
                            {acceptedPaymentTypes.includes('ticket') && (
                                <PaymentBadge label="Boleto Bancário">
                                    <BoletoSVG />
                                </PaymentBadge>
                            )}
                        </div>

                        {maxInstallments > 1 && (
                            <p className="text-xs text-agro-300/80 mb-4">
                                Parcele em até <span className="text-white font-semibold">{maxInstallments}x</span> no cartão de crédito
                            </p>
                        )}

                        {/* Confiança */}
                        <div className="space-y-2 mt-4">
                            <div className="flex items-center gap-2 text-xs text-agro-200/80">
                                <svg className="w-4 h-4 text-agro-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                Pagamento 100% seguro (SSL)
                            </div>
                            <div className="flex items-center gap-2 text-xs text-agro-200/80">
                                <svg className="w-4 h-4 text-agro-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Compra protegida pelo Mercado Pago
                            </div>
                            {reclameAquiUrl && (
                                <div className="pt-1">
                                    <ReclameAquiBadge url={reclameAquiUrl} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-forest-800 pt-6 text-center text-xs text-agro-300/50 space-y-1">
                    {razaoSocial && (
                        <p className="text-agro-300/70 font-medium">{razaoSocial}</p>
                    )}
                    <p>
                        &copy; {new Date().getFullYear()} {storeName}. Todos os direitos reservados.
                    </p>
                    {(cnpj || addrLine2) && (
                        <p>
                            {[cnpj, addrLine2, addrCEP ? `CEP ${addrCEP}` : null].filter(Boolean).join(' · ')}
                        </p>
                    )}
                </div>
            </div>
        </footer>
    );
};

export default Footer;
