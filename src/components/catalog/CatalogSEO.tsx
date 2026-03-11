import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ProductCategory } from '@/types';

interface CatalogSEOProps {
    title: string;
    query: string;
    category: ProductCategory | 'ALL';
}

const getDescription = (query: string, category: ProductCategory | 'ALL'): string => {
    if (query) return `Resultados para "${query}" na Aquimaq â€” defensivos, sementes, ferramentas e insumos agrÃ­colas com entrega para todo o Brasil.`;
    if (category !== 'ALL') return `Compre ${category} com o melhor preÃ§o na Aquimaq. Entrega rÃ¡pida e parcelamento em atÃ© 12x para produtores rurais.`;
    return 'Aquimaq â€” ferramentas, defensivos, sementes e insumos agrÃ­colas com o melhor preÃ§o. Frete rÃ¡pido e parcelamento em atÃ© 12x para todo o Brasil.';
};

/** Canonical para pÃ¡ginas de categoria preserva o parÃ¢metro ?category=
 *  para que cada categoria seja indexada individualmente.
 *  PÃ¡ginas de busca usam noindex + canonical sem parÃ¢metros.
 */
const buildCanonical = (query: string, category: ProductCategory | 'ALL'): string => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin + window.location.pathname;
    if (query) return base; // busca â†’ canonical limpo, noindex abaixo
    if (category !== 'ALL') return `${base}?category=${encodeURIComponent(category)}`;
    return base;
};

export const CatalogSEO: React.FC<CatalogSEOProps> = ({ title, query, category }) => {
    const canonicalUrl = buildCanonical(query, category);
    const description = getDescription(query, category);

    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
            {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
            {query && <meta name="robots" content="noindex, follow" />}
        </Helmet>
    );
};
