import React from 'react';
import ProductGallery from '../ProductGallery';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

/**
 * Galeria de imagens do produto com fallback de erro (via Image component).
 * ExtraÃ­do de ProductDetail para manutenÃ§Ã£o e reuso.
 */
const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ images, productName }) => {
  return <ProductGallery images={images} productName={productName} />;
};

export default ProductImageGallery;
