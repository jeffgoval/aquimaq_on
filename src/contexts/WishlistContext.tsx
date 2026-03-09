import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useToast } from './ToastContext';

interface WishlistContextType {
    wishlist: string[];
    toggleWishlist: (productId: string) => Promise<void>;
    isInWishlist: (productId: string) => boolean;
    loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { showToast } = useToast();
    const [wishlist, setWishlist] = useState<string[]>([]);

    const toggleWishlist = useCallback(async (productId: string) => {
        const isAdded = wishlist.includes(productId);
        setWishlist(prev =>
            isAdded ? prev.filter(id => id !== productId) : [...prev, productId]
        );
        showToast(isAdded ? 'Removido dos favoritos.' : 'Salvo nos favoritos!', isAdded ? 'info' : 'success');
    }, [wishlist, showToast]);

    const isInWishlist = useCallback((productId: string) => wishlist.includes(productId), [wishlist]);

    return (
        <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, loading: false }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) throw new Error('useWishlist must be used within WishlistProvider');
    return context;
};
