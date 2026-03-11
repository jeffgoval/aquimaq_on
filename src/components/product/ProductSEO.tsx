import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Product } from '@/types';
import { useStore } from '@/contexts/StoreContext';

interface ProductSEOProps {
    product: Product;
}

const ProductSEO: React.FC<ProductSEOProps> = ({ product }) => {
    const { settings } = useStore();
    const maxInstallments = settings?.maxInstallments ?? 12;
    // Schema.org structured data for Google Rich Snippets
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    const galleryImages = product.gallery
        ? [product.imageUrl, ...product.gallery]
        : [product.imageUrl];

    const canonicalUrl = window.location.href.split('?')[0];
    const origin = window.location.origin;

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
            "url": canonicalUrl,
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

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "InÃ­cio",
                "item": origin + "/"
            },
            ...(product.category ? [{
                "@type": "ListItem",
                "position": 2,
                "name": product.category,
                "item": `${origin}/?category=${encodeURIComponent(product.category)}`
            }] : []),
            {
                "@type": "ListItem",
                "position": product.category ? 3 : 2,
                "name": product.name,
                "item": canonicalUrl
            }
        ]
    };

    const descriptionText = `Compre ${product.name} na Aquimaq. ${product.description ? product.description.substring(0, 130) : ''}. Frete rÃ¡pido e parcelamento em atÃ© ${maxInstallments}x.`;

    return (
        <Helmet>
            {/* Primary SEO Tags */}
            <title>{`${product.name} | Melhor PreÃ§o na Aquimaq`}</title>
            <meta name="description" content={descriptionText} />
            <link rel="canonical" href={canonicalUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="product" />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:title" content={`${product.name} | Aquimaq`} />
            <meta property="og:description" content={product.description?.substring(0, 200)} />
            <meta property="og:image" content={product.imageUrl} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={canonicalUrl} />
            <meta property="twitter:title" content={`${product.name} | Aquimaq`} />
            <meta property="twitter:description" content={product.description?.substring(0, 200)} />
            <meta property="twitter:image" content={product.imageUrl} />

            {/* Structured Data â€” Product */}
            <script type="application/ld+json">
                {JSON.stringify(schemaData)}
            </script>

            {/* Structured Data â€” BreadcrumbList */}
            <script type="application/ld+json">
                {JSON.stringify(breadcrumbSchema)}
            </script>
        </Helmet>
    );
};

export default ProductSEO;
