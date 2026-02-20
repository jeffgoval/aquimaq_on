import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Product } from '@/types';

interface ProductSEOProps {
    product: Product;
}

const ProductSEO: React.FC<ProductSEOProps> = ({ product }) => {
    // Schema.org structured data for Google Rich Snippets
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    const galleryImages = product.gallery
        ? [product.imageUrl, ...product.gallery]
        : [product.imageUrl];

    const schemaData = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "image": galleryImages,
        "description": product.description,
        "brand": {
            "@type": "Brand",
            "name": product.brand || "Aquimaq"
        },
        "offers": {
            "@type": "Offer",
            "url": window.location.href,
            "priceCurrency": "BRL",
            "price": product.price,
            "availability": (product.stock && product.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "priceValidUntil": nextYear.toISOString().split('T')[0],
            "itemCondition": "https://schema.org/NewCondition"
        },
        "aggregateRating": product.rating ? {
            "@type": "AggregateRating",
            "ratingValue": product.rating,
            "reviewCount": product.reviewCount || 1,
            "bestRating": "5",
            "worstRating": "1"
        } : undefined
    };

    return (
        <Helmet>
            {/* Primary SEO Tags */}
            <title>{`${product.name} | Melhor Preço na Aquimaq`}</title>
            <meta name="title" content={`${product.name} | Aquimaq`} />
            <meta name="description" content={`Compre ${product.name} na Aquimaq. ${product.description ? product.description.substring(0, 150) : ''}... Frete Grátis e Parcelamento em até 10x.`} />
            <link rel="canonical" href={window.location.href.split('?')[0]} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="product" />
            <meta property="og:url" content={window.location.href} />
            <meta property="og:title" content={`${product.name} | Aquimaq`} />
            <meta property="og:description" content={product.description?.substring(0, 200)} />
            <meta property="og:image" content={product.imageUrl} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={window.location.href} />
            <meta property="twitter:title" content={`${product.name} | Aquimaq`} />
            <meta property="twitter:description" content={product.description?.substring(0, 200)} />
            <meta property="twitter:image" content={product.imageUrl} />

            {/* Structured Data (JSON-LD) */}
            <script type="application/ld+json">
                {JSON.stringify(schemaData)}
            </script>
        </Helmet>
    );
};

export default ProductSEO;
