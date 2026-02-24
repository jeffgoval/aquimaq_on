import React, { useState, useEffect } from 'react';
import { Maximize2, X } from 'lucide-react';

import Image from './Image';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

const ProductGallery: React.FC<ProductGalleryProps> = ({ images, productName }) => {
  const [selectedImage, setSelectedImage] = useState<string | undefined>(images[0]);
  const [mainImageError, setMainImageError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
    };
    if (isLightboxOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  // Reset selected image when product changes (detected by checking if current selected is in new array)
  useEffect(() => {
    if (images.length > 0) {
      setSelectedImage(images[0]);
      setMainImageError(false);
    } else {
      setSelectedImage(undefined);
    }
  }, [images]);

  useEffect(() => {
    setMainImageError(false);
  }, [selectedImage]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-80 bg-white flex items-center justify-center text-gray-400">
        Sem Imagem
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Main Image Stage */}
      <div
        className="w-full h-80 md:h-[400px] bg-white border-b border-gray-100 flex items-center justify-center overflow-hidden p-4 relative group cursor-zoom-in"
        onClick={() => setIsLightboxOpen(true)}
      >
        <Image
          src={selectedImage}
          alt={productName}
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1">
          <Maximize2 size={12} /> Ampliar
        </div>
      </div>

      {/* Thumbnails Strip */}
      {images.length > 1 && (
        <div className="flex overflow-x-auto gap-2 p-4 bg-white scrollbar-hide">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(img)}
              className={`
                relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all bg-white
                ${selectedImage === img
                  ? 'border-agro-600 shadow-sm opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-300'}
              `}
            >
              <Image
                src={img}
                alt={`${productName} - Vista ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Overlay */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <button
            onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={32} />
          </button>

          <div className="flex-1 w-full h-full flex items-center justify-center relative">
            <img
              src={selectedImage}
              alt={productName}
              className="max-w-full max-h-full object-contain shadow-2xl"
            />
          </div>

          {/* Lightbox Thumbnails */}
          {images.length > 1 && (
            <div className="flex overflow-x-auto gap-2 p-4 w-full justify-center max-w-4xl">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setSelectedImage(img); }}
                  className={`
                    relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all
                    ${selectedImage === img
                      ? 'border-agro-500 opacity-100 ring-2 ring-agro-500/50'
                      : 'border-white/20 opacity-50 hover:opacity-100 hover:border-white/50'}
                  `}
                >
                  <img
                    src={img}
                    alt={`${productName} - Vista ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;