import { ReactNode } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { StoreProvider } from '../contexts/StoreContext';
import { CartProvider } from '@/features/cart';
import { ToastProvider } from '../contexts/ToastContext';
import { AuthProvider } from '../contexts/AuthContext';
import { WishlistProvider } from '../contexts/WishlistContext';

export const AppProviders = ({ children }: { children: ReactNode }) => (
    <HelmetProvider>
        <StoreProvider>
            <CartProvider>
                <ToastProvider>
                    <AuthProvider>
                        <WishlistProvider>
                            {children}
                        </WishlistProvider>
                    </AuthProvider>
                </ToastProvider>
            </CartProvider>
        </StoreProvider>
    </HelmetProvider>
);
