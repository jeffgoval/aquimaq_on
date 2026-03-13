import React from 'react';
import { useStore } from '@/contexts/StoreContext';
import WhatsAppIcon from './ui/WhatsAppIcon';

const FloatingWhatsApp: React.FC = () => {
    const { settings } = useStore();

    const rawNumber = settings?.whatsapp || settings?.phone;
    if (!rawNumber) return null;

    // Remove tudo que não é dígito; adiciona DDI 55 se não estiver presente
    const digits = rawNumber.replace(/\D/g, '');
    const waNumber = digits.startsWith('55') ? digits : `55${digits}`;
    const message = encodeURIComponent('Olá! Vim pelo site e gostaria de tirar uma dúvida.');
    const href = `https://wa.me/${waNumber}?text=${message}`;

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Falar com atendimento pelo WhatsApp"
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] shadow-lg hover:bg-[#20ba59] transition-colors focus:outline-none focus:ring-4 focus:ring-[#25D366]/40"
        >
            {/* Anel de pulso */}
            <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
            <WhatsAppIcon size={28} className="relative text-white" />
        </a>
    );
};

export default FloatingWhatsApp;
