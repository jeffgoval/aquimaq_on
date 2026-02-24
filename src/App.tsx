import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { ROUTES, ROUTE_PATHS } from '@/constants/routes';
import { AppProviders } from './providers';
import { useToast } from './contexts/ToastContext';
import { initMercadoPago } from '@mercadopago/sdk-react';
import { ENV } from './config/env';



import MainLayout from './layouts/MainLayout';
import HomePage from '@/features/catalog/pages/HomePage';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import ChatWidget from './components/ChatWidget';

const ProductPage = lazy(() => import('@/features/catalog/pages/ProductPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const PolicyPage = lazy(() => import('./pages/PolicyPage'));
const CartPage = lazy(() => import('@/features/cart/pages/CartPage'));

const LoginPage = lazy(() => import('./pages/LoginPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const PaymentFailurePage = lazy(() => import('./pages/PaymentFailurePage'));
const PaymentPendingPage = lazy(() => import('./pages/PaymentPendingPage'));

// Admin Components
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const AdminOrdersManagement = lazy(() => import('./components/admin/AdminOrdersManagement'));
const AdminProductsManagement = lazy(() => import('./components/admin/AdminProductsManagement'));
const AdminBannerManagement = lazy(() => import('./components/admin/AdminBannerManagement'));
const AdminUsersManagement = lazy(() => import('./components/admin/AdminUsersManagement'));
const AdminKnowledgeBase = lazy(() => import('./components/admin/AdminKnowledgeBase'));
const AdminChatPanel = lazy(() => import('./components/admin/AdminChatPanel'));
const StoreSettings = lazy(() => import('./components/StoreSettings'));

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

// Helper to bridge route navigation with component callbacks
function AdminRoutes() {
    const navigate = useNavigate();

    const handleAdminNavigate = (view: string) => {
        const paths: Record<string, string> = {
            'ORDERS': ROUTES.ADMIN_ORDERS,
            'PRODUCTS': ROUTES.ADMIN_PRODUCTS,
            'USERS': ROUTES.ADMIN_USERS,
            'DASHBOARD': ROUTES.ADMIN
        };
        navigate(paths[view] || ROUTES.ADMIN);
    };

    return (
        <Suspense fallback={PageFallback}>
            <Routes>
                <Route index element={<AdminDashboard onNavigate={handleAdminNavigate} />} />
                <Route path={ROUTE_PATHS.ADMIN_ORDERS} element={<AdminOrdersManagement />} />
                <Route path={ROUTE_PATHS.ADMIN_PRODUCTS} element={<AdminProductsManagement />} />
                <Route path={ROUTE_PATHS.ADMIN_BANNERS} element={<AdminBannerManagement />} />

                {/* Admin Only Routes */}
                <Route path={ROUTE_PATHS.ADMIN_USERS} element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminUsersManagement />
                    </ProtectedRoute>
                } />
                <Route path={ROUTE_PATHS.ADMIN_SETTINGS} element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <StoreSettings onBack={() => navigate(ROUTES.ADMIN)} />
                    </ProtectedRoute>
                } />
                <Route path={ROUTE_PATHS.ADMIN_KNOWLEDGE} element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminKnowledgeBase />
                    </ProtectedRoute>
                } />
                <Route path={ROUTE_PATHS.ADMIN_CHAT} element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminChatPanel />
                    </ProtectedRoute>
                } />
            </Routes>
        </Suspense>
    );
}

function AppContent() {
    const { toasts, hideToast } = useToast();

    useEffect(() => {
        if (ENV.VITE_MERCADO_PAGO_PUBLIC_KEY && ENV.VITE_MERCADO_PAGO_PUBLIC_KEY.startsWith('APP_USR')) {
            try {
                initMercadoPago(ENV.VITE_MERCADO_PAGO_PUBLIC_KEY, { locale: 'pt-BR' });
            } catch (e) {
                console.error('Failed to initialize MercadoPago SDK:', e);
            }
        }
    }, []);

    return (
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
                            <Route path={ROUTE_PATHS.POLICY_PRIVACY} element={<PolicyPage type="privacidade" />} />
                            <Route path={ROUTE_PATHS.POLICY_DELIVERY} element={<PolicyPage type="entrega" />} />
                            <Route path={ROUTE_PATHS.POLICY_RETURNS} element={<PolicyPage type="trocas" />} />
                            <Route path={ROUTE_PATHS.PAYMENT_SUCCESS} element={<PaymentSuccessPage />} />
                            <Route path={ROUTE_PATHS.PAYMENT_FAILURE} element={<PaymentFailurePage />} />
                            <Route path={ROUTE_PATHS.PAYMENT_PENDING} element={<PaymentPendingPage />} />
                        </Route>

                        {/* Admin Routes */}
                        <Route
                            path="/admin/*"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'gerente']}>
                                    <AdminLayout>
                                        <AdminRoutes />
                                    </AdminLayout>
                                </ProtectedRoute>
                            }
                        />

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

            <ChatWidget />
        </BrowserRouter>
    );
}

export default function App() {
    return (
        <AppProviders>
            <AppContent />
        </AppProviders>
    );
}
