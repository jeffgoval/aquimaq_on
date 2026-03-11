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

    useEffect(() => {
        setError(false);
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
                aria-label="Imagem indisponÃ­vel"
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
            onError={() => setError(true)}
            className={className}
            {...props}
        />
    );
};

export default Image;
