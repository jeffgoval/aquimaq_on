import { ReactNode } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { StoreProvider } from '../contexts/StoreContext';
import { CartProvider } from '@/features/cart';
import { ToastProvider } from '../contexts/ToastContext';
import { AuthProvider } from '../contexts/AuthContext';
import { WishlistProvider } from '../contexts/WishlistContext';

type ProviderComponent = React.ComponentType<{ children: ReactNode }>;

/**
 * Composition de Providers: evita aninhamento profundo (Provider Hell).
 * Ordem = exterior → interior: HelmetProvider envolve tudo, WishlistProvider fica mais próximo de children.
 */
function composeProviders(...providers: ProviderComponent[]) {
    return ({ children }: { children: ReactNode }) =>
        providers.reduceRight<React.ReactNode>(
            (acc, Provider) => <Provider>{acc}</Provider>,
            children
        );
}

export const AppProviders = composeProviders(
    HelmetProvider,
    StoreProvider,
    CartProvider,
    ToastProvider,
    AuthProvider,
    WishlistProvider
);
