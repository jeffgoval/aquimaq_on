import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { ROUTES, ROUTE_PATHS } from '@/constants/routes';
import { AppProviders } from './providers';
import { useToast } from './contexts/ToastContext';

import MainLayout from './layouts/MainLayout';
import HomePage from '@/features/catalog/pages/HomePage';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { AdminGuard } from '@/features/admin';

const ProductPage = lazy(() => import('@/features/catalog/pages/ProductPage'));
const CartPage = lazy(() => import('@/features/cart/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/features/cart/pages/CheckoutPage'));

const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const PolicyPage = lazy(() => import('./pages/PolicyPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const UpdatePasswordPage = lazy(() => import('./pages/UpdatePasswordPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

const AdminLayoutPage = lazy(() => import('@/features/admin').then(m => ({ default: m.AdminLayoutPage })));
const AdminDashboardPage = lazy(() => import('@/features/admin').then(m => ({ default: m.AdminDashboardPage })));
const AdminOrdersPage = lazy(() => import('@/features/admin').then(m => ({ default: m.AdminOrdersPage })));
const AdminProductsPage = lazy(() => import('@/features/admin').then(m => ({ default: m.AdminProductsPage })));
const AdminBannersPage = lazy(() => import('@/features/admin').then(m => ({ default: m.AdminBannersPage })));
const AdminUsersPage = lazy(() => import('@/features/admin').then(m => ({ default: m.AdminUsersPage })));
const AdminSettingsPage = lazy(() => import('@/features/admin').then(m => ({ default: m.AdminSettingsPage })));
const AdminAnalytics = lazy(() => import('@/features/admin').then(m => ({ default: m.AdminAnalytics })));

const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }, [pathname]);
    return null;
};

const PageFallback = (
    <div className="min-h-[50vh] flex flex-col items-center justify-center bg-gray-50" style={{ minHeight: '50vh', background: '#f9fafb' }}>
        <div className="w-10 h-10 border-2 border-agro-200 border-t-agro-600 rounded-full animate-spin" aria-hidden />
        <p className="text-gray-500 text-sm mt-3">A carregar...</p>
    </div>
);

function AppContent() {
    const { toasts, hideToast } = useToast();

    return (
        <BrowserRouter>
            <ScrollToTop />
            <ErrorBoundary>
                <Suspense fallback={PageFallback}>
                    <Routes>
                        <Route path={ROUTES.HOME} element={<MainLayout />}>
                            <Route index element={<HomePage />} />
                            <Route path={ROUTE_PATHS.PRODUCT} element={<ProductPage />} />
                            <Route path={ROUTE_PATHS.CART} element={<CartPage />} />
                            <Route path={ROUTE_PATHS.CHECKOUT} element={<CheckoutPage />} />
                            <Route path={ROUTE_PATHS.WISHLIST} element={<WishlistPage />} />
                            <Route path={ROUTE_PATHS.POLICY_PRIVACY} element={<PolicyPage type="privacidade" />} />
                            <Route path={ROUTE_PATHS.POLICY_DELIVERY} element={<PolicyPage type="entrega" />} />
                            <Route path={ROUTE_PATHS.POLICY_RETURNS} element={<PolicyPage type="trocas" />} />
                            <Route path={ROUTE_PATHS.LOGIN} element={<LoginPage />} />
                            <Route path={ROUTE_PATHS.REGISTER} element={<RegisterPage />} />
                            <Route path={ROUTE_PATHS.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
                            <Route path={ROUTE_PATHS.UPDATE_PASSWORD} element={<UpdatePasswordPage />} />
                            <Route path={ROUTE_PATHS.PROFILE} element={<ProfilePage />} />
                        </Route>

                        <Route path={ROUTE_PATHS.ADMIN} element={<AdminGuard />}>
                            <Route element={<AdminLayoutPage />}>
                                <Route index element={<AdminDashboardPage />} />
                                <Route path={ROUTE_PATHS.ADMIN_PRODUCTS} element={<AdminProductsPage />} />
                                <Route path={ROUTE_PATHS.ADMIN_ORDERS} element={<AdminOrdersPage />} />
                                <Route path={ROUTE_PATHS.ADMIN_BANNERS} element={<AdminBannersPage />} />
                                <Route path={ROUTE_PATHS.ADMIN_USERS} element={<AdminUsersPage />} />
                                <Route path={ROUTE_PATHS.ADMIN_SETTINGS} element={<AdminSettingsPage />} />
                                <Route path={ROUTE_PATHS.ADMIN_ANALYTICS} element={<AdminAnalytics />} />
                            </Route>
                        </Route>

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
    );
}

export default function App() {
    return (
        <AppProviders>
            <AppContent />
        </AppProviders>
    );
}
