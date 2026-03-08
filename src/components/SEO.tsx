import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
    type?: 'website' | 'article' | 'product';
    image?: string;
    url?: string;
    canonical?: string;
    children?: React.ReactNode;
}

const DEFAULT_DESCRIPTION = 'Aquimaq - Sua parceira no campo. Ferramentas, peças e insumos com o melhor preço. Entrega rápida para todo o Brasil.';
const DEFAULT_IMAGE = import.meta.env.VITE_OG_IMAGE ?? '';

const SEO: React.FC<SEOProps> = ({
    title,
    description = DEFAULT_DESCRIPTION,
    type = 'website',
    image = DEFAULT_IMAGE,
    url = typeof window !== 'undefined' ? window.location.href : '',
    canonical,
    children
}) => {
    const siteTitle = title.includes('Aquimaq') ? title : `${title} | Aquimaq`;
    const canonicalUrl = canonical || (typeof window !== 'undefined' ? window.location.href.split('?')[0] : '');

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{siteTitle}</title>
            <meta name="description" content={description} />
            {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

            {/* Open Graph */}
            <meta property="og:type" content={type} />
            <meta property="og:site_name" content="Aquimaq" />
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={description} />
            {image && <meta property="og:image" content={image} />}
            <meta property="og:url" content={url} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={siteTitle} />
            <meta name="twitter:description" content={description} />
            {image && <meta name="twitter:image" content={image} />}

            {/* Additional Tags (JSON-LD, etc) */}
            {children}
        </Helmet>
    );
};

export default SEO;
