/**
 * Seed batch 3:
 * - Cilindro completo LMX1000 26CC / Husqvarna 226
 * - Pulverizador costal elétrico/manual P20 LMX1000
 * - Motosserra a Gasolina Tekna CS58P18 (is_active=false — definir preço no admin)
 *
 * Uso:
 *   npx tsx scripts/seed-batch-lmx1000-pecas3.ts
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
    images: [
      { url: 'https://cdn.awsli.com.br/2500x2500/1846/1846849/produto/93421427/7609bab970.jpg', filename: 'cilindro-completo-lmx1000-26cc-husqvarna-226.jpg' },
    ],
    product: {
      name: 'Cilindro Completo LMX1000 para 26CC / Husqvarna 226',
      slug: 'cilindro-completo-lmx1000-26cc-husqvarna-226',
      description:
        'Cilindro completo (inclui pistão, rolamento e anel) marca LMX1000 compatível com modelos Husqvarna 226 e LMX1000 26CC. ' +
        'Kit completo para retífica ou substituição do conjunto de motor.',
      price: 160.00,
      category: 'Peças e Acessórios',
      brand: 'LMX1000',
      weight: 0.315,
      width: 10.0,
      height: 10.0,
      length: 10.0,
      is_active: true,
      technical_specs: JSON.stringify({
        'Marca': 'LMX1000',
        'Código': '1526',
        'Compatibilidade': 'Husqvarna 226 / LMX1000 26CC',
        'Inclui': 'Pistão, rolamento e anel',
        'Peso': '0,315 kg',
        'Largura': '10,0 cm',
        'Profundidade': '10,0 cm',
        'Altura': '10,0 cm',
        'Tipo': 'Cilindro completo',
      }),
      seo_title: 'Cilindro Completo LMX1000 26CC para Husqvarna 226 | Aquimaq',
      seo_description: 'Cilindro completo LMX1000 com pistão, rolamento e anel. Compatível com Husqvarna 226 e LMX1000 26CC. Compre na Aquimaq.',
    },
  },
  {
    images: [
      { url: 'https://cdn.awsli.com.br/2500x2500/1846/1846849/produto/90375477/cce6b1d16e.jpg', filename: 'pulverizador-costal-eletrico-manual-p20-lmx1000.jpg' },
    ],
    product: {
      name: 'Pulverizador Costal Elétrico e Manual P20 LMX1000',
      slug: 'pulverizador-costal-eletrico-manual-p20-lmx1000',
      description:
        'Pulverizador costal elétrico e manual P20 marca LMX1000. Ideal para sítios, chácaras e fazendas. ' +
        'Pulveriza fertilizantes, herbicidas, pesticidas e detergentes com praticidade e eficiência.',
      price: 450.00,
      category: 'Equipamentos Agrícolas',
      brand: 'LMX1000',
      weight: 6.955,
      width: 42.0,
      height: 54.0,
      length: 23.0,
      is_active: true,
      technical_specs: JSON.stringify({
        'Marca': 'LMX1000',
        'Código': '7239',
        'Modelo': 'P20',
        'Operação': 'Elétrico e manual',
        'Aplicação': 'Fertilizantes, herbicidas, pesticidas, detergentes',
        'Uso indicado': 'Sítios, chácaras e fazendas',
        'Peso': '6,955 kg',
        'Largura': '42,0 cm',
        'Profundidade': '23,0 cm',
        'Altura': '54,0 cm',
      }),
      seo_title: 'Pulverizador Costal Elétrico e Manual P20 LMX1000 | Aquimaq',
      seo_description: 'Pulverizador costal elétrico/manual P20 LMX1000 para herbicidas, fertilizantes e pesticidas. Ideal para fazendas. Compre na Aquimaq.',
    },
  },
  {
    images: [
      { url: 'https://teknapower.com.br/wp-content/uploads/2021/04/CS58P18_01.jpg', filename: 'motosserra-tekna-cs58p18-01.jpg' },
      { url: 'https://teknapower.com.br/wp-content/uploads/2021/04/CS58P18_02.jpg', filename: 'motosserra-tekna-cs58p18-02.jpg' },
      { url: 'https://teknapower.com.br/wp-content/uploads/2021/04/CS58P18_03.jpg', filename: 'motosserra-tekna-cs58p18-03.jpg' },
      { url: 'https://teknapower.com.br/wp-content/uploads/2021/04/CS58P18_04.jpg', filename: 'motosserra-tekna-cs58p18-04.jpg' },
    ],
    product: {
      name: 'Motosserra a Gasolina Tekna CS58P18 — Sabre 18"',
      slug: 'motosserra-gasolina-tekna-cs58p18-18pol',
      description:
        'Motosserra a gasolina Tekna CS58P18 com sabre de 18". Motor 54,5 cc, 3,2 HP, rotação máxima de 12.000 RPM. ' +
        'Cabos emborrachados para conforto e ergonomia. Corrente Oregon, bomba de óleo automática, freio de segurança e sistema antivibração. ' +
        'Acompanha kit de ferramentas, capa do sabre e misturador de combustível. ' +
        'Ideal para corte de árvores, lenha, madeiramento e poda.',
      price: 0.00, // ⚠️ Definir preço no painel admin antes de ativar
      category: 'Ferramentas Manuais',
      brand: 'Tekna',
      weight: null,
      width: null,
      height: null,
      length: null,
      is_active: false, // ⚠️ Inativo até preço ser definido no admin
      technical_specs: JSON.stringify({
        'Marca': 'Tekna',
        'Modelo': 'CS58P18',
        'Cilindrada': '54,5 cc',
        'Potência': '3,2 HP',
        'Sabre': '18" (Tekna SN)',
        'Corrente': 'Oregon 3/8" x 0.058" 73D',
        'Rotação máxima': '12.000 rpm',
        'Bomba de óleo': 'Automática',
        'Freio de segurança': 'Sim',
        'Antivibração': 'Sim',
        'Acompanha': 'Kit de ferramentas, capa do sabre, misturador de combustível',
      }),
      seo_title: 'Motosserra a Gasolina Tekna CS58P18 Sabre 18" | Aquimaq',
      seo_description: 'Motosserra Tekna CS58P18 54,5cc 3,2HP sabre 18" corrente Oregon. Freio de segurança e antivibração. Compre na Aquimaq.',
    },
  },
];

async function main() {
  for (const item of items) {
    try {
      console.log(`\n⏳ Processando: ${item.product.name}`);

      // Upload all images
      const uploadedUrls: string[] = [];
      for (const img of item.images) {
        const url = await downloadAndUpload(img.url, img.filename);
        uploadedUrls.push(url);
        console.log(`   📸 Imagem: ${url}`);
      }

      const [imageUrl, ...extraImages] = uploadedUrls;

      const { data, error } = await supabase
        .from('products')
        .insert({
          ...item.product,
          image_url: imageUrl,
          gallery: uploadedUrls,
          old_price: null,
          discount: null,
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

      console.log(`   ✅ Inserido! ID: ${data.id}${item.product.is_active ? '' : ' (inativo — definir preço no admin)'}`);
    } catch (err: any) {
      console.error(`   ❌ ${err.message}`);
    }
  }

  console.log('\n✅ Batch concluído.');
}

main();
