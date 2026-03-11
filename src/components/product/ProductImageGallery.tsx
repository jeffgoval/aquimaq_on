import React from 'react';
import ProductGallery from '../ProductGallery';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

/**
 * Galeria de imagens do produto com fallback de erro (via Image component).
 * Extraído de ProductDetail para manutenção e reuso.
 */
const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ images, productName }) => {
  return <ProductGallery images={images} productName={productName} />;
};

export default ProductImageGallery;
