import React, { createContext, useContext } from 'react';
import { Helmet } from 'react-helmet-async';
import { useStoreSettings, StoreSettings } from '@/hooks/useStoreSettings';

interface StoreContextValue {
    settings: StoreSettings | null;
    isLoading: boolean;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { settings, isLoading } = useStoreSettings();

    const favicon = settings?.logoUrl ?? '/logo%20aquimaq.png';
    const storeName = settings?.storeName ?? 'Aquimaq';

    const organizationSchema = settings ? {
        "@context": "https://schema.org",
        "@type": ["LocalBusiness", "Store"],
        "name": settings.storeName,
        ...(settings.razaoSocial && { "legalName": settings.razaoSocial }),
        ...(settings.cnpj && { "taxID": settings.cnpj }),
        "url": "https://aquimaq.com.br",
        ...(settings.logoUrl && { "logo": settings.logoUrl, "image": settings.logoUrl }),
        ...(settings.description && { "description": settings.description }),
        "email": settings.email,
        "telephone": settings.phone,
        ...(settings.address?.city && {
            "address": {
                "@type": "PostalAddress",
                "streetAddress": [settings.address.street, settings.address.number].filter(Boolean).join(', '),
                "addressLocality": settings.address.city,
                "addressRegion": settings.address.state,
                "postalCode": settings.address.zip,
                "addressCountry": "BR"
            }
        }),
        ...(settings.openingHours && { "openingHours": settings.openingHours }),
        "sameAs": [
            settings.socialMedia?.instagram,
            settings.socialMedia?.facebook,
            settings.socialMedia?.youtube,
        ].filter(Boolean),
        "priceRange": "$$",
        "currenciesAccepted": "BRL",
        "paymentAccepted": "Cartão de crédito, Boleto, PIX",
        "areaServed": "BR",
    } : null;

    return (
        <StoreContext.Provider value={{ settings, isLoading }}>
            <Helmet>
                <title>{storeName}</title>
                <link rel="icon" href={favicon} />
                <link rel="apple-touch-icon" href={favicon} />
                <meta property="og:image" content={settings?.logoUrl ?? '/logo%20aquimaq.png'} />
                <meta name="twitter:image" content={settings?.logoUrl ?? '/logo%20aquimaq.png'} />
                {organizationSchema && (
                    <script type="application/ld+json">
                        {JSON.stringify(organizationSchema)}
                    </script>
                )}
            </Helmet>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useStore must be used within StoreProvider');
    }
    return context;
};

