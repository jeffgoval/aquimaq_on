/**
 * Seed: Módulo de Ignição LMX1000 para Husqvarna 226
 * Fonte: https://www.promaqagro.com/modulo-de-ignicao-lmx1000-para-husqvarna-226
 *
 * Uso:
 *   npx tsx scripts/seed-modulo-ignicao-lmx1000.ts
 *
 * Requer no .env:
 *   VITE_SUPABASE_URL (ou SUPABASE_URL)
 *   VITE_SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SERVICE_ROLE_KEY)
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as https from 'https';
import * as http from 'http';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltam variáveis de ambiente: VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const EXTERNAL_IMAGE = 'https://cdn.awsli.com.br/2500x2500/1846/1846849/produto/98570746/faa9ee51af.jpg';
const BUCKET = 'product-images';
const IMAGE_FILENAME = 'modulo-ignicao-lmx1000-husqvarna-226.jpg';

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
  // 1. Re-hospedar imagem no Supabase Storage
  const imageUrl = await downloadAndUpload(EXTERNAL_IMAGE, IMAGE_FILENAME);
  console.log(`✅ Imagem hospedada: ${imageUrl}`);

  // 2. Inserir produto
  const product = {
    name: 'Módulo de Ignição LMX1000 para Husqvarna 226',
    slug: 'modulo-ignicao-lmx1000-husqvarna-226',
    description:
      'Módulo de ignição marca LMX1000 compatível com máquinas Husqvarna 226. ' +
      'Peça de reposição original para manutenção e reparo de roçadeiras e equipamentos a gasolina.',
    price: 99.00,
    old_price: null,
    discount: null,
    stock: 10,
    category: 'Peças e Acessórios',
    brand: 'LMX1000',
    image_url: imageUrl,
    gallery: [imageUrl],
    weight: 0.125,  // kg
    width: 21.0,    // cm
    height: 3.0,    // cm
    length: 16.5,   // cm
    technical_specs: JSON.stringify({
      'Marca': 'LMX1000',
      'Código': '1461',
      'Compatibilidade': 'Husqvarna 226',
      'Peso': '0,125 kg',
      'Largura': '21,0 cm',
      'Profundidade': '16,5 cm',
      'Altura': '3,0 cm',
      'Tipo': 'Módulo de ignição',
    }),
    is_active: true,
    is_new: true,
    is_best_seller: false,
    rating: null,
    review_count: 0,
    wholesale_min_amount: null,
    wholesale_discount_percent: null,
    seo_title: 'Módulo de Ignição LMX1000 para Husqvarna 226 | Aquimaq',
    seo_description:
      'Módulo de ignição LMX1000 compatível com Husqvarna 226. Peça de reposição para roçadeiras a gasolina. Compre na Aquimaq.',
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
  console.log('\n🔗 Acesse o painel admin para ajustar estoque e preço.');
}

main();
