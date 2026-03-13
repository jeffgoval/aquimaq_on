import React from 'react';
import WhatsAppIcon from './ui/WhatsAppIcon';

// Chatwoot expõe window.$chatwoot após o SDK carregar
declare global {
    interface Window {
        $chatwoot?: { toggle: (state?: 'open' | 'close') => void };
    }
}

const FloatingWhatsApp: React.FC = () => {
    const handleClick = () => {
        window.$chatwoot?.toggle('open');
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            aria-label="Abrir chat de atendimento"
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] shadow-lg hover:bg-[#20ba59] transition-colors focus:outline-none focus:ring-4 focus:ring-[#25D366]/40"
        >
            <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
            <WhatsAppIcon size={28} className="relative text-white" />
        </button>
    );
};

export default FloatingWhatsApp;
