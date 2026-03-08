/**
 * Baixa a imagem do CDN externo, faz upload no Supabase Storage (bucket product-images)
 * e atualiza o produto LMX1000 com a nova URL.
 *
 * Uso:
 *   npx tsx scripts/fix-image-lmx1000.ts
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltam VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PRODUCT_SLUG = 'rocadeira-a-gasolina-2-tempos-260-pr-lmx1000';
const EXTERNAL_IMAGE = 'https://cdn.awsli.com.br/2500x2500/1846/1846849/produto/90379261/ffb9f5812e.jpg';
const BUCKET = 'product-images';

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
  // 1. Busca o produto
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('id, name, image_url')
    .eq('slug', PRODUCT_SLUG)
    .single();

  if (fetchError || !product) {
    console.error('❌ Produto não encontrado:', fetchError?.message);
    process.exit(1);
  }
  console.log(`✅ Produto encontrado: ${product.name} (${product.id})`);

  // 2. Faz download e upload da imagem principal
  const filename = `lmx1000-rocadeira-principal.jpg`;
  const publicUrl = await downloadAndUpload(EXTERNAL_IMAGE, filename);
  console.log(`✅ Imagem hospedada: ${publicUrl}`);

  // 3. Atualiza o produto com a nova URL
  const { error: updateError } = await supabase
    .from('products')
    .update({
      image_url: publicUrl,
      gallery: [publicUrl],
    })
    .eq('id', product.id);

  if (updateError) {
    console.error('❌ Erro ao atualizar produto:', updateError.message);
    process.exit(1);
  }

  console.log('✅ Produto atualizado com imagem do Supabase Storage!');
}

main();
