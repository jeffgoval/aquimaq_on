import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { getActiveBanners } from '@/services/bannerService';
import { useStore } from '@/contexts/StoreContext';

const SLIDE_INTERVAL_MS = 5000;

const HeroBannerSkeleton: React.FC = () => (
    <div className="relative bg-gray-200 animate-pulse h-[400px] md:h-[480px]" aria-hidden />
);

const HeroBanner: React.FC = () => {
    const { settings } = useStore();
    const [banners, setBanners] = useState<Awaited<ReturnType<typeof getActiveBanners>>>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);
    const isPausedRef = useRef(false);
    const touchStartXRef = useRef<number | null>(null);

    useEffect(() => {
        getActiveBanners()
            .then((data) => { if (data?.length) setBanners(data); })
            .catch((err) => console.error('Error loading banners:', err))
            .finally(() => setLoading(false));
    }, []);

    // Auto-advance slides — pauses when isPausedRef is true
    useEffect(() => {
        if (banners.length <= 1) return;
        const interval = setInterval(() => {
            if (!isPausedRef.current) {
                setCurrentSlide((prev) => (prev + 1) % banners.length);
            }
        }, SLIDE_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [banners.length]);

    const goToSlide = (index: number) => setCurrentSlide(index);
    const goToPrev = useCallback(() => setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length), [banners.length]);
    const goToNext = useCallback(() => setCurrentSlide((prev) => (prev + 1) % banners.length), [banners.length]);

    // Touch swipe handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartXRef.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartXRef.current === null) return;
        const diff = touchStartXRef.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            diff > 0 ? goToNext() : goToPrev();
        }
        touchStartXRef.current = null;
    };

    const whatsappNumber = (settings?.whatsapp || settings?.phone || '').replace(/\D/g, '');
    const whatsappHref = whatsappNumber
        ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Olá, vim pelo site e gostaria de falar com um consultor!')}`
        : null;

    if (loading) return <HeroBannerSkeleton />;
    if (banners.length === 0) return null;

    return (
        <div
            className="relative bg-gray-100 group"
            onMouseEnter={() => { isPausedRef.current = true; }}
            onMouseLeave={() => { isPausedRef.current = false; }}
        >
            <div
                className="max-w-[1920px] mx-auto relative overflow-hidden h-[400px] md:h-[480px]"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Slides */}
                {banners.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
                        aria-hidden={index !== currentSlide}
                    >
                        {/* Background */}
                        <div className="absolute inset-0">
                            <div
                                className="w-full h-full bg-cover bg-center bg-no-repeat"
                                style={{ backgroundImage: `url(${slide.image_url})` }}
                                role="img"
                                aria-label={slide.title}
                            />
                            <div className={`absolute inset-0 bg-gradient-to-r ${slide.color_gradient || 'from-agro-900 to-agro-800'} opacity-90 md:opacity-80 mix-blend-multiply`} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
                            <div className="max-w-xl text-white py-12">
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 shadow-sm">
                                    {slide.title}
                                </h2>
                                {slide.subtitle && (
                                    <p className="text-lg md:text-xl text-gray-100 mb-8 font-medium leading-relaxed max-w-lg">
                                        {slide.subtitle}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-4">
                                    {slide.cta_text && (
                                        slide.cta_link ? (
                                            <Link
                                                to={slide.cta_link}
                                                className="px-8 py-3.5 bg-agro-500 hover:bg-agro-600 text-white font-bold text-lg rounded-lg shadow-lg shadow-agro-600/30 transition-all transform hover:-translate-y-1 inline-flex items-center"
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
                                    {whatsappHref && (
                                        <a
                                            href={whatsappHref}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-8 py-3.5 bg-white hover:bg-gray-50 text-gray-900 font-bold text-lg rounded-lg shadow-lg transition-all transform hover:-translate-y-1 inline-flex items-center gap-2"
                                        >
                                            <MessageCircle size={20} />
                                            Falar com Consultor
                                        </a>
                                    )}
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
                            aria-label="Slide anterior"
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-sm transition-colors hidden md:flex items-center justify-center"
                        >
                            <ChevronLeft size={32} />
                        </button>
                        <button
                            onClick={goToNext}
                            aria-label="Próximo slide"
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-sm transition-colors hidden md:flex items-center justify-center"
                        >
                            <ChevronRight size={32} />
                        </button>
                    </>
                )}

                {/* Dots */}
                {banners.length > 1 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                aria-label={`Ir para slide ${index + 1}`}
                                className={`h-2 rounded-full transition-all ${index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white'}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HeroBanner;
