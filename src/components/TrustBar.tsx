import React, { useState, useEffect } from 'react';
import { Truck, ShieldCheck, MessageCircle, CreditCard } from 'lucide-react';

const TrustBar: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const benefits = [
        {
            icon: <Truck size={20} className="text-agro-600" />,
            title: "Enviamos para todo o Brasil",
            subtitle: "Consulte prazos e taxas"
        },
        {
            icon: <CreditCard size={20} className="text-agro-600" />,
            title: "5% OFF no Pix",
            subtitle: "Pagamento instantâneo"
        },
        {
            icon: <ShieldCheck size={20} className="text-agro-600" />,
            title: "Compra 100% Segura",
            subtitle: "Seus dados protegidos"
        },
        {
            icon: <MessageCircle size={20} className="text-agro-600" />,
            title: "Suporte Especializado",
            subtitle: "Atendimento especializado"
        }
    ];

    // Auto-rotate carousel in mobile
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % benefits.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [benefits.length]);

    return (
        <div className="bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 py-4">
                {/* Desktop: Grid */}
                <div className="hidden md:flex justify-between items-center">
                    {benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-3 group hover:opacity-80 transition-opacity cursor-default">
                            <div className="p-2 bg-agro-50 rounded-full group-hover:bg-agro-100 transition-colors">
                                {benefit.icon}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-800 leading-tight">{benefit.title}</span>
                                <span className="text-xs text-gray-500">{benefit.subtitle}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Mobile: Carousel */}
                <div className="md:hidden">
                    <div className="flex items-center justify-center gap-3 min-h-[60px]">
                        <div className="p-2 bg-agro-50 rounded-full">
                            {benefits[currentIndex].icon}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-800 leading-tight">
                                {benefits[currentIndex].title}
                            </span>
                            <span className="text-xs text-gray-500">
                                {benefits[currentIndex].subtitle}
                            </span>
                        </div>
                    </div>

                    {/* Pagination Dots */}
                    <div className="flex justify-center gap-1.5 mt-2">
                        {benefits.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`h-1.5 rounded-full transition-all ${index === currentIndex
                                    ? 'w-6 bg-agro-600'
                                    : 'w-1.5 bg-gray-300'
                                    }`}
                                aria-label={`Ir para benefício ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrustBar;
