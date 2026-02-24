import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { ROUTES, ROUTE_PATHS } from '@/constants/routes';
import { AppProviders } from './providers';
import { useToast } from './contexts/ToastContext';
import { initMercadoPago } from '@mercadopago/sdk-react';
import { ENV } from './config/env';

initMercadoPago(ENV.VITE_MERCADO_PAGO_PUBLIC_KEY);

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
