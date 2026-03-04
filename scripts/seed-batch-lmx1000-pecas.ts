/**
 * Seed batch: 4 peças LMX1000
 * - Flange interna para transmissão Nakashi 26
 * - Virabrequim para Husqvarna 226
 * - Reparo do carburador Tillotson
 * - Sabre 20" 3/8 ponta rolante
 *
 * Uso:
 *   npx tsx scripts/seed-batch-lmx1000-pecas.ts
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltam variáveis de ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BUCKET = 'product-images';

async function downloadAndUpload(url: string, filename: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao baixar imagem: HTTP ${res.status} — ${url}`);
  const uint8 = new Uint8Array(await res.arrayBuffer());

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, uint8, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: true });

  if (error) throw new Error(`Erro no upload: ${error.message}`);

  return supabase.storage.from(BUCKET).getPublicUrl(filename).data.publicUrl;
}

const items = [
  {
    externalImage: 'https://cdn.awsli.com.br/2500x2500/1846/1846849/produto/97635204/af97aba775.jpg',
    imageFilename: 'flange-interna-lmx1000-nakashi-26.jpg',
    product: {
      name: 'Flange Interna LMX1000 para Transmissão Nakashi 26',
      slug: 'flange-interna-lmx1000-transmissao-nakashi-26',
      description:
        'Flange interna para transmissão (original) marca LMX1000 compatível com máquinas Nakashi 26. ' +
        'Peça de reposição para manutenção do sistema de transmissão.',
      price: 31.90,
      stock: 10,
      weight: 0.060,
      width: 6.0,
      height: 1.0,
      length: 6.0,
      technical_specs: JSON.stringify({
        'Marca': 'LMX1000',
        'Código': '3729',
        'Compatibilidade': 'Nakashi 26',
        'Peso': '0,060 kg',
        'Largura': '6,0 cm',
        'Profundidade': '6,0 cm',
        'Altura': '1,0 cm',
        'Tipo': 'Flange interna de transmissão',
      }),
      seo_title: 'Flange Interna LMX1000 para Transmissão Nakashi 26 | Aquimaq',
      seo_description: 'Flange interna LMX1000 para transmissão Nakashi 26. Peça original de reposição. Compre na Aquimaq.',
    },
  },
  {
    externalImage: 'https://cdn.awsli.com.br/2500x2500/1846/1846849/produto/97632850/8af42dbe9a.jpg',
    imageFilename: 'virabrequim-lmx1000-husqvarna-226.jpg',
    product: {
      name: 'Virabrequim LMX1000 para Husqvarna 226',
      slug: 'virabrequim-lmx1000-husqvarna-226',
      description:
        'Virabrequim marca LMX1000 compatível com máquinas Husqvarna 226. ' +
        'Peça de reposição para manutenção do motor de roçadeiras a gasolina.',
      price: 96.80,
      stock: 10,
      weight: 0.235,
      width: 14.0,
      height: 10.0,
      length: 8.0,
      technical_specs: JSON.stringify({
        'Marca': 'LMX1000',
        'Código': '5957',
        'Compatibilidade': 'Husqvarna 226',
        'Peso': '0,235 kg',
        'Largura': '14,0 cm',
        'Profundidade': '8,0 cm',
        'Altura': '10,0 cm',
        'Tipo': 'Virabrequim',
      }),
      seo_title: 'Virabrequim LMX1000 para Husqvarna 226 | Aquimaq',
      seo_description: 'Virabrequim LMX1000 compatível com Husqvarna 226. Peça de reposição para roçadeiras a gasolina. Compre na Aquimaq.',
    },
  },
  {
    externalImage: 'https://cdn.awsli.com.br/2500x2500/1846/1846849/produto/96377189/63d83c9f34.jpg',
    imageFilename: 'reparo-carburador-tillotson-lmx1000.jpg',
    product: {
      name: 'Reparo do Carburador Tillotson LMX1000',
      slug: 'reparo-carburador-tillotson-lmx1000',
      description:
        'Reparo do carburador Tillotson marca LMX1000 compatível com motosserras Husqvarna 61 / 268 / 272. ' +
        'Kit de reparo para manutenção e restauração do carburador.',
      price: 24.20,
      stock: 10,
      weight: 0.005,
      width: 5.5,
      height: 1.0,
      length: 4.5,
      technical_specs: JSON.stringify({
        'Marca': 'LMX1000',
        'Código': '1669',
        'Compatibilidade': 'Husqvarna 61 / 268 / 272',
        'Modelo do carburador': 'Tillotson',
        'Peso': '0,005 kg',
        'Largura': '5,5 cm',
        'Profundidade': '4,5 cm',
        'Altura': '1,0 cm',
        'Tipo': 'Reparo de carburador',
      }),
      seo_title: 'Reparo do Carburador Tillotson LMX1000 para Husqvarna 61/268/272 | Aquimaq',
      seo_description: 'Kit de reparo do carburador Tillotson LMX1000 compatível com Husqvarna 61, 268 e 272. Compre na Aquimaq.',
    },
  },
  {
    externalImage: 'https://cdn.awsli.com.br/2500x2500/1846/1846849/produto/95554042/1a8d95ecb5.jpg',
    imageFilename: 'sabre-lmx1000-20pol-38-ponta-rolante.jpg',
    product: {
      name: 'Sabre LMX1000 20" 3/8 Ponta Rolante para LMX1000 / Kawashima / Tekna',
      slug: 'sabre-lmx1000-20-38-ponta-rolante-kawashima-tekna',
      description:
        'Sabre marca LMX1000 compatível com motosserras LMX1000, Kawashima e Tekna. ' +
        'Passo 3/8, tamanho 50 cm (20"), 34 cortantes e espessura de 1,5 mm no pé da corrente.',
      price: 95.00,
      stock: 10,
      weight: 1.060,
      width: 63.0,
      height: 0.2,
      length: 9.0,
      technical_specs: JSON.stringify({
        'Marca': 'LMX1000',
        'Código': '666',
        'Compatibilidade': 'LMX1000 / Kawashima / Tekna',
        'Tamanho': '20" (50 cm)',
        'Passo': '3/8"',
        'Cortantes': '34',
        'Espessura': '1,5 mm',
        'Peso': '1,060 kg',
        'Largura': '63,0 cm',
        'Tipo': 'Sabre com ponta rolante',
      }),
      seo_title: 'Sabre LMX1000 20" 3/8 Ponta Rolante para Kawashima / Tekna | Aquimaq',
      seo_description: 'Sabre LMX1000 20" passo 3/8 com ponta rolante, compatível com motosserras LMX1000, Kawashima e Tekna. Compre na Aquimaq.',
    },
  },
];

async function main() {
  for (const item of items) {
    try {
      console.log(`\n⏳ Processando: ${item.product.name}`);

      const imageUrl = await downloadAndUpload(item.externalImage, item.imageFilename);
      console.log(`   ✅ Imagem: ${imageUrl}`);

      const { data, error } = await supabase
        .from('products')
        .insert({
          ...item.product,
          category: 'Peças e Acessórios',
          brand: 'LMX1000',
          image_url: imageUrl,
          gallery: [imageUrl],
          old_price: null,
          discount: null,
          is_active: true,
          is_new: true,
          is_best_seller: false,
          rating: null,
          review_count: 0,
          wholesale_min_amount: null,
          wholesale_discount_percent: null,
        })
        .select('id, name')
        .single();

      if (error) {
        console.error(`   ❌ Erro ao inserir: ${error.message}`);
        continue;
      }

      console.log(`   ✅ Inserido! ID: ${data.id}`);
    } catch (err: any) {
      console.error(`   ❌ ${err.message}`);
    }
  }

  console.log('\n✅ Batch concluído.');
}

main();
