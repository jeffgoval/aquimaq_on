import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import ChatWindow from './ChatWindow';

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Chat window */}
            {isOpen && (
                <div
                    className="fixed bottom-20 right-4 z-[9990] w-[370px] h-[520px]
            bg-white rounded-2xl shadow-2xl shadow-black/20
            border border-gray-200
            flex flex-col overflow-hidden
            animate-[slideUp_0.25s_ease-out]
            sm:right-6 sm:bottom-24"
                    style={{ maxHeight: 'calc(100dvh - 120px)' }}
                >
                    <ChatWindow />
                </div>
            )}

            {/* Floating action button */}
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label={isOpen ? 'Fechar chat' : 'Abrir chat'}
                className={`fixed bottom-4 right-4 z-[9991] w-14 h-14
          rounded-full shadow-lg shadow-agro-900/30
          flex items-center justify-center
          transition-all duration-300 ease-out
          sm:right-6 sm:bottom-6
          ${isOpen
                        ? 'bg-gray-700 hover:bg-gray-800 rotate-0'
                        : 'bg-agro-600 hover:bg-agro-700 hover:scale-105'
                    }
          active:scale-95
          text-white`}
            >
                {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
            </button>

            {/* Slide-up animation keyframe (injected once) */}
            <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
        </>
    );
}
