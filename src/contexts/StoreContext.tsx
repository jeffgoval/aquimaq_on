import React, { createContext, useContext } from 'react';
import { useStoreSettings, StoreSettings } from '@/hooks/useStoreSettings';

interface StoreContextValue {
    settings: StoreSettings | null;
    isLoading: boolean;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { settings, isLoading } = useStoreSettings();

    return (
        <StoreContext.Provider value={{ settings, isLoading }}>
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

