/**
 * Seed: Tampa de Partida LMX1000 para Perfurador de Solo
 * Fonte: https://www.promaqagro.com/tampa-de-partida-lmx1000-para-perfurador-de-solo-lmx-e-kawashima-4352
 *
 * Uso:
 *   npx tsx scripts/seed-tampa-partida-lmx1000.ts
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltam variáveis de ambiente: VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const EXTERNAL_IMAGE = 'https://cdn.awsli.com.br/2500x2500/1846/1846849/produto/98566721/a57ed49e81.jpg';
const BUCKET = 'product-images';
const IMAGE_FILENAME = 'tampa-partida-lmx1000-perfurador-solo.jpg';

async function downloadAndUpload(url: string, filename: string): Promise<string> {
  console.log(`⬇️  Baixando imagem de ${url}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao baixar imagem: HTTP ${res.status}`);

  const buffer = await res.arrayBuffer();
  const uint8 = new Uint8Array(buffer);

  console.log(`⬆️  Fazendo upload para ${BUCKET}/${filename}...`);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, uint8, {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
      upsert: true,
    });

  if (error) throw new Error(`Erro no upload: ${error.message}`);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return urlData.publicUrl;
}

async function main() {
  const imageUrl = await downloadAndUpload(EXTERNAL_IMAGE, IMAGE_FILENAME);
  console.log(`✅ Imagem hospedada: ${imageUrl}`);

  const product = {
    name: 'Tampa de Partida LMX1000 para Perfurador de Solo LMX / Kawashima 43/52',
    slug: 'tampa-partida-lmx1000-perfurador-solo-kawashima-4352',
    description:
      'Tampa de partida marca LMX1000 compatível com perfurador de solo LMX1000 e Kawashima 43/52. ' +
      'Peça de reposição para manutenção e reparo do sistema de partida de perfuradores a gasolina.',
    price: 46.20,
    old_price: null,
    discount: null,
    stock: 10,
    category: 'Peças e Acessórios',
    brand: 'LMX1000',
    image_url: imageUrl,
    gallery: [imageUrl],
    weight: 0.255,  // kg
    width: 9.0,     // cm
    height: 8.0,    // cm
    length: 4.0,    // cm
    technical_specs: JSON.stringify({
      'Marca': 'LMX1000',
      'Código': '4508',
      'Compatibilidade': 'LMX1000 / Kawashima 43 / 52',
      'Peso': '0,255 kg',
      'Largura': '9,0 cm',
      'Profundidade': '4,0 cm',
      'Altura': '8,0 cm',
      'Tipo': 'Tampa de partida',
    }),
    is_active: true,
    is_new: true,
    is_best_seller: false,
    rating: null,
    review_count: 0,
    wholesale_min_amount: null,
    wholesale_discount_percent: null,
    seo_title: 'Tampa de Partida LMX1000 para Perfurador de Solo Kawashima 43/52 | Aquimaq',
    seo_description:
      'Tampa de partida LMX1000 compatível com perfurador de solo LMX e Kawashima 43/52. Peça de reposição original. Compre na Aquimaq.',
  };

  console.log('⏳ Inserindo produto:', product.name);

  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select('id, name')
    .single();

  if (error) {
    console.error('❌ Erro ao inserir produto:', error.message);
    process.exit(1);
  }

  console.log('✅ Produto inserido com sucesso!');
  console.log('   ID:', data.id);
  console.log('   Nome:', data.name);
  console.log('   Imagem:', imageUrl);
}

main();
