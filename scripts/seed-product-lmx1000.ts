/**
 * Seed: Roçadeira a Gasolina 2 Tempos LMX1000
 * Fonte: https://www.promaqagro.com/c77scs48r-motor-a-gasolina-2-tempos-260-pr-lmx1000
 *
 * Uso:
 *   npx tsx scripts/seed-product-lmx1000.ts
 *
 * Requer no .env:
 *   VITE_SUPABASE_URL (ou SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
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

const product = {
  name: 'Roçadeira a Gasolina 2 Tempos 260 PR LMX1000',
  slug: 'rocadeira-a-gasolina-2-tempos-260-pr-lmx1000',
  description:
    'Ideal para trabalhos de corte em gramas, ervas daninhas, pequenas moitas e arbustos. ' +
    'Alta produtividade, leve e que se ajusta melhor ao corpo do operador. ' +
    'Indicada para jardins, sítios e fazendas.',
  price: 1650.00,
  old_price: null,
  discount: null,
  stock: 10,
  category: 'Ferramentas Manuais',
  brand: 'LMX',
  image_url: 'https://cdn.awsli.com.br/2500x2500/1846/1846849/produto/90379261/ffb9f5812e.jpg',
  gallery: [
    'https://cdn.awsli.com.br/2500x2500/1846/1846849/produto/90379261/ffb9f5812e.jpg',
  ],
  // Dimensões físicas (convertidas para cm)
  weight: 4.925,  // kg
  width: 22.0,    // cm
  height: 22.0,   // cm
  length: 180.0,  // cm (comprimento total com haste)
  technical_specs: JSON.stringify({
    'Motor': '2 tempos a gasolina',
    'Modelo': 'LMX1000',
    'Referência': '260 PR',
    'Peso': '4,925 kg',
    'Comprimento': '180 cm',
    'Diâmetro da Embreagem': '34 mm',
    'Distância entre furos (cruzado)': '83 mm',
    'Distância entre furos (lado a lado)': '58 mm',
    'Uso indicado': 'Jardins, sítios e fazendas',
    'Aplicação': 'Corte de gramas, ervas daninhas, moitas e arbustos',
  }),
  is_active: true,
  is_new: true,
  is_best_seller: false,
  rating: null,
  review_count: 0,
  wholesale_min_amount: null,
  wholesale_discount_percent: null,
  seo_title: 'Roçadeira a Gasolina 2 Tempos LMX1000 | Aquimaq',
  seo_description:
    'Roçadeira a gasolina 2 tempos LMX1000 com motor 260 PR. Ideal para jardins, sítios e fazendas. Compre na Aquimaq.',
};

async function main() {
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
  console.log('\n🔗 Acesse o painel admin para ajustar estoque, imagens e preço.');
}

main();
