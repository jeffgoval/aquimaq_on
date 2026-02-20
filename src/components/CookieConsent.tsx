import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const CookieConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        try {
            const consent = localStorage.getItem('aquimaq_cookie_consent');
            if (!consent) setIsVisible(true);
        } catch {
            // Modo privado ou quota excedida
        }
    }, []);

    const handleAccept = () => {
        try {
            localStorage.setItem('aquimaq_cookie_consent', 'true');
            setIsVisible(false);
        } catch {
            setIsVisible(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-lg z-50 animate-slide-in-bottom">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1 text-sm text-gray-300 text-center sm:text-left">
                    <p>
                        Utilizamos cookies para melhorar sua experiência e oferecer ofertas personalizadas,
                        conforme nossa <span className="underline cursor-pointer hover:text-white">Política de Privacidade</span>.
                        Ao continuar, você concorda com nossas condições.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleAccept}
                        className="bg-agro-600 hover:bg-agro-500 text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap"
                    >
                        Aceitar e Fechar
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-1 hover:bg-gray-800 rounded-full transition-colors sm:hidden"
                    >
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;
