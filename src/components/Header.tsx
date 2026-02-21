import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, Store, Search, Phone, Truck, ShieldCheck, Heart } from 'lucide-react';
import { ProductCategory } from '@/types';
import { useStore } from '@/contexts/StoreContext';
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
    const navigate = useNavigate();
    const location = useLocation();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const mobileSearchInputRef = useRef<HTMLInputElement>(null);

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

    return (
        <header role="banner" className="flex flex-col w-full shadow-md z-50 relative font-sans">
            {/* 1. TOP BAR */}
            <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 hidden md:block border-b border-slate-800">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex space-x-6">
                        <span className="flex items-center">
                            <Truck size={14} className="mr-2 text-agro-500" />
                            Frete Grátis para todo Brasil em compras acima de R$ 299
                        </span>
                        <span className="flex items-center">
                            <ShieldCheck size={14} className="mr-2 text-agro-500" />
                            Garantia de 12 meses em toda a linha
                        </span>
                    </div>
                    <div className="flex space-x-6">
                        <span className="flex items-center">
                            <Phone size={14} className="mr-2 text-agro-500" />
                            Central de Vendas: {settings?.phone ? maskPhone(settings.phone) : '(00) 00000-0000'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. MAIN HEADER */}
            <div className="bg-white py-4 md:py-6 relative z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between gap-4 md:gap-8">
                        <button
                            className="p-2 -ml-2 text-slate-600 md:hidden hover:bg-slate-100 rounded-lg"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        <div className="flex items-center cursor-pointer group" onClick={handleLogoClick}>
                            {settings?.logoUrl ? (
                                <img src={settings.logoUrl} alt="Logo" className="w-12 h-12 md:w-16 md:h-16 object-contain mr-2 md:mr-3 rounded-xl" />
                            ) : (
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-agro-500 to-agro-700 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg mr-2 md:mr-3">A</div>
                            )}
                            <span className="text-xl md:text-2xl font-bold text-slate-900">{settings?.storeName || 'Aquimaq'}</span>
                        </div>

                        <div className="hidden md:flex flex-1 max-w-2xl mx-auto relative">
                            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                className="w-full bg-slate-50 rounded-full pl-11 pr-4 py-3 border-2 border-transparent focus:border-agro-500 focus:bg-white focus:outline-none transition-all"
                                placeholder="O que você procura hoje?"
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <button className="p-2 text-slate-500 md:hidden" onClick={() => setIsSearchOpen(true)}>
                                <Search size={22} />
                            </button>
                            <Link
                                to={ROUTES.CART}
                                className={`p-2 hover:bg-agro-50 rounded-full relative transition-all ${isActive(ROUTES.CART) ? 'text-agro-600 bg-agro-50' : 'text-slate-600'}`}
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
                    <nav className="flex items-center space-x-1 justify-between text-sm font-medium h-12">
                        <button onClick={() => handleLogoClick()} className="flex items-center px-4 h-full text-slate-300 hover:text-white">
                            <Store size={18} className="mr-2" />
                            Início
                        </button>
                        <MegaMenu onCategoryClick={(c) => handleCategoryClick(c as ProductCategory)} />
                        <div className="flex h-full space-x-1">
                            {Object.values(ProductCategory).slice(0, 6).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryClick(cat)}
                                    className={`px-4 h-full flex items-center border-b-2 transition-colors ${selectedCategory === cat ? 'border-agro-500 text-white' : 'border-transparent text-slate-300 hover:text-white'}`}
                                >
                                    {cat}
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
                            <button onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {Object.values(ProductCategory).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryClick(cat)}
                                    className="w-full text-left px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg"
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
                            <button onClick={() => setIsSearchOpen(false)}><X size={24} /></button>
                            <h2 className="text-lg font-bold">Buscar</h2>
                        </div>
                        <input
                            ref={mobileSearchInputRef}
                            type="text"
                            className="w-full bg-slate-50 rounded-xl pl-4 pr-10 py-4 border-2 border-slate-200 outline-none"
                            placeholder="O que procura?"
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
