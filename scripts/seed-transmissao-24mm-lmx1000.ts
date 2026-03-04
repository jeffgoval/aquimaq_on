/**
 * Seed: Transmissão 24 MM LMX1000 para Husqvarna 226
 * Fonte: https://www.promaqagro.com/transmissao-24mm-lmx1000-para-husqvarna-226
 *
 * Uso:
 *   npx tsx scripts/seed-transmissao-24mm-lmx1000.ts
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

const EXTERNAL_IMAGE = 'https://cdn.awsli.com.br/2500x2500/1846/1846849/produto/98417782/8da1e607f8.jpg';
const BUCKET = 'product-images';
const IMAGE_FILENAME = 'transmissao-24mm-lmx1000-husqvarna-226.jpg';

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
    name: 'Transmissão 24 MM LMX1000 para Husqvarna 226',
    slug: 'transmissao-24mm-lmx1000-husqvarna-226',
    description:
      'Transmissão 24 MM marca LMX1000 compatível com máquinas Husqvarna 226. ' +
      'Peça de reposição para manutenção e reparo do sistema de transmissão de roçadeiras a gasolina.',
    price: 129.00,
    old_price: null,
    discount: null,
    stock: 10,
    category: 'Peças e Acessórios',
    brand: 'LMX1000',
    image_url: imageUrl,
    gallery: [imageUrl],
    weight: 0.475,  // kg
    width: 6.0,     // cm
    height: 10.0,   // cm
    length: 8.0,    // cm
    technical_specs: JSON.stringify({
      'Marca': 'LMX1000',
      'Código': '3331',
      'Compatibilidade': 'Husqvarna 226',
      'Diâmetro': '24 mm',
      'Peso': '0,475 kg',
      'Largura': '6,0 cm',
      'Profundidade': '8,0 cm',
      'Altura': '10,0 cm',
      'Tipo': 'Transmissão',
    }),
    is_active: true,
    is_new: true,
    is_best_seller: false,
    rating: null,
    review_count: 0,
    wholesale_min_amount: null,
    wholesale_discount_percent: null,
    seo_title: 'Transmissão 24 MM LMX1000 para Husqvarna 226 | Aquimaq',
    seo_description:
      'Transmissão 24 MM LMX1000 compatível com Husqvarna 226. Peça de reposição para roçadeiras a gasolina. Compre na Aquimaq.',
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
