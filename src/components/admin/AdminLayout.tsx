import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    Users,
    Settings,
    Menu,
    X,
    ChevronRight,
    Image,
    Store,
    Bot,
    MessageSquare,
    List,
    Truck,
    Calendar,
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants/routes';
import { LogOut } from 'lucide-react';
import packageJson from '../../../package.json';

export type AdminView = 'DASHBOARD' | 'ORDERS' | 'PRODUCTS' | 'BANNERS' | 'USERS' | 'SETTINGS' | 'AI' | 'WHATSAPP' | 'MENU' | 'SHIPPING_GUARD' | 'SEASONAL';

const ADMIN_PATH_TO_VIEW: Record<string, AdminView> = {
    [ROUTES.ADMIN]: 'DASHBOARD',
    [ROUTES.ADMIN_ORDERS]: 'ORDERS',
    [ROUTES.ADMIN_PRODUCTS]: 'PRODUCTS',
    [ROUTES.ADMIN_BANNERS]: 'BANNERS',
    [ROUTES.ADMIN_USERS]: 'USERS',
    [ROUTES.ADMIN_SETTINGS]: 'SETTINGS',
    [ROUTES.ADMIN_AI]: 'AI',
    [ROUTES.ADMIN_WHATSAPP]: 'WHATSAPP',
    [ROUTES.ADMIN_MENU]: 'MENU',
    [ROUTES.ADMIN_SHIPPING_GUARD]: 'SHIPPING_GUARD',
    [ROUTES.ADMIN_SEASONAL]: 'SEASONAL',
};

export const ADMIN_VIEW_TO_PATH: Record<AdminView, string> = {
    DASHBOARD: ROUTES.ADMIN,
    ORDERS: ROUTES.ADMIN_ORDERS,
    PRODUCTS: ROUTES.ADMIN_PRODUCTS,
    BANNERS: ROUTES.ADMIN_BANNERS,
    USERS: ROUTES.ADMIN_USERS,
    SETTINGS: ROUTES.ADMIN_SETTINGS,
    AI: ROUTES.ADMIN_AI,
    WHATSAPP: ROUTES.ADMIN_WHATSAPP,
    MENU: ROUTES.ADMIN_MENU,
    SHIPPING_GUARD: ROUTES.ADMIN_SHIPPING_GUARD,
    SEASONAL: ROUTES.ADMIN_SEASONAL,
};

interface AdminLayoutProps {
    children: React.ReactNode;
    activeView?: AdminView; // Optional to allow override
    onNavigate?: (view: AdminView) => void; // Optional to allow override
}

