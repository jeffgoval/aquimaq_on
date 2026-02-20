import React, { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallbackSrc?: string;
}

/**
 * Enhanced Image component with:
 * - Lazy loading by default
 * - Error handling with fallback UI
 * - Fade-in transition on load
 */
const Image: React.FC<ImageProps> = ({
    src,
    alt,
    className,
    loading = 'lazy',
    fallbackSrc,
    srcSet,
    sizes,
    ...props
}) => {
    const [error, setError] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setError(false);
        setLoaded(false);
    }, [src, srcSet]);

    if (error) {
        if (fallbackSrc) {
            // Don't pass srcSet/sizes to fallback as it's likely a single asset
            return (
                <img
                    src={fallbackSrc}
                    alt={alt}
                    className={className}
                    {...props}
                />
            );
        }
        return (
            <div
                className={`bg-gray-100 flex flex-col items-center justify-center text-gray-400 ${className}`}
                aria-label="Imagem indisponível"
            >
                <ImageOff size={24} className="mb-1" />
            </div>
        );
    }

    return (
        <img
            src={src}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            loading={loading}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            className={`
        transition-opacity duration-500 ease-in-out
        ${loaded ? 'opacity-100' : 'opacity-0'}
        ${className}
      `}
            {...props}
        />
    );
};

export default Image;
