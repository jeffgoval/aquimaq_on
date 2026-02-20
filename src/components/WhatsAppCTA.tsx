import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';

const WhatsAppCTA: React.FC = () => {
  const { settings } = useStore();
  const whatsappNumber = settings?.phone?.replace(/\D/g, '') ?? import.meta.env.VITE_WHATSAPP_NUMBER ?? '';

  const handleClick = () => {
    if (!whatsappNumber) return;
    const message = encodeURIComponent("Olá! Estou no site da Aquimaq e preciso de ajuda.");
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  if (!whatsappNumber) return null;

  return (
    <button
      onClick={handleClick}
      aria-label="Falar no WhatsApp"
      className="fixed bottom-6 right-6 z-50 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-105 flex items-center justify-center group"
    >
      <MessageCircle size={32} />
      <span className="absolute right-full mr-3 bg-white text-green-800 px-3 py-1 rounded shadow-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-medium">
        Falar com Especialista
      </span>
    </button>
  );
};

export default WhatsAppCTA;
