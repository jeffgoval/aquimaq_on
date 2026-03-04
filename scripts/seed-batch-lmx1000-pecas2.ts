/**
 * Seed batch 2: 5 peças LMX1000
 * - Filtro de ar completo para roçadeiras 26CC
 * - Arrastador de partida LMX1000 / Husqvarna 226
 * - Disco de vídea para roçadeiras
 * - Tambor de embreagem para Nakashi 26
 * - Manípulo para roçadeiras
 *
 * Uso:
 *   npx tsx scripts/seed-batch-lmx1000-pecas2.ts
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
    externalImage: 'https://cdn.awsli.com.br/2500x2500/1846/1846849/produto/95537097/0939720af3.jpg',
    imageFilename: 'filtro-ar-completo-lmx1000-rocadeiras-26cc.jpg',
    product: {
      name: 'Filtro de Ar Completo LMX1000 para Roçadeiras 26CC',
      slug: 'filtro-ar-completo-lmx1000-rocadeiras-26cc',
      description:
        'Filtro de ar completo marca LMX1000 compatível para uso em roçadeiras 26CC. ' +
        'Peça de reposição para manutenção preventiva do motor.',
      price: 27.10,
      weight: 0.055,
      width: 10.0,
      height: 4.0,
      length: 10.0,
      technical_specs: JSON.stringify({
        'Marca': 'LMX1000',
        'Código': '6122',
        'Compatibilidade': 'Roçadeiras 26CC',
        'Peso': '0,055 kg',
        'Largura': '10,0 cm',
        'Profundidade': '10,0 cm',
        'Altura': '4,0 cm',
        'Tipo': 'Filtro de ar completo',
      }),
      seo_title: 'Filtro de Ar Completo LMX1000 para Roçadeiras 26CC | Aquimaq',
      seo_description: 'Filtro de ar completo LMX1000 para roçadeiras 26CC. Peça de reposição original. Compre na Aquimaq.',
    },
  },
  {
    externalImage: 'https://cdn.awsli.com.br/2500x2500/1846/1846849/produto/94965078/7f7bbbd62e.jpg',
    imageFilename: 'arrastador-partida-lmx1000-husqvarna-226.jpg',
    product: {
      name: 'Arrastador de Partida LMX1000 para Roçadeiras LMX1000 / Husqvarna 226',
      slug: 'arrastador-partida-lmx1000-husqvarna-226',
      description:
        'Arrastador de partida marca LMX1000 para uso em roçadeiras LMX1000 e Husqvarna 226. ' +
        'Peça de reposição do sistema de partida.',
      price: 14.00,
      weight: 0.030,
      width: 5.5,
      height: 1.5,
      length: 3.5,
      technical_specs: JSON.stringify({
        'Marca': 'LMX1000',
        'Código': '3032',
        'Compatibilidade': 'LMX1000 / Husqvarna 226',
        'Peso': '0,030 kg',
        'Largura': '5,5 cm',
        'Profundidade': '3,5 cm',
        'Altura': '1,5 cm',
        'Tipo': 'Arrastador de partida',
      }),
      seo_title: 'Arrastador de Partida LMX1000 para Husqvarna 226 | Aquimaq',
      seo_description: 'Arrastador de partida LMX1000 compatível com roçadeiras LMX1000 e Husqvarna 226. Compre na Aquimaq.',
    },
  },
  {
    externalImage: 'https://cdn.awsli.com.br/2500x2500/1846/1846849/produto/94961048/620008199e.jpg',
    imageFilename: 'disco-videa-lmx1000-rocadeiras-255x40t.jpg',
    product: {
      name: 'Disco de Vídea LMX1000 para Roçadeiras 255 x 25,4 x 40T',
      slug: 'disco-videa-lmx1000-rocadeiras-255-254-40t',
      description:
        'Disco de corte com dentes de vídea marca LMX1000 para uso em roçadeiras. ' +
        'Medida 255 x 25,4 x 40T — alta durabilidade para corte de mato e arbustos.',
      price: 40.40,
      weight: 0.420,
      width: 26.0,
      height: 0.1,
      length: 26.0,
      technical_specs: JSON.stringify({
        'Marca': 'LMX1000',
        'Código': '824',
        'Diâmetro': '255 mm',
        'Furo central': '25,4 mm',
        'Dentes': '40T',
        'Material': 'Vídea',
        'Peso': '0,420 kg',
        'Tipo': 'Disco de corte',
      }),
      seo_title: 'Disco de Vídea LMX1000 255x25,4x40T para Roçadeiras | Aquimaq',
      seo_description: 'Disco de vídea LMX1000 255x25,4x40T para roçadeiras. Alta durabilidade para corte de mato. Compre na Aquimaq.',
    },
  },
  {
    externalImage: 'https://cdn.awsli.com.br/2500x2500/1846/1846849/produto/94956498/89f3d12afc.jpg',
    imageFilename: 'tambor-embreagem-lmx1000-nakashi-26.jpg',
    product: {
      name: 'Tambor de Embreagem LMX1000 para Nakashi 26',
      slug: 'tambor-embreagem-lmx1000-nakashi-26',
      description:
        'Tambor de embreagem marca LMX1000 para máquinas Nakashi modelo 26 com quatro furos TU26 7T. ' +
        'Peça de reposição para manutenção do sistema de embreagem.',
      price: 40.00,
      weight: 0.110,
      width: 7.0,
      height: 7.0,
      length: 7.0,
      technical_specs: JSON.stringify({
        'Marca': 'LMX1000',
        'Código': '3512',
        'Compatibilidade': 'Nakashi 26',
        'Modelo': 'TU26 7T',
        'Furos': '4',
        'Peso': '0,110 kg',
        'Largura': '7,0 cm',
        'Profundidade': '7,0 cm',
        'Altura': '7,0 cm',
        'Tipo': 'Tambor de embreagem',
      }),
      seo_title: 'Tambor de Embreagem LMX1000 para Nakashi 26 | Aquimaq',
      seo_description: 'Tambor de embreagem LMX1000 TU26 7T compatível com Nakashi 26. Peça de reposição original. Compre na Aquimaq.',
    },
  },
  {
    externalImage: 'https://cdn.awsli.com.br/2500x2500/1846/1846849/produto/93424801/03e4007209.jpg',
    imageFilename: 'manipulo-lmx1000-rocadeiras.jpg',
    product: {
      name: 'Manípulo LMX1000 para Roçadeiras',
      slug: 'manipulo-lmx1000-rocadeiras',
      description:
        'Manípulo marca LMX1000 compatível com todos os modelos de roçadeiras. ' +
        'Peça de reposição para manutenção do guidão/manopla.',
      price: 8.00,
      weight: 0.010,
      width: 6.0,
      height: 1.5,
      length: 5.0,
      technical_specs: JSON.stringify({
        'Marca': 'LMX1000',
        'Código': '3219',
        'Compatibilidade': 'Universal — todos os modelos de roçadeiras',
        'Peso': '0,010 kg',
        'Largura': '6,0 cm',
        'Profundidade': '5,0 cm',
        'Altura': '1,5 cm',
        'Tipo': 'Manípulo / manopla',
      }),
      seo_title: 'Manípulo LMX1000 Universal para Roçadeiras | Aquimaq',
      seo_description: 'Manípulo LMX1000 compatível com todos os modelos de roçadeiras. Peça de reposição original. Compre na Aquimaq.',
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
