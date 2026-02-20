import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { StoreProvider } from './contexts/StoreContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { HelmetProvider } from 'react-helmet-async';
import { WishlistProvider } from './contexts/WishlistContext';

import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import AdminGuard from './components/AdminGuard';

const ProductPage = lazy(() => import('./pages/ProductPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));

const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const PolicyPage = lazy(() => import('./pages/PolicyPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const UpdatePasswordPage = lazy(() => import('./pages/UpdatePasswordPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

const AdminLayoutPage = lazy(() => import('./pages/admin/AdminLayoutPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'));
const AdminBannersPage = lazy(() => import('./pages/admin/AdminBannersPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));

const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));

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
                        <Route path="/" element={<MainLayout />}>
                            <Route index element={<HomePage />} />
                            <Route path="produto/:id" element={<ProductPage />} />
                            <Route path="carrinho" element={<CartPage />} />
                            <Route path="checkout" element={<CheckoutPage />} />
                            <Route path="favoritos" element={<WishlistPage />} />
                            <Route path="politica-privacidade" element={<PolicyPage type="privacidade" />} />
                            <Route path="politica-entrega" element={<PolicyPage type="entrega" />} />
                            <Route path="trocas" element={<PolicyPage type="trocas" />} />
                            <Route path="login" element={<LoginPage />} />
                            <Route path="registar" element={<RegisterPage />} />
                            <Route path="recuperar-password" element={<ForgotPasswordPage />} />
                            <Route path="atualizar-password" element={<UpdatePasswordPage />} />
                            <Route path="perfil" element={<ProfilePage />} />
                        </Route>

                        <Route path="admin" element={<AdminGuard />}>
                            <Route element={<AdminLayoutPage />}>
                                <Route index element={<AdminDashboardPage />} />
                                <Route path="produtos" element={<AdminProductsPage />} />
                                <Route path="pedidos" element={<AdminOrdersPage />} />
                                <Route path="banners" element={<AdminBannersPage />} />
                                <Route path="usuarios" element={<AdminUsersPage />} />
                                <Route path="configuracoes" element={<AdminSettingsPage />} />
                                <Route path="analytics" element={<AdminAnalytics />} />
                            </Route>
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
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
        <HelmetProvider>
            <StoreProvider>
                <CartProvider>
                    <ToastProvider>
                        <AuthProvider>
                            <WishlistProvider>
                                <AppContent />
                            </WishlistProvider>
                        </AuthProvider>
                    </ToastProvider>
                </CartProvider>
            </StoreProvider>
        </HelmetProvider>
    );
}
