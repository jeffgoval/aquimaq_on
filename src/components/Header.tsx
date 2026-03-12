import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, Store, Search, LogIn, LogOut, ChevronDown, Heart, LayoutDashboard, User, Package } from 'lucide-react';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { ProductCategory } from '@/types';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { maskPhone } from '@/utils/masks';
import MegaMenu from './MegaMenu';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { ROUTES } from '@/constants/routes';
import type { NavigationMenuItem } from '@/types/store';

const getAvatarInitials = (user: SupabaseUser): string => {
    const name = (user.user_metadata?.full_name ?? user.user_metadata?.name) as string | undefined;
    if (name && name.trim()) {
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return name.slice(0, 2).toUpperCase();
    }
    const email = user.email ?? '';
    const local = email.split('@')[0] || '?';
    return local.slice(0, 2).toUpperCase() || '?';
};

/** Fallback quando navigation_menu está vazio ou não configurado. */
const FALLBACK_NAV: NavigationMenuItem[] = [
    { label: 'Nutrição Animal', slug: ROUTES.HOME, category_value: ProductCategory.NUTRITION, enabled: true },
    { label: 'Defensivos Agrícolas', slug: ROUTES.HOME, category_value: ProductCategory.DEFENSIVES, enabled: true },
    { label: 'Sementes', slug: ROUTES.HOME, category_value: ProductCategory.SEEDS, enabled: true },
    { label: 'Equipamentos', slug: ROUTES.HOME, category_value: ProductCategory.EQUIPMENT, enabled: true },
    { label: 'Peças de Reposição', slug: ROUTES.HOME, category_value: ProductCategory.PARTS, enabled: true },
    { label: 'EPI e Segurança', slug: ROUTES.HOME, category_value: ProductCategory.PPE, enabled: true },
];

interface HeaderProps {
    cartItemCount: number;
    onCategoryReset?: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedCategory?: ProductCategory | 'ALL';
    onCategoryChange?: (category: ProductCategory | 'ALL') => void;
}

