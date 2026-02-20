import React, { useMemo, useCallback } from 'react';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppCTA from '@/components/WhatsAppCTA';
import CookieConsent from '@/components/CookieConsent';
import { useCart } from '@/features/cart';
import { ProductCategory } from '@/types';
import { parseCategoryFromUrl } from '@/utils/urlSearch';

const MainLayout: React.FC = () => {
    const { cartItemCount } = useCart();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const searchQuery = searchParams.get('q') ?? '';
    const selectedCategory = useMemo(
        () => parseCategoryFromUrl(searchParams.get('category')),
        [searchParams]
    );

    const onSearchChange = useCallback((query: string) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (query) next.set('q', query);
            else next.delete('q');
            return next;
        });
    }, [setSearchParams]);

    const onCategoryChange = useCallback((category: ProductCategory | 'ALL') => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (category === 'ALL') next.delete('category');
            else next.set('category', category);
            return next;
        });
    }, [setSearchParams]);

    return (
        <div className="min-h-screen bg-gray-50 pb-20" style={{ minHeight: '100vh', backgroundColor: '#f9fafb', paddingBottom: '5rem' }}>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-agro-600 focus:text-white focus:rounded">
                Pular para conteúdo principal
            </a>

            <Header
                cartItemCount={cartItemCount}
                onCategoryReset={() => onCategoryChange('ALL')}
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                selectedCategory={selectedCategory}
                onCategoryChange={onCategoryChange}
            />

            <main id="main-content" role="main">
                <Outlet />
            </main>

            <Footer />
            <WhatsAppCTA />
            <CookieConsent />
        </div>
    );
};

export default MainLayout;
