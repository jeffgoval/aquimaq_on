import type { IncomingMessage, ServerResponse } from 'node:http';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';
const SITE_URL = 'https://aquimaq.com.br';

/** Páginas estáticas indexáveis (sem /admin, /conta, /carrinho, etc.) */
const STATIC_PAGES = [
    { loc: '/',                       changefreq: 'daily',   priority: '1.0' },
    { loc: '/sobre',                  changefreq: 'monthly', priority: '0.7' },
    { loc: '/faq',                    changefreq: 'monthly', priority: '0.7' },
    { loc: '/contato',                changefreq: 'monthly', priority: '0.6' },
    { loc: '/trabalhe-conosco',       changefreq: 'monthly', priority: '0.5' },
    { loc: '/politica-privacidade',   changefreq: 'yearly',  priority: '0.3' },
    { loc: '/politica-entrega',       changefreq: 'yearly',  priority: '0.3' },
    { loc: '/trocas',                 changefreq: 'yearly',  priority: '0.3' },
];

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function toDate(iso: string): string {
    return iso.split('T')[0];
}

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/products?select=id,updated_at&is_active=eq.true&order=updated_at.desc`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Supabase error: ${response.status}`);
        }

        const products = await response.json() as Array<{ id: string; updated_at: string }>;

        const today = new Date().toISOString().split('T')[0];

        const staticXml = STATIC_PAGES.map(p => `
  <url>
    <loc>${SITE_URL}${escapeXml(p.loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('');

        const productsXml = products.map(p => `
  <url>
    <loc>${SITE_URL}/produto/${escapeXml(p.id)}</loc>
    <lastmod>${toDate(p.updated_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticXml}${productsXml}
</urlset>`;

        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
        res.statusCode = 200;
        res.end(xml);
    } catch (err) {
        console.error('Sitemap generation error:', err);
        res.statusCode = 500;
        res.end('Error generating sitemap');
    }
}
