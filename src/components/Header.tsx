import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, Store, Search, Phone, Truck, ShieldCheck, LogIn, LogOut, ChevronDown, Heart, LayoutDashboard, User, Package } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { ProductCategory } from '@/types';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { maskPhone } from '@/utils/masks';
import MegaMenu from './MegaMenu';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { ROUTES } from '@/constants/routes';

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

const NAV_CATEGORIES: { label: string; value: ProductCategory }[] = [
    { label: 'Nutrição Animal',     value: ProductCategory.NUTRITION },
    { label: 'Defensivos Agrícolas', value: ProductCategory.DEFENSIVES },
    { label: 'Sementes',            value: ProductCategory.SEEDS },
    { label: 'Equipamentos',        value: ProductCategory.EQUIPMENT },
    { label: 'Peças de Reposição',  value: ProductCategory.PARTS },
    { label: 'EPI e Segurança',     value: ProductCategory.PPE },
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
    const { user, loading: authLoading, signOut, isAdmin, isGerente } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const mobileSearchInputRef = useRef<HTMLInputElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

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

    const isActive = (path: string) => location.pathname === path;
    const isHomeActive = selectedCategory === 'ALL' && location.pathname === ROUTES.HOME && !searchQuery;

    return (
        <header role="banner" className="flex flex-col w-full shadow-md sticky top-0 z-50 font-sans">
            {/* 1. TOP BAR */}
            <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 hidden md:block border-b border-slate-800">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex space-x-6">
                        <span className="flex items-center">
                            <Truck size={14} className="mr-2 text-agro-500 shrink-0" />
                            Frete Grátis para todo Brasil em compras acima de R$ 299
                        </span>
                        <span className="flex items-center">
                            <ShieldCheck size={14} className="mr-2 text-agro-500 shrink-0" />
                            Garantia de 12 meses em toda a linha
                        </span>
                    </div>
                    <div className="flex space-x-6">
                        {settings?.phone ? (
                            <a
                                href={`tel:${settings.phone.replace(/\D/g, '')}`}
                                className="flex items-center hover:text-white transition-colors"
                            >
                                <Phone size={14} className="mr-2 text-agro-500 shrink-0" />
                                Central de Vendas: {maskPhone(settings.phone)}
                            </a>
                        ) : (
                            <span className="flex items-center">
                                <Phone size={14} className="mr-2 text-agro-500 shrink-0" />
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
                                                    <p className="text-xs text-slate-500">{isAdmin ? 'Administrador' : isGerente ? 'Gerente' : 'Cliente'}</p>
                                                </div>
                                                {(isAdmin || isGerente) && (
                                                    <Link
                                                        to={ROUTES.ADMIN}
                                                        onClick={() => { setIsUserMenuOpen(false); }}
                                                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                                        role="menuitem"
                                                    >
                                                        <LayoutDashboard size={16} />
                                                        Painel Admin
                                                    </Link>
                                                )}
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
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Link
                                        to={ROUTES.LOGIN}
                                        className={`hidden md:flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${isActive(ROUTES.LOGIN) ? 'text-agro-600 bg-agro-50' : 'text-slate-600 hover:bg-agro-50 hover:text-agro-700'}`}
                                    >
                                        <LogIn size={17} />
                                        Entrar
                                    </Link>
                                )
                            )}

                            {/* Wishlist icon — desktop */}
                            <Link
                                to={ROUTES.WISHLIST}
                                className={`hidden md:flex p-2 hover:bg-agro-50 rounded-full transition-all ${isActive(ROUTES.WISHLIST) ? 'text-red-500 bg-red-50' : 'text-slate-500 hover:text-red-400'}`}
                                aria-label="Favoritos"
                            >
                                <Heart size={21} className={isActive(ROUTES.WISHLIST) ? 'fill-red-500' : ''} />
                            </Link>

                            {/* Cart */}
                            <Link
                                to={ROUTES.CART}
                                className={`p-2 hover:bg-agro-50 rounded-full relative transition-all ${isActive(ROUTES.CART) ? 'text-agro-600 bg-agro-50' : 'text-slate-600'}`}
                                aria-label="Carrinho"
                            >
                                <ShoppingCart size={22} />
                                {cartItemCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center text-[10px] font-bold text-white bg-red-600 rounded-full shadow-sm ring-2 ring-white">
                                        {cartItemCount}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. CATEGORY NAVIGATION */}
            <div className="hidden md:block bg-slate-900 text-white shadow-inner">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex items-center space-x-1 text-sm font-medium h-11">
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

                        {/* Mega Menu */}
                        <MegaMenu onCategoryClick={(c) => handleCategoryClick(c as ProductCategory)} />

                        {/* Category quick links */}
                        <div className="flex h-full space-x-0.5 overflow-hidden">
                            {NAV_CATEGORIES.map((cat) => (
                                <button
                                    key={cat.value}
                                    onClick={() => handleCategoryClick(cat.value)}
                                    className={`px-3 h-full flex items-center border-b-2 transition-colors whitespace-nowrap text-xs ${selectedCategory === cat.value
                                        ? 'border-agro-500 text-white'
                                        : 'border-transparent text-slate-300 hover:text-white'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </nav>
                </div>
            </div>

            {/* MOBILE MENU */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
                    <div ref={mobileMenuRef} className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                            <span className="text-lg font-bold">Menu</span>
                            <button onClick={() => setIsMobileMenuOpen(false)} aria-label="Fechar menu"><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
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
                                                <p className="text-slate-500 text-xs">{isAdmin ? 'Administrador' : isGerente ? 'Gerente' : 'Cliente'}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            {(isAdmin || isGerente) && (
                                                <Link
                                                    to={ROUTES.ADMIN}
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className="flex items-center gap-2 px-3 py-2.5 text-slate-700 hover:bg-slate-50 rounded-lg"
                                                >
                                                    <LayoutDashboard size={18} />
                                                    Painel Admin
                                                </Link>
                                            )}
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
                            {Object.values(ProductCategory).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryClick(cat)}
                                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${selectedCategory === cat
                                        ? 'text-agro-700 bg-agro-50 font-medium'
                                        : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
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
