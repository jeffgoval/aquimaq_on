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

    return (
        <StoreContext.Provider value={{ settings, isLoading }}>
            <Helmet>
                <title>{storeName}</title>
                <link rel="icon" href={favicon} />
                <link rel="apple-touch-icon" href={favicon} />
                <meta property="og:image" content={settings?.logoUrl ?? '/logo%20aquimaq.png'} />
                <meta name="twitter:image" content={settings?.logoUrl ?? '/logo%20aquimaq.png'} />
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

