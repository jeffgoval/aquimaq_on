import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, Store, Search, Phone, Truck, ShieldCheck, Heart, User, ChevronDown, LayoutDashboard, LogOut } from 'lucide-react';
import { ProductCategory } from '@/types';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { maskPhone } from '@/utils/masks';
import MegaMenu from './MegaMenu';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { ROUTES } from '@/constants/routes';

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
    const { user, profile, loading: authLoading, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const mobileSearchInputRef = useRef<HTMLInputElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const isAdmin = profile?.role === 'admin' || profile?.role === 'gerente';

    // Focus Traps
    const mobileMenuRef = useFocusTrap(isMobileMenuOpen, () => setIsMobileMenuOpen(false));
    const searchModalRef = useFocusTrap(isSearchOpen, () => setIsSearchOpen(false));

    // Auto-focus mobile search input
    useEffect(() => {
        if (isSearchOpen && mobileSearchInputRef.current) {
            mobileSearchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    const handleClickOutsideUserMenu = useCallback((e: MouseEvent) => {
        if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
            setUserMenuOpen(false);
        }
    }, []);
    useEffect(() => {
        if (!userMenuOpen) return;
        document.addEventListener('click', handleClickOutsideUserMenu);
        return () => document.removeEventListener('click', handleClickOutsideUserMenu);
    }, [userMenuOpen, handleClickOutsideUserMenu]);

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

    return (
        <header role="banner" className="flex flex-col w-full shadow-md z-50 relative font-sans">
            {/* 1. TOP BAR - Dark, Information Heavy */}
            <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 hidden md:block border-b border-slate-800">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex space-x-6">
                        <span className="flex items-center hover:text-white transition-colors cursor-default">
                            <Truck size={14} className="mr-2 text-agro-500" />
                            Frete Grátis para todo Brasil em compras acima de R$ 299
                        </span>
                        <span className="flex items-center hover:text-white transition-colors cursor-default">
                            <ShieldCheck size={14} className="mr-2 text-agro-500" />
                            Garantia de 12 meses em toda a linha
                        </span>
                    </div>
                    <div className="flex space-x-6">
                        <a href="#" className="flex items-center hover:text-white transition-colors">
                            <Phone size={14} className="mr-2 text-agro-500" />
                            Central de Vendas: {settings?.phone ? maskPhone(settings.phone) : '(00) 00000-0000'}
                        </a>
                        <a href="#" className="hover:text-white transition-colors">
                            Seja um Revendedor
                        </a>
                    </div>
                </div>
            </div>

            {/* 2. MAIN HEADER - Logo, Search, Actions */}
            <div className="bg-white py-4 md:py-6 relative z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between gap-4 md:gap-8">

                        {/* Mobile Menu Button */}
                        <button
                            className="p-2 -ml-2 text-slate-600 md:hidden hover:bg-slate-100 rounded-lg"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
                            aria-expanded={isMobileMenuOpen}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        {/* Branding / Logo */}
                        <div
                            className="flex items-center cursor-pointer flex-shrink-0 group"
                            onClick={handleLogoClick}
                        >
                            {settings?.logoUrl ? (
                                <img
                                    src={settings.logoUrl}
                                    alt={settings?.storeName || 'Logo'}
                                    className="w-12 h-12 md:w-16 md:h-16 object-contain mr-2 md:mr-3 rounded-xl"
                                />
                            ) : (
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-agro-500 to-agro-700 rounded-xl flex items-center justify-center text-white font-bold text-2xl md:text-3xl shadow-lg mr-2 md:mr-3 group-hover:shadow-agro-500/30 transition-all duration-300">
                                    A
                                </div>
                            )}
                            <div className="flex flex-col">
                                <span className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-none group-hover:text-agro-700 transition-colors">{settings?.storeName || 'Aquimaq'}</span>
                            </div>
                        </div>

                        {/* Search Bar - Desktop */}
                        <div className="hidden md:flex flex-1 max-w-2xl mx-auto relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search size={20} className="text-slate-400 group-focus-within:text-agro-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                className="w-full bg-slate-50 text-slate-900 rounded-full pl-11 pr-4 py-3 border-2 border-transparent focus:border-agro-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-agro-500/10 transition-all duration-200 placeholder-slate-400 font-medium"
                                placeholder="O que você procura hoje?"
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                            <button className="absolute right-2 top-1.5 bottom-1.5 px-6 bg-agro-600 text-white rounded-full font-semibold text-sm hover:bg-agro-700 transition-colors shadow-sm">
                                Buscar
                            </button>
                        </div>

                        {/* Actions Area */}
                        <div className="flex items-center space-x-1 md:space-x-2">
                            {/* Mobile Search Toggle */}
                            <button
                                className="p-2 text-slate-500 md:hidden hover:bg-slate-50 rounded-full"
                                onClick={() => setIsSearchOpen(true)}
                                aria-label="Abrir busca"
                            >
                                <Search size={22} />
                            </button>

                            {/* Wishlist Placeholder */}
                            <button className="hidden sm:flex p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors relative group" title="Lista de Desejos">
                                <Heart size={22} />
                            </button>

                            {/* Auth */}
                            {!authLoading && (
                              <>
                                {user ? (
                                  <div className="hidden sm:block relative" ref={userMenuRef}>
                                    <button
                                      type="button"
                                      onClick={() => setUserMenuOpen((v) => !v)}
                                      className="flex items-center gap-1.5 py-1.5 pl-1.5 pr-2 rounded-lg hover:bg-slate-100 text-slate-700"
                                      aria-expanded={userMenuOpen}
                                      aria-haspopup="true"
                                      aria-label="Menu da conta"
                                    >
                                      <span className="w-8 h-8 rounded-full bg-agro-100 text-agro-700 flex items-center justify-center flex-shrink-0">
                                        <User size={18} />
                                      </span>
                                      <span className="text-sm font-medium max-w-[100px] truncate">
                                        {profile?.full_name || profile?.name || user.email || 'Conta'}
                                      </span>
                                      <ChevronDown size={16} className={`text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {userMenuOpen && (
                                      <div className="absolute right-0 top-full mt-1 py-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                                        <Link
                                          to={ROUTES.PROFILE}
                                          onClick={() => setUserMenuOpen(false)}
                                          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                        >
                                          <User size={16} />
                                          Minha Conta
                                        </Link>
                                        {isAdmin && (
                                          <Link
                                            to={ROUTES.ADMIN}
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                          >
                                            <LayoutDashboard size={16} />
                                            Painel Admin
                                          </Link>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => { setUserMenuOpen(false); signOut(); }}
                                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                          <LogOut size={16} />
                                          Sair
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="hidden sm:flex items-center gap-2">
<Link to={ROUTES.LOGIN} className="text-slate-600 hover:text-agro-600 text-sm font-medium">
                                    Entrar
                                    </Link>
                                    <span className="text-slate-300">|</span>
                                    <Link to={ROUTES.REGISTER} className="text-slate-600 hover:text-agro-600 text-sm font-medium">
                                      Registar
                                    </Link>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Cart */}
                            <Link
                                to={ROUTES.CART}
                                onMouseEnter={() => {
                                    import('@/features/cart/pages/CartPage');
                                }}
                                className={`p-2 hover:bg-agro-50 rounded-full relative transition-all group mr-1 ${isActive(ROUTES.CART) ? 'text-agro-600 bg-agro-50' : 'text-slate-600'}`}
                                aria-label={`Carrinho de compras, ${cartItemCount} ${cartItemCount === 1 ? 'item' : 'itens'} `}
                            >
                                <ShoppingCart size={22} />
                                {cartItemCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-600 rounded-full shadow-sm ring-2 ring-white">
                                        {cartItemCount}
                                    </span>
                                )}
                            </Link>

                        </div>
                    </div>
                </div>
            </div>

            {/* 3. CATEGORY NAVIGATION BAR (Desktop) */}
            <div className="hidden md:block bg-slate-900 text-white shadow-inner">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex items-center space-x-1 justify-between text-sm font-medium h-12">
                        <button
                            onClick={() => handleLogoClick()}
                            className="flex items-center px-4 h-full transition-colors border-b-2 border-transparent text-slate-300 hover:text-white hover:bg-white/5"
                        >
                            <Store size={18} className="mr-2" />
                            Início
                        </button>

                        <MegaMenu onCategoryClick={(categoryName) => {
                            const category = Object.values(ProductCategory).includes(categoryName as ProductCategory)
                                ? (categoryName as ProductCategory)
                                : 'ALL';
                            handleCategoryClick(category);
                        }} />

                        <div className="flex h-full space-x-1">
                            {Object.values(ProductCategory).slice(0, 6).map((category) => (
                                <button
                                    key={category}
                                    onClick={() => handleCategoryClick(category)}
                                    className={`px-4 h-full flex items-center border-b-2 transition-colors ${selectedCategory === category
                                        ? 'border-agro-500 text-white bg-white/5'
                                        : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>

                        <div className="pl-4 border-l border-slate-700 h-6 my-auto flex items-center">
                            <a href="#" className="text-agro-400 hover:text-agro-300 text-xs font-bold uppercase tracking-wider flex items-center">
                                <Store size={14} className="mr-1.5" />
                                Ofertas do Dia
                            </a>
                        </div>
                    </nav>
                </div>
            </div>

            {/* MOBILE MENU OVERLAY */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
                    <div
                        ref={mobileMenuRef}
                        className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col animate-in slide-in-from-left-5 duration-300"
                        onClick={e => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Menu Principal"
                    >
                        {/* Mobile Menu Header */}
                        <div className="bg-slate-900 text-white p-4 pb-6">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-lg font-bold">Menu</span>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white" aria-label="Fechar menu">
                                    <X size={24} />
                                </button>
                            </div>
                            {!authLoading && (
                                <div className="flex items-center gap-3">
                                    {user ? (
                                        <div className="flex flex-col gap-2">
                                            <Link to={ROUTES.PROFILE} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 text-slate-300 hover:text-white text-sm">
                                                <User size={16} />
                                                Minha Conta
                                            </Link>
                                            {isAdmin && (
                                                <Link to={ROUTES.ADMIN} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 text-slate-300 hover:text-white text-sm">
                                                    <LayoutDashboard size={16} />
                                                    Painel Admin
                                                </Link>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                                                className="flex items-center gap-2 text-agro-400 hover:text-agro-300 text-sm font-medium"
                                            >
                                                <LogOut size={16} />
                                                Sair
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <Link to={ROUTES.LOGIN} onClick={() => setIsMobileMenuOpen(false)} className="text-agro-400 hover:text-agro-300 text-sm font-medium">
                                                Entrar
                                            </Link>
                                            <Link to={ROUTES.REGISTER} onClick={() => setIsMobileMenuOpen(false)} className="text-agro-400 hover:text-agro-300 text-sm font-medium">
                                                Registar
                                            </Link>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Links */}
                        <div className="flex-1 overflow-y-auto bg-slate-50">
                            {/* Quick Categories */}
                            <div className="p-2 space-y-1">
                                <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Departamentos</p>
                                <button
                                    onClick={() => handleCategoryClick('ALL')}
                                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center font-medium ${selectedCategory === 'ALL' ? 'bg-white text-agro-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}
                                >
                                    Todos os Produtos
                                </button>
                                {Object.values(ProductCategory).map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => handleCategoryClick(category)}
                                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center font-medium ${selectedCategory === category ? 'bg-white text-agro-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MOBILE SEARCH MODAL */}
            {isSearchOpen && (
                <div
                    className="md:hidden fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm"
                    onClick={() => setIsSearchOpen(false)}
                >
                    <div
                        ref={searchModalRef}
                        className="fixed top-0 left-0 right-0 bg-white shadow-2xl animate-in slide-in-from-top-5 duration-300"
                        onClick={e => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Busca de Produtos"
                    >
                        <div className="p-4">
                            <div className="flex items-center gap-3 mb-4">
                                <button
                                    onClick={() => setIsSearchOpen(false)}
                                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"
                                    aria-label="Fechar busca"
                                >
                                    <X size={24} />
                                </button>
                                <h2 className="text-lg font-bold text-slate-900">Buscar Produtos</h2>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search size={20} className="text-slate-400" />
                                </div>
                                <input
                                    ref={mobileSearchInputRef}
                                    type="text"
                                    className="w-full bg-slate-50 text-slate-900 rounded-xl pl-11 pr-4 py-4 border-2 border-slate-200 focus:border-agro-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-agro-500/10 transition-all duration-200 placeholder-slate-400 font-medium text-base"
                                    placeholder="O que você procura?"
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            setIsSearchOpen(false);
                                            // Search handled by useEffect/props, navigate home logic:
                                            navigate(ROUTES.HOME);
                                        }
                                    }}
                                />
                            </div>

                            {searchQuery && (
                                <button
                                    onClick={() => {
                                        setIsSearchOpen(false);
                                        navigate(ROUTES.HOME);
                                    }}
                                    className="w-full mt-4 bg-agro-600 text-white rounded-xl py-3 font-semibold hover:bg-agro-700 transition-colors"
                                >
                                    Buscar
                                </button>
                            )}

                            <p className="text-xs text-slate-500 mt-4 text-center">
                                Pressione Enter para buscar
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
