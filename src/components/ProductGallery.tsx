import React, { useState, useEffect, useRef } from 'react';
import Image from './Image';
import { getOptimizedUrl, buildSrcSet } from '@/services/imageUtils';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

const ProductGallery: React.FC<ProductGalleryProps> = ({ images, productName }) => {
  const [selectedImage, setSelectedImage] = useState<string | undefined>(images[0]);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedImage(images.length > 0 ? images[0] : undefined);
  }, [images]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-80 bg-white flex items-center justify-center text-gray-400">
        Sem Imagem
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Main Image — LCP: eager + fetchPriority=high + srcSet responsivo */}
      <div
        ref={containerRef}
        className="w-full h-[320px] sm:h-[420px] lg:h-[500px] rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden p-4 sm:p-6 cursor-zoom-in"
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => { setZoomed(false); setOrigin('50% 50%'); }}
        onMouseMove={handleMouseMove}
      >
        <Image
          src={getOptimizedUrl(selectedImage ?? '', { width: 800, quality: 85 })}
          srcSet={buildSrcSet(selectedImage ?? '')}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 500px"
          alt={productName}
          loading="eager"
          fetchPriority="high"
          decoding="sync"
          className="w-full h-full object-contain pointer-events-none"
          style={{
            transform: zoomed ? 'scale(2)' : 'scale(1)',
            transformOrigin: origin,
            transition: zoomed ? 'transform 0.1s ease-out' : 'transform 0.3s ease-out',
          }}
        />
      </div>

      {/* Thumbnails — lazy, tamanho fixo 160px (2× para retina) */}
      {images.length > 1 && (
        <div className="flex overflow-x-auto gap-2 p-4 scrollbar-hide">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(img)}
              className={`
                w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all bg-gray-50
                ${selectedImage === img
                  ? 'border-agro-600 shadow-sm opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-300'}
              `}
            >
              <Image
                src={getOptimizedUrl(img, { width: 160, quality: 70 })}
                alt={`${productName} - Vista ${idx + 1}`}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