interface NavItem {
    id: AdminView;
    label: string;
    icon: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
    children,
    activeView: propActiveView,
    onNavigate
}) => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { settings } = useStore();
    const { isAdmin, isGerente, hasRole, signOut } = useAuth();
    const isVendedor = hasRole(['vendedor']);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    const activeView: AdminView = useMemo(() => {
        if (propActiveView) return propActiveView;
        const exact = ADMIN_PATH_TO_VIEW[pathname];
        if (exact) return exact;
        for (const [path, view] of Object.entries(ADMIN_PATH_TO_VIEW)) {
            if (path !== ROUTES.ADMIN && pathname.startsWith(path)) return view;
        }
        return 'DASHBOARD';
    }, [pathname, propActiveView]);

    const navItems: NavItem[] = ([
        { id: 'DASHBOARD', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        { id: 'ORDERS', label: 'Pedidos', icon: <ShoppingBag size={18} /> },
        { id: 'PRODUCTS', label: 'Produtos', icon: <Package size={18} /> },
        { id: 'BANNERS', label: 'Banners', icon: <Image size={18} /> },
        { id: 'MENU', label: 'Régua de menu', icon: <List size={18} /> },
        { id: 'SHIPPING_GUARD', label: 'Logística', icon: <Truck size={18} /> },
        { id: 'SEASONAL', label: 'Sazonalidade', icon: <Calendar size={18} /> },
        { id: 'USERS', label: 'Usuários', icon: <Users size={18} /> },
        { id: 'WHATSAPP', label: 'WhatsApp', icon: <MessageSquare size={18} /> },
        { id: 'AI', label: 'Config. IA', icon: <Bot size={18} /> },
        { id: 'SETTINGS', label: 'Configurações', icon: <Settings size={18} /> },
    ] as NavItem[]).filter(item => {
        // Ver matriz de roles em App.tsx (AdminRoutes). Manter alinhado com ProtectedRoute por rota.
        if (isVendedor && !['DASHBOARD', 'ORDERS', 'PRODUCTS'].includes(item.id)) return false;
        if (!isAdmin && !isVendedor && item.id === 'AI') return false; // Gerente: sem Config. IA
        if (isVendedor && item.id === 'WHATSAPP') return false; // WhatsApp: apenas admin/gerente
        if (isVendedor && ['MENU', 'SHIPPING_GUARD', 'SEASONAL'].includes(item.id)) return false; // Menu, Logística, Sazonalidade: admin/gerente
        return true;
    });

    const handleNavClick = (view: AdminView) => {
        if (onNavigate) {
            onNavigate(view);
        } else {
            const path = ADMIN_VIEW_TO_PATH[view];
            if (path) navigate(path);
        }
        setIsSidebarOpen(false);
    };

    return (
        <div className="min-h-screen bg-stone-50 flex">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-stone-200 transform transition-transform duration-200 ease-out
                lg:relative lg:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo Area */}
                <div className="h-14 flex items-center justify-between px-4 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                        {settings?.logoUrl ? (
                            <img
                                src={settings.logoUrl}
                                alt={settings?.storeName || 'Logo'}
                                className="w-8 h-8 rounded-lg object-cover"
                            />
                        ) : (
                            <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white font-medium text-sm">
                                A
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="text-stone-900 font-medium text-sm">{settings?.storeName || 'Aquimaq'}</span>
                            <span className="text-stone-400 text-[10px] uppercase tracking-wider">
                                {isAdmin ? 'Painel Admin' : isGerente ? 'Painel Gerente' : isVendedor ? 'Painel Vendedor' : 'Painel'}
                            </span>
                        </div>
                    </div>
                    <button
                        className="lg:hidden text-stone-400 hover:text-stone-600 p-1"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-label="Fechar menu lateral"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-3 space-y-0.5">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            className={`
                                w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150
                                ${activeView === item.id
                                    ? 'bg-stone-100 text-stone-900'
                                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
                                }
                            `}
                        >
                            <span className={activeView === item.id ? 'text-stone-700' : 'text-stone-400'}>
                                {item.icon}
                            </span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                    <div className="my-2 border-t border-stone-100" />
                    <button
                        type="button"
                        onClick={() => {
                            navigate(ROUTES.HOME);
                            setIsSidebarOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-colors duration-150"
                    >
                        <span className="text-stone-400">
                            <Store size={18} />
                        </span>
                        <span>Ver loja</span>
                    </button>
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-stone-100 bg-white space-y-2">
                    <button
                        type="button"
                        onClick={async () => {
                            await signOut();
                            navigate(ROUTES.LOGIN);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-stone-500 hover:bg-stone-50 hover:text-red-600 transition-colors duration-150"
                    >
                        <LogOut size={16} />
                        <span>Sair do sistema</span>
                    </button>
                    <p className="text-xs text-stone-400 text-center">v{packageJson.version}</p>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top Header */}
                <header className="h-14 bg-white border-b border-stone-100 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
                    {/* Mobile Menu Toggle */}
                    <button
                        className="lg:hidden p-1.5 text-stone-500 hover:bg-stone-50 rounded-lg"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu size={20} />
                    </button>

                    {/* Breadcrumb / Title */}
                    <div className="hidden lg:flex items-center gap-1.5 text-[13px]">
                        <span className="text-stone-400">Gestão</span>
                        <ChevronRight size={12} className="text-stone-300" />
                        <span className="text-stone-600 font-medium">
                            {navItems.find(item => item.id === activeView)?.label || 'Dashboard'}
                        </span>
                    </div>

                    {/* Mobile Title */}
                    <h1 className="lg:hidden text-[15px] font-medium text-stone-700">
                        {navItems.find(item => item.id === activeView)?.label || 'Dashboard'}
                    </h1>

                    {/* Right side - Badge */}
                    <div className="flex items-center gap-2">
                        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wide bg-stone-100 text-stone-600">
                            {isAdmin ? 'Admin' : isGerente ? 'Gerente' : isVendedor ? 'Vendedor' : 'Painel'}
                        </span>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
