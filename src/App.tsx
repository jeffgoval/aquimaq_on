import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { ROUTES, ROUTE_PATHS } from '@/constants/routes';
import { AppProviders } from './providers';
import { useToast } from './contexts/ToastContext';
import { useAuth } from './contexts/AuthContext';
import { ENV } from './config/env';



import MainLayout from './layouts/MainLayout';
import HomePage from '@/features/catalog/pages/HomePage';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
const ProductPage = lazy(() => import('@/features/catalog/pages/ProductPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const PolicyPage = lazy(() => import('./pages/PolicyPage'));
const CartPage = lazy(() => import('@/features/cart/pages/CartPage'));

const LoginPage = lazy(() => import('./pages/LoginPage'));
const StaffLoginPage = lazy(() => import('./pages/StaffLoginPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const PaymentFailurePage = lazy(() => import('./pages/PaymentFailurePage'));
const PaymentPendingPage = lazy(() => import('./pages/PaymentPendingPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));

// Admin Components
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const AdminOrdersManagement = lazy(() => import('./components/admin/AdminOrdersManagement'));
const AdminProductsManagement = lazy(() => import('./components/admin/AdminProductsManagement'));
const AdminBannerManagement = lazy(() => import('./components/admin/AdminBannerManagement'));
const AdminUsersManagement = lazy(() => import('./components/admin/AdminUsersManagement'));
const StoreSettings = lazy(() => import('./components/StoreSettings'));
const AdminAISettings = lazy(() => import('./components/admin/AdminAISettings'));
const AdminWhatsAppManagement = lazy(() => import('./components/admin/AdminWhatsAppManagement'));
const AdminShippingGuard = lazy(() => import('./components/admin/AdminShippingGuard'));
const AdminSeasonalPage = lazy(() => import('./components/admin/AdminSeasonalPage'));
const AdminReviewsManagement = lazy(() => import('./components/admin/AdminReviewsManagement'));
const AdminCouponManagement = lazy(() => import('./components/admin/AdminCouponManagement'));
const AdminShippingPage = lazy(() => import('./pages/admin/AdminShippingPage'));

const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }, [pathname]);
    return null;
};

const PageFallback = (
    <div className="min-h-[50vh] flex flex-col items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-2 border-agro-200 border-t-agro-600 rounded-full animate-spin" aria-hidden />
        <p className="text-gray-500 text-sm mt-3">Carregando...</p>
    </div>
);

const AdminGateFallback = (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <div className="w-10 h-10 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin" aria-hidden />
        <p className="text-stone-500 text-sm mt-3">Verificando...</p>
    </div>
);

/** Para /admin: se não autenticado mostra login minimal (sem layout loja); se autenticado mostra painel. */
function AdminGate() {
    const { user, loading } = useAuth();
    if (loading) return AdminGateFallback;
    if (!user) {
        return (
            <Suspense fallback={AdminGateFallback}>
                <StaffLoginPage />
            </Suspense>
        );
    }
    return (
        <ProtectedRoute allowedRoles={['admin', 'gerente', 'vendedor']}>
            <AdminLayout>
                <AdminRoutes />
            </AdminLayout>
        </ProtectedRoute>
    );
}

/**
 * Matriz de acesso por role (menu AdminLayout + rotas):
 * - admin: Dashboard, Pedidos, Produtos, Banners, Usuários, Configurações, Config. IA
 * - gerente: Dashboard, Pedidos, Produtos, Banners, Usuários, Configurações (sem IA)
 * - vendedor: Dashboard, Pedidos, Produtos (sem Banners, Usuários, Config, IA)
 * Rotas protegidas por ProtectedRoute em cada Route abaixo; layout filtra itens do menu.
 */
function AdminRoutes() {
    const navigate = useNavigate();

    const handleAdminNavigate = (view: string) => {
        const paths: Record<string, string> = {
            DASHBOARD: ROUTES.ADMIN,
            ORDERS: ROUTES.ADMIN_ORDERS,
            PRODUCTS: ROUTES.ADMIN_PRODUCTS,
            BANNERS: ROUTES.ADMIN_BANNERS,
            USERS: ROUTES.ADMIN_USERS,
            SETTINGS: ROUTES.ADMIN_SETTINGS,
            AI: ROUTES.ADMIN_AI,
            WHATSAPP: ROUTES.ADMIN_WHATSAPP,
            SHIPPING_GUARD: ROUTES.ADMIN_SHIPPING_GUARD,
            SHIPPING: ROUTES.ADMIN_SHIPPING,
            SEASONAL: ROUTES.ADMIN_SEASONAL,
            REVIEWS: ROUTES.ADMIN_REVIEWS,
        };
        navigate(paths[view] ?? ROUTES.ADMIN);
    };

    return (
        <Suspense fallback={PageFallback}>
            <Routes>
                <Route index element={<AdminDashboard onNavigate={handleAdminNavigate} />} />
                <Route path={ROUTE_PATHS.ADMIN_ORDERS} element={<AdminOrdersManagement />} />
                <Route path={ROUTE_PATHS.ADMIN_PRODUCTS} element={<AdminProductsManagement />} />
                <Route path={ROUTE_PATHS.ADMIN_BANNERS} element={
                    <ProtectedRoute allowedRoles={['admin', 'gerente']}>
                        <AdminBannerManagement />
                    </ProtectedRoute>
                } />
                <Route path={ROUTE_PATHS.ADMIN_COUPONS} element={
                    <ProtectedRoute allowedRoles={['admin', 'gerente']}>
                        <AdminCouponManagement />
                    </ProtectedRoute>
                } />

                {/* Admin and Gerente Routes */}
                <Route path={ROUTE_PATHS.ADMIN_USERS} element={
                    <ProtectedRoute allowedRoles={['admin', 'gerente']}>
                        <AdminUsersManagement />
                    </ProtectedRoute>
                } />
                <Route path={ROUTE_PATHS.ADMIN_SETTINGS} element={
                    <ProtectedRoute allowedRoles={['admin', 'gerente']}>
                        <StoreSettings onBack={() => navigate(ROUTES.ADMIN)} />
                    </ProtectedRoute>
                } />
                <Route path={ROUTE_PATHS.ADMIN_AI} element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminAISettings />
                    </ProtectedRoute>
                } />
                <Route path={ROUTE_PATHS.ADMIN_WHATSAPP} element={
                    <ProtectedRoute allowedRoles={['admin', 'gerente']}>
                        <AdminWhatsAppManagement />
                    </ProtectedRoute>
                } />
                <Route path={ROUTE_PATHS.ADMIN_SHIPPING_GUARD} element={
                    <ProtectedRoute allowedRoles={['admin', 'gerente']}>
                        <AdminShippingGuard />
                    </ProtectedRoute>
                } />
                <Route path={ROUTE_PATHS.ADMIN_SEASONAL} element={
                    <ProtectedRoute allowedRoles={['admin', 'gerente']}>
                        <AdminSeasonalPage />
                    </ProtectedRoute>
                } />
                <Route path={ROUTE_PATHS.ADMIN_REVIEWS} element={
                    <ProtectedRoute allowedRoles={['admin', 'gerente']}>
                        <AdminReviewsManagement />
                    </ProtectedRoute>
                } />
                <Route path={ROUTE_PATHS.ADMIN_SHIPPING} element={
                    <ProtectedRoute allowedRoles={['admin', 'gerente']}>
                        <AdminShippingPage />
                    </ProtectedRoute>
                } />
            </Routes>
        </Suspense>
    );
}

function AppContent() {
    const { toasts, hideToast } = useToast();

    useEffect(() => {
        // Any other initializations can go here
    }, []);

    return (
        <>
            <BrowserRouter>
                <ScrollToTop />
                <ErrorBoundary>
                    <Suspense fallback={PageFallback}>
                        <Routes>
                            <Route path={ROUTES.HOME} element={<MainLayout />}>
                                <Route index element={<HomePage />} />
                                <Route path={ROUTE_PATHS.LOGIN} element={<LoginPage />} />
                                <Route path={ROUTE_PATHS.ACCOUNT} element={<AccountPage />} />
                                <Route path={ROUTE_PATHS.PRODUCT} element={<ProductPage />} />
                                <Route path={ROUTE_PATHS.CART} element={<CartPage />} />
                                <Route path={ROUTE_PATHS.WISHLIST} element={<WishlistPage />} />
                                <Route path={ROUTE_PATHS.ORDERS} element={<OrdersPage />} />
                                <Route path={ROUTE_PATHS.POLICY_PRIVACY} element={<PolicyPage type="privacidade" />} />
                                <Route path={ROUTE_PATHS.POLICY_DELIVERY} element={<PolicyPage type="entrega" />} />
                                <Route path={ROUTE_PATHS.POLICY_RETURNS} element={<PolicyPage type="trocas" />} />
                                <Route path={ROUTE_PATHS.PAYMENT_SUCCESS} element={<PaymentSuccessPage />} />
                                <Route path={ROUTE_PATHS.PAYMENT_FAILURE} element={<PaymentFailurePage />} />
                                <Route path={ROUTE_PATHS.PAYMENT_PENDING} element={<PaymentPendingPage />} />
                                <Route path={ROUTE_PATHS.CONTACT} element={<ContactPage />} />
                                <Route path={ROUTE_PATHS.ABOUT} element={<AboutPage />} />
                                <Route path={ROUTE_PATHS.FAQ} element={<FAQPage />} />
                            </Route>

                            {/* Admin Routes: sem sessão = login minimal (sem layout loja); com sessão = painel */}
                            <Route path="/admin/*" element={<AdminGate />} />

                            <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
                        </Routes>
                    </Suspense>
                </ErrorBoundary>

                <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
                    {toasts.map(toast => (
                        <div key={toast.id} className="pointer-events-auto">
                            <Toast id={toast.id} message={toast.message} type={toast.type} onClose={(id) => hideToast(id)} />
                        </div>
                    ))}
                </div>
            </BrowserRouter>
        </>
    );
}

export default function App() {
    return (
        <AppProviders>
            <AppContent />
        </AppProviders>
    );
}
