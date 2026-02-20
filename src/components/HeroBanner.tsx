import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/services/supabase';

interface Banner {
    id: string;
    title: string;
    subtitle: string | null;
    image_url: string;
    cta_text: string | null;
    cta_link: string | null;
    color_gradient: string;
}

const HeroBanner: React.FC = () => {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBanners();
    }, []);

    // Auto-advance slides
    useEffect(() => {
        if (banners.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % banners.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [banners.length]);

    const loadBanners = async () => {
        try {
            const now = new Date().toISOString();
            // Query for active banners that are within the date range or have no dates set (always active).
            // Note: Chaining .or() filters adds them as AND clauses to the query.
            // (starts_at is null OR <= now) AND (ends_at is null OR >= now)
            const { data, error } = await supabase
                .from('banners')
                .select('*')
                .eq('is_active', true)
                .or(`starts_at.is.null,starts_at.lte."${now}"`)
                .or(`ends_at.is.null,ends_at.gte."${now}"`)
                .order('position', { ascending: true });

            if (error) {
                console.error('Error loading banners:', error);
                return;
            }

            if (data?.length) setBanners(data);
        } catch (err) {
            console.error('Error loading banners:', err);
        } finally {
            setLoading(false);
        }
    };

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
    };

    const goToPrev = () => {
        setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
    };

    const goToNext = () => {
        setCurrentSlide((prev) => (prev + 1) % banners.length);
    };

    if (!loading && banners.length === 0) return null;

    return (
        <div className="relative bg-gray-100 group">
            <div className="max-w-[1920px] mx-auto relative overflow-hidden h-[400px] md:h-[480px]">

                {/* Slides */}
                {banners.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                            }`}
                    >
                        {/* Background Image (original: background-image) */}
                        <div className="absolute inset-0">
                            <div
                                className="w-full h-full bg-cover bg-center bg-no-repeat"
                                style={{ backgroundImage: `url(${slide.image_url})` }}
                                role="img"
                                aria-label={slide.title}
                            />
                            {/* Gradient Overlay — original hero */}
                            <div className={`absolute inset-0 bg-gradient-to-r ${slide.color_gradient || 'from-agro-900 to-agro-800'} opacity-90 md:opacity-80 mix-blend-multiply`} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        </div>

                        {/* Content Container */}
                        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
                            <div className="max-w-xl text-white py-12">
                                <span className="inline-block py-1 px-3 rounded-md bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in">
                                    Destaque da Semana
                                </span>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 shadow-sm">
                                    {slide.title}
                                </h1>
                                {slide.subtitle && (
                                    <p className="text-lg md:text-xl text-gray-100 mb-8 font-medium leading-relaxed max-w-lg shadow-sm">
                                        {slide.subtitle}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-4">
                                    {slide.cta_text && (
                                        slide.cta_link ? (
                                            <Link
                                                to={slide.cta_link}
                                                className="px-8 py-3.5 bg-agro-500 hover:bg-agro-600 text-white font-bold text-lg rounded-lg shadow-lg shadow-agro-600/30 transition-all transform hover:-translate-y-1 flex items-center inline-flex"
                                            >
                                                {slide.cta_text}
                                                <ArrowRight className="ml-2 h-5 w-5" />
                                            </Link>
                                        ) : (
                                            <button className="px-8 py-3.5 bg-agro-500 hover:bg-agro-600 text-white font-bold text-lg rounded-lg shadow-lg shadow-agro-600/30 transition-all transform hover:-translate-y-1 flex items-center">
                                                {slide.cta_text}
                                                <ArrowRight className="ml-2 h-5 w-5" />
                                            </button>
                                        )
                                    )}
                                    <Link
                                        to="/#contato"
                                        className="px-8 py-3.5 bg-white hover:bg-gray-50 text-gray-900 font-bold text-lg rounded-lg shadow-lg transition-all transform hover:-translate-y-1 inline-flex items-center"
                                    >
                                        Falar com Consultor
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Navigation Arrows */}
                {banners.length > 1 && (
                    <>
                        <button
                            onClick={goToPrev}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors hidden md:block"
                        >
                            <ChevronLeft size={32} />
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors hidden md:block"
                        >
                            <ChevronRight size={32} />
                        </button>
                    </>
                )}

                {/* Dots */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`h-2 rounded-full transition-all ${index === currentSlide
                                ? 'w-8 bg-white'
                                : 'w-2 bg-white/50 hover:bg-white'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Quick Benefits Bar */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start space-x-3">
                            <div className="bg-agro-50 p-2 rounded-full text-agro-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold text-sm text-gray-900">Compra Segura</p>
                                <p className="text-xs text-gray-500">Certificada</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-center md:justify-start space-x-3">
                            <div className="bg-agro-50 p-2 rounded-full text-agro-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold text-sm text-gray-900">Frete Grátis</p>
                                <p className="text-xs text-gray-500">Consulte região</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-center md:justify-start space-x-3">
                            <div className="bg-agro-50 p-2 rounded-full text-agro-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold text-sm text-gray-900">Parcele Sem Juros</p>
                                <p className="text-xs text-gray-500">Até 12x no cartão</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-center md:justify-start space-x-3">
                            <div className="bg-agro-50 p-2 rounded-full text-agro-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold text-sm text-gray-900">Suporte Técnico</p>
                                <p className="text-xs text-gray-500">Engenheiros Agrônomos</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroBanner;

