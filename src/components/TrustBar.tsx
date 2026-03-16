import React, { useState, useEffect } from 'react';
import { Truck, ShieldCheck, CreditCard } from 'lucide-react';

const TrustBar: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const benefits = [
        {
            icon: <Truck size={22} className="text-agro-400" />,
            title: "Enviamos para todo o Brasil",
            subtitle: "Consulte prazos e taxas",
        },
        {
            icon: <CreditCard size={22} className="text-agro-400" />,
            title: "5% OFF no Pix",
            subtitle: "Pagamento instantâneo",
        },
        {
            icon: <ShieldCheck size={22} className="text-agro-400" />,
            title: "Compra 100% Segura",
            subtitle: "Seus dados protegidos",
        },
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % benefits.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [benefits.length]);

    return (
        <div className="bg-agro-900 grain-overlay">
            <div className="max-w-7xl mx-auto px-4 py-3.5">
                {/* Desktop */}
                <div className="hidden md:flex justify-between items-center">
                    {benefits.map((benefit, index) => (
                        <React.Fragment key={index}>
                            <div className="flex items-center gap-3 group cursor-default">
                                <div className="p-2 bg-agro-800 rounded-lg group-hover:bg-agro-700 transition-colors shrink-0">
                                    {benefit.icon}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-white leading-tight">
                                        {benefit.title}
                                    </span>
                                    <span className="text-xs text-agro-300 mt-0.5">
                                        {benefit.subtitle}
                                    </span>
                                </div>
                            </div>
                            {index < benefits.length - 1 && (
                                <div className="w-px h-8 bg-agro-700" />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Mobile */}
                <div className="md:hidden">
                    <div className="flex items-center justify-center gap-3 min-h-[52px]">
                        <div className="p-2 bg-agro-800 rounded-lg shrink-0">
                            {benefits[currentIndex].icon}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white leading-tight">
                                {benefits[currentIndex].title}
                            </span>
                            <span className="text-xs text-agro-300 mt-0.5">
                                {benefits[currentIndex].subtitle}
                            </span>
                        </div>
                    </div>
                    <div className="flex justify-center gap-1.5 mt-2">
                        {benefits.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`h-1 rounded-full transition-all ${
                                    index === currentIndex
                                        ? 'w-6 bg-agro-400'
                                        : 'w-1.5 bg-agro-700 hover:bg-agro-600'
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
