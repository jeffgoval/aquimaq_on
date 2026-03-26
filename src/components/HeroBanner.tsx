import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { getActiveBanners } from '@/services/bannerService';
import { useStore } from '@/contexts/StoreContext';

const DEFAULT_SLIDE_INTERVAL_MS = 5000;

const HeroBannerSkeleton: React.FC = () => (
    <div className="relative bg-agro-900/20 animate-pulse h-[420px] md:h-[500px] rounded-b-none" aria-hidden />
);

const HeroBanner: React.FC = () => {
    const navigate = useNavigate();
    const { settings } = useStore();
    const [banners, setBanners] = useState<Awaited<ReturnType<typeof getActiveBanners>>>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);
    const isPausedRef = useRef(false);
    const touchStartXRef = useRef<number | null>(null);
    const slideIntervalMs = settings?.bannerSlideIntervalMs ?? DEFAULT_SLIDE_INTERVAL_MS;

    const seasonalContext = settings?.seasonalContext ?? null;

    useEffect(() => {
        getActiveBanners(seasonalContext)
            .then((data) => {
                if (data?.length) setBanners(data);
            })
            .catch((err) => console.error('Error loading banners:', err))
            .finally(() => setLoading(false));
    }, [seasonalContext]);

    useEffect(() => {
        if (banners.length <= 1) return;
        const interval = setInterval(() => {
            if (!isPausedRef.current) {
                setCurrentSlide((prev) => (prev + 1) % banners.length);
            }
        }, slideIntervalMs);
        return () => clearInterval(interval);
    }, [banners.length, slideIntervalMs]);

    const goToSlide = (index: number) => setCurrentSlide(index);
    const goToPrev = useCallback(
        () => setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length),
        [banners.length]
    );
    const goToNext = useCallback(
        () => setCurrentSlide((prev) => (prev + 1) % banners.length),
        [banners.length]
    );

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

    if (loading) return <HeroBannerSkeleton />;
    if (banners.length === 0) return null;

    return (
        <div
            className="relative bg-agro-900 group mb-10"
            onMouseEnter={() => { isPausedRef.current = true; }}
            onMouseLeave={() => { isPausedRef.current = false; }}
        >
            <div
                className="max-w-[1920px] mx-auto relative overflow-hidden h-[420px] md:h-[500px]"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {banners.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${
                            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                        }`}
                        aria-hidden={index !== currentSlide}
                    >
                        {/* Background image with zoom effect on active */}
                        <div className="absolute inset-0 overflow-hidden">
                            <img
                                src={slide.image_url}
                                alt={slide.title}
                                loading={index === 0 ? 'eager' : 'lazy'}
                                fetchpriority={index === 0 ? 'high' : 'low'}
                                className={`w-full h-full object-cover object-center transition-transform duration-[8000ms] ease-out ${
                                    index === currentSlide ? 'scale-105' : 'scale-100'
                                }`}
                            />
                            {/* Color gradient overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-r ${slide.color_gradient || 'from-agro-900 to-agro-800'} opacity-85 mix-blend-multiply`} />
                            {/* Depth gradient — darker at bottom */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
                            <div className="max-w-xl text-white py-12">
                                <h2 className={`font-display text-4xl md:text-5xl lg:text-6xl leading-tight mb-5 transition-all duration-700 ${
                                    index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                                }`}>
                                    {slide.title}
                                </h2>
                                {slide.subtitle && (
                                    <p className={`text-lg md:text-xl text-gray-200 mb-8 leading-relaxed max-w-lg transition-all duration-700 delay-100 ${
                                        index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                                    }`}>
                                        {slide.subtitle}
                                    </p>
                                )}
                                {slide.cta_text && (
                                    <div className={`transition-all duration-700 delay-200 ${
                                        index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                                    }`}>
                                        {slide.cta_link ? (
                                            slide.cta_link.startsWith('#') ? (
                                                // Scroll anchor — rola suavemente para o elemento
                                                <button
                                                    onClick={() => {
                                                        const el = document.getElementById(slide.cta_link!.slice(1));
                                                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                        else navigate('/');
                                                    }}
                                                    className="inline-flex items-center px-8 py-3.5 bg-earth-500 hover:bg-earth-600 active:scale-95 text-white font-bold text-base rounded-xl shadow-lg shadow-earth-700/30 transition-all"
                                                >
                                                    {slide.cta_text}
                                                    <ArrowRight className="ml-2 h-5 w-5" />
                                                </button>
                                            ) : (
                                                <Link
                                                    to={slide.cta_link}
                                                    className="inline-flex items-center px-8 py-3.5 bg-earth-500 hover:bg-earth-600 active:scale-95 text-white font-bold text-base rounded-xl shadow-lg shadow-earth-700/30 transition-all"
                                                >
                                                    {slide.cta_text}
                                                    <ArrowRight className="ml-2 h-5 w-5" />
                                                </Link>
                                            )
                                        ) : (
                                            <button className="inline-flex items-center px-8 py-3.5 bg-earth-500 hover:bg-earth-600 active:scale-95 text-white font-bold text-base rounded-xl shadow-lg shadow-earth-700/30 transition-all">
                                                {slide.cta_text}
                                                <ArrowRight className="ml-2 h-5 w-5" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Bottom fade into page background */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-earth-50 to-transparent z-20 pointer-events-none" />


                {/* Dot indicators */}
                {banners.length > 1 && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2 z-30">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                aria-label={`Ir para slide ${index + 1}`}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    index === currentSlide ? 'w-8 bg-earth-400' : 'w-2 bg-white/40 hover:bg-white/70'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HeroBanner;
