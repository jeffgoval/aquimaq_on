import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ProductCategory } from '@/types';

interface CatalogSEOProps {
    title: string;
    query: string;
    category: ProductCategory | 'ALL';
}

const getDescription = (query: string, category: ProductCategory | 'ALL'): string => {
    if (query) return `Encontre ${query} na Aquimaq. Ferramentas, sementes, peças e muito mais.`;
    if (category !== 'ALL') return `Encontre ${category} na Aquimaq. Ferramentas, sementes, peças e muito mais.`;
    return 'Encontre os melhores produtos agrícolas na Aquimaq. Ferramentas, sementes, peças e muito mais.';
};

export const CatalogSEO: React.FC<CatalogSEOProps> = ({ title, query, category }) => {
    const canonicalUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';
    const description = getDescription(query, category);

    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={canonicalUrl} />
            {query && <meta name="robots" content="noindex, follow" />}
        </Helmet>
    );
};