const Header: React.FC<HeaderProps> = ({
    cartItemCount,
    onCategoryReset,
    searchQuery,
    onSearchChange,
    selectedCategory,
    onCategoryChange
}) => {
    const { settings } = useStore();
    const { user, loading: authLoading, signOut, isAdmin, isGerente, hasRole } = useAuth();
    const isVendedor = hasRole(['vendedor']);
    const isStaff = isAdmin || isGerente || isVendedor;
    const navigate = useNavigate();
    const location = useLocation();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const mobileSearchInputRef = useRef<HTMLInputElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const navItems = useMemo(() => {
        const raw = settings?.navigationMenu?.length
            ? settings.navigationMenu.filter((item) => item.enabled !== false)
            : FALLBACK_NAV;
        return raw.length > 0 ? raw : FALLBACK_NAV;
    }, [settings?.navigationMenu]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        if (isUserMenuOpen) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isUserMenuOpen]);

    // Focus Traps
    const mobileMenuRef = useFocusTrap(isMobileMenuOpen, () => setIsMobileMenuOpen(false));
    const searchModalRef = useFocusTrap(isSearchOpen, () => setIsSearchOpen(false));

    // Auto-focus mobile search input
    useEffect(() => {
        if (isSearchOpen && mobileSearchInputRef.current) {
            mobileSearchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    // Bloquear scroll do body quando o menu mobile está aberto (evita scroll da página atrás)
    useEffect(() => {
        if (isMobileMenuOpen) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = prev; };
        }
    }, [isMobileMenuOpen]);

    const handleLogoClick = () => {
        if (onCategoryReset) onCategoryReset();
        if (onSearchChange) onSearchChange('');
        navigate(ROUTES.HOME);
        setIsMobileMenuOpen(false);
    };

    const handleCategoryClick = (category: ProductCategory | 'ALL') => {
        if (onCategoryChange) {
            onCategoryChange(category);
            navigate(ROUTES.HOME);
        }
        setIsMobileMenuOpen(false);
    };

    const isInternalSlug = (slug: string) => slug.startsWith('/') && !slug.startsWith('//');
    const handleNavItemClick = (item: NavigationMenuItem) => {
        if (item.category_value && onCategoryChange) {
            onCategoryChange(item.category_value as ProductCategory);
            navigate(ROUTES.HOME);
        } else if (isInternalSlug(item.slug)) {
            navigate(item.slug);
        }
        setIsMobileMenuOpen(false);
    };

    const isActive = (path: string) => location.pathname === path;
    const isHomeActive = selectedCategory === 'ALL' && location.pathname === ROUTES.HOME && !searchQuery;

    return (
        <header role="banner" className="flex flex-col w-full shadow-md sticky top-0 z-50 font-sans">
            {/* 1. TOP BAR */}
            <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 hidden md:block border-b border-slate-800">
                <div className="max-w-7xl mx-auto flex justify-end items-center">
                    <div className="flex space-x-6">
                        {(settings?.whatsapp ?? settings?.phone) ? (
                            <a
                                href={`https://wa.me/55${(settings.whatsapp || settings.phone || '').replace(/\D/g, '')}`}
                                target="_blank" rel="noopener noreferrer"
                                className="flex items-center hover:text-white transition-colors"
                            >
                                <WhatsAppIcon size={14} className="mr-2 text-agro-500 shrink-0" />
                                Central de Vendas: {maskPhone(settings.whatsapp || settings.phone || '')}
                            </a>
                        ) : (
                            <span className="flex items-center">
                                <WhatsAppIcon size={14} className="mr-2 text-agro-500 shrink-0" />
                                Central de Vendas: (00) 00000-0000
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. MAIN HEADER */}
            <div className="bg-white py-4 md:py-5 relative z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between gap-4 md:gap-8">
                        <button
                            className="p-2 -ml-2 text-slate-600 md:hidden hover:bg-slate-100 rounded-lg"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        <div className="flex items-center cursor-pointer group shrink-0" onClick={handleLogoClick}>
                            {settings?.logoUrl ? (
                                <img src={settings.logoUrl} alt="Logo" className="w-10 h-10 md:w-14 md:h-14 object-contain mr-2 md:mr-3 rounded-xl" />
                            ) : (
                                <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-agro-500 to-agro-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg mr-2 md:mr-3">A</div>
                            )}
                            <span className="text-xl md:text-2xl font-bold text-slate-900">{settings?.storeName || 'Aquimaq'}</span>
                        </div>

                        <div className="hidden md:flex flex-1 max-w-2xl mx-auto relative">
                            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                className="w-full bg-slate-50 rounded-full pl-11 pr-4 py-3 border-2 border-transparent focus:border-agro-500 focus:bg-white focus:outline-none transition-all"
                                placeholder="Buscar por produto, marca ou cultura..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-1">
                            {/* Mobile: search icon */}
                            <button className="p-2 text-slate-500 md:hidden" onClick={() => setIsSearchOpen(true)} aria-label="Buscar">
                                <Search size={22} />
                            </button>

                            {/* User area */}
                            {!authLoading && (
                                user ? (
                                    <div className="hidden md:block relative" ref={userMenuRef}>
                                        <button
                                            type="button"
                                            onClick={() => setIsUserMenuOpen((v) => !v)}
                                            className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-agro-500/30"
                                            aria-expanded={isUserMenuOpen}
                                            aria-haspopup="true"
                                            title={user.email ?? undefined}
                                        >
                                            {user.user_metadata?.avatar_url ? (
                                                <img
                                                    src={user.user_metadata.avatar_url}
                                                    alt=""
                                                    className="w-9 h-9 rounded-full object-cover"
                                                />
                                            ) : (
                                                <span className="w-9 h-9 rounded-full bg-agro-600 text-white text-sm font-medium flex items-center justify-center">
                                                    {getAvatarInitials(user)}
                                                </span>
                                            )}
                                            <ChevronDown size={18} className={`text-slate-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isUserMenuOpen && (
                                            <div
                                                className="absolute right-0 top-full mt-1 w-52 py-1 bg-white border border-slate-200 rounded-xl shadow-lg z-[60]"
                                                role="menu"
                                            >
                                                <div className="px-3 py-2 border-b border-slate-100">
                                                    <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
                                                    <p className="text-xs text-slate-500">{isAdmin ? 'Administrador' : isGerente ? 'Gerente' : isVendedor ? 'Vendedor' : 'Cliente'}</p>
                                                </div>
                                                {isStaff ? (
                                                    <>
                                                        <Link
                                                            to={ROUTES.ADMIN}
                                                            onClick={() => { setIsUserMenuOpen(false); }}
                                                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium"
                                                            role="menuitem"
                                                        >
                                                            <LayoutDashboard size={16} />
                                                            {isVendedor ? 'Meu Painel' : isGerente ? 'Painel Gerente' : 'Painel Admin'}
                                                        </Link>
                                                        <div className="border-t border-slate-100 my-1" />
                                                        <button
                                                            type="button"
                                                            onClick={() => { signOut(); setIsUserMenuOpen(false); }}
                                                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                                            role="menuitem"
                                                        >
                                                            <LogOut size={16} />
                                                            Sair
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Link
                                                            to={ROUTES.ACCOUNT}
                                                            onClick={() => setIsUserMenuOpen(false)}
                                                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                                            role="menuitem"
                                                        >
                                                            <User size={16} />
                                                            Minha conta
                                                        </Link>
                                                        <Link
                                                            to={ROUTES.ORDERS}
                                                            onClick={() => setIsUserMenuOpen(false)}
                                                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                                            role="menuitem"
                                                        >
                                                            <Package size={16} />
                                                            Meus pedidos
                                                        </Link>
                                                        <Link
                                                            to={ROUTES.WISHLIST}
                                                            onClick={() => setIsUserMenuOpen(false)}
                                                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                                            role="menuitem"
                                                        >
                                                            <Heart size={16} />
                                                            Favoritos
                                                        </Link>
                                                        <Link
                                                            to={ROUTES.CART}
                                                            onClick={() => setIsUserMenuOpen(false)}
                                                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                                            role="menuitem"
                                                        >
                                                            <ShoppingCart size={16} />
                                                            Carrinho
                                                        </Link>
                                                        <div className="border-t border-slate-100 my-1" />
                                                        <button
                                                            type="button"
                                                            onClick={() => { signOut(); setIsUserMenuOpen(false); }}
                                                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                                            role="menuitem"
                                                        >
                                                            <LogOut size={16} />
                                                            Sair
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Link
                                        to={ROUTES.LOGIN}
                                        className={`hidden md:flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${isActive(ROUTES.LOGIN) ? 'text-agro-700 bg-agro-50' : 'text-slate-600 hover:bg-agro-50 hover:text-agro-700'}`}
                                    >
                                        <LogIn size={17} />
                                        Entrar
                                    </Link>
                                )
                            )}

                            {/* Wishlist e Carrinho: ocultos para staff (não fazem compras na loja) */}
                            {!isStaff && (
                                <>
                                    <Link
                                        to={ROUTES.WISHLIST}
                                        className={`hidden md:flex p-2 hover:bg-agro-50 rounded-full transition-all ${isActive(ROUTES.WISHLIST) ? 'text-red-500 bg-red-50' : 'text-slate-500 hover:text-red-400'}`}
                                        aria-label="Favoritos"
                                    >
                                        <Heart size={21} className={isActive(ROUTES.WISHLIST) ? 'fill-red-500' : ''} />
                                    </Link>
                                    <Link
                                        to={ROUTES.CART}
                                        className={`p-2 hover:bg-agro-50 rounded-full relative transition-all ${isActive(ROUTES.CART) ? 'text-agro-700 bg-agro-50' : 'text-slate-600'}`}
                                        aria-label="Carrinho"
                                    >
                                        <ShoppingCart size={22} />
                                        {cartItemCount > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center text-[10px] font-bold text-white bg-red-600 rounded-full shadow-sm ring-2 ring-white">
                                                {cartItemCount}
                                            </span>
                                        )}
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. CATEGORY NAVIGATION - overflow-visible para o MegaMenu dropdown não ser cortado */}
            <div className="hidden md:block bg-slate-900 text-white shadow-inner overflow-visible">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
                    <nav className="flex items-center space-x-1 text-sm font-medium h-11 overflow-visible">
                        {/* Home */}
                        <button
                            onClick={() => handleLogoClick()}
                            className={`flex items-center px-4 h-full border-b-2 transition-colors ${isHomeActive
                                ? 'border-agro-500 text-white'
                                : 'border-transparent text-slate-300 hover:text-white'
                            }`}
                        >
                            <Store size={16} className="mr-1.5" />
                            Início
                        </button>

                        {/* Mega Menu — shrink-0 para não roubar espaço às categorias */}
                        <div className="shrink-0">
                            <MegaMenu onCategoryClick={(c) => handleCategoryClick(c as ProductCategory)} />
                        </div>

                        {/* Categorias: flex-1 min-w-0 para não encolher a zero; overflow-x-auto para scroll se precisar */}
                        <div className="flex flex-1 min-w-0 h-full items-center space-x-0.5 overflow-x-auto overflow-y-hidden">
                            {navItems.map((item, idx) => {
                                const isCategory = Boolean(item.category_value);
                                const active = isCategory
                                    ? selectedCategory === item.category_value
                                    : isInternalSlug(item.slug) && isActive(item.slug);
                                const baseClass = `px-3 h-full flex items-center border-b-2 transition-colors whitespace-nowrap text-xs ${active ? 'border-agro-500 text-white' : 'border-transparent text-slate-300 hover:text-white'} ${item.is_highlighted ? 'font-semibold' : ''}`;
                                if (!isCategory && !isInternalSlug(item.slug)) {
                                    return (
                                        <a
                                            key={`${item.slug}-${idx}`}
                                            href={item.slug}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={baseClass}
                                        >
                                            {item.label}
                                        </a>
                                    );
                                }
                                return (
                                    <button
                                        key={`${item.slug}-${idx}`}
                                        type="button"
                                        onClick={() => handleNavItemClick(item)}
                                        className={baseClass}
                                    >
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    </nav>
                </div>
            </div>

            {/* MOBILE MENU */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
                    <div ref={mobileMenuRef} className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col pl-[env(safe-area-inset-left)] pb-[env(safe-area-inset-bottom)]" onClick={e => e.stopPropagation()}>
                        <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <span className="text-lg font-bold">Menu</span>
                            <button type="button" onClick={() => setIsMobileMenuOpen(false)} aria-label="Fechar menu" className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 rounded-lg hover:bg-white/10 active:bg-white/20"><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 overscroll-contain">
                            {!authLoading && (
                                user ? (
                                    <div className="px-4 py-3 border-b border-slate-100">
                                        <div className="flex items-center gap-3 mb-3">
                                            {user.user_metadata?.avatar_url ? (
                                                <img src={user.user_metadata.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                                            ) : (
                                                <span className="w-12 h-12 rounded-full bg-agro-600 text-white text-base font-medium flex items-center justify-center">
                                                    {getAvatarInitials(user)}
                                                </span>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-slate-900 text-sm font-medium truncate">{user.email}</p>
                                                <p className="text-slate-500 text-xs">{isAdmin ? 'Administrador' : isGerente ? 'Gerente' : isVendedor ? 'Vendedor' : 'Cliente'}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            {isStaff ? (
                                                <>
                                                    <Link
                                                        to={ROUTES.ADMIN}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                        className="flex items-center gap-2 px-3 py-2.5 text-slate-700 hover:bg-slate-50 rounded-lg font-medium"
                                                    >
                                                        <LayoutDashboard size={18} />
                                                        {isVendedor ? 'Meu Painel' : isGerente ? 'Painel Gerente' : 'Painel Admin'}
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                                                        className="flex items-center gap-2 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg text-left"
                                                    >
                                                        <LogOut size={18} />
                                                        Sair
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <Link
                                                        to={ROUTES.ACCOUNT}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                        className="flex items-center gap-2 px-3 py-2.5 text-slate-700 hover:bg-slate-50 rounded-lg"
                                                    >
                                                        <User size={18} />
                                                        Minha conta
                                                    </Link>
                                                    <Link
                                                        to={ROUTES.ORDERS}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                        className="flex items-center gap-2 px-3 py-2.5 text-slate-700 hover:bg-slate-50 rounded-lg"
                                                    >
                                                        <Package size={18} />
                                                        Meus pedidos
                                                    </Link>
                                                    <Link
                                                        to={ROUTES.WISHLIST}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                        className="flex items-center gap-2 px-3 py-2.5 text-slate-700 hover:bg-slate-50 rounded-lg"
                                                    >
                                                        <Heart size={18} />
                                                        Favoritos
                                                    </Link>
                                                    <Link
                                                        to={ROUTES.CART}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                        className="flex items-center gap-2 px-3 py-2.5 text-slate-700 hover:bg-slate-50 rounded-lg"
                                                    >
                                                        <ShoppingCart size={18} />
                                                        Carrinho
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                                                        className="flex items-center gap-2 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg text-left"
                                                    >
                                                        <LogOut size={18} />
                                                        Sair
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <Link
                                        to={ROUTES.LOGIN}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-2 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg font-medium"
                                    >
                                        <LogIn size={18} />
                                        Entrar na sua conta
                                    </Link>
                                )
                            )}
                            {navItems.length > 0 && (
                                <>
                                    <p className="px-4 pt-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Categorias</p>
                                    {navItems.map((item, idx) => {
                                const isCategory = Boolean(item.category_value);
                                const active = isCategory && selectedCategory === item.category_value;
                                if (!isCategory && !isInternalSlug(item.slug)) {
                                    return (
                                        <a
                                            key={`mobile-${item.slug}-${idx}`}
                                            href={item.slug}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full text-left px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            {item.label}
                                        </a>
                                    );
                                }
                                return (
                                    <button
                                        key={`mobile-${item.slug}-${idx}`}
                                        type="button"
                                        onClick={() => handleNavItemClick(item)}
                                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${active ? 'text-agro-700 bg-agro-50 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        {item.label}
                                    </button>
                                );
                                    })}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MOBILE SEARCH */}
            {isSearchOpen && (
                <div className="md:hidden fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)}>
                    <div ref={searchModalRef} className="fixed top-0 left-0 right-0 bg-white p-4 animate-in slide-in-from-top-5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <button onClick={() => setIsSearchOpen(false)} aria-label="Fechar busca"><X size={24} /></button>
                            <h2 className="text-lg font-bold">Buscar</h2>
                        </div>
                        <input
                            ref={mobileSearchInputRef}
                            type="text"
                            className="w-full bg-slate-50 rounded-xl pl-4 pr-10 py-4 border-2 border-slate-200 outline-none focus:border-agro-500"
                            placeholder="Produto, marca ou cultura..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
