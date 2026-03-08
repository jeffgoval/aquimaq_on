/**
 * Seed: Produtos-chave para cafeicultura — Aquimaq
 *
 * Uso:
 *   npx tsx scripts/seed-batch-cafe-produtos.ts
 *
 * Requer no .env:
 *   VITE_SUPABASE_URL (ou SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY (ou VITE_SUPABASE_SERVICE_ROLE_KEY)
 *
 * Fases do calendário (campo `culture`):
 *   Café - Poda e Esqueletamento     (Jul–Set)
 *   Café - Pré-Florada e Florada     (Set–Nov)
 *   Café - Chumbinho e Expansão      (Dez–Fev)
 *   Café - Granação e Maturação      (Mar–Mai)
 *   Café - Colheita                  (Mai–Ago)
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL!;
const supabaseServiceKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltam variáveis: VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const produtos = [
  // ─── PODA E ESQUELETAMENTO ───────────────────────────────────────────────
  {
    name: 'Tesoura de Poda Profissional para Café 8"',
    slug: 'tesoura-poda-profissional-cafe-8',
    description:
      'Tesoura de poda com lâmina de aço inox endurecido, ideal para poda e esqueletamento do cafeeiro. ' +
      'Cabo ergonômico com mola de retorno. Corte preciso e sem esforço.',
    price: 89.90,
    old_price: 109.90,
    discount: 18,
    stock: 50,
    category: 'Colheita e Ferramentas',
    culture: 'Café - Poda e Esqueletamento',
    brand: null,
    image_url: '',
    gallery: [],
    weight: 0.35,
    width: 5.0,
    height: 22.0,
    length: 5.0,
    technical_specs: JSON.stringify({
      'Comprimento': '8 polegadas (20 cm)',
      'Material da lâmina': 'Aço inox endurecido',
      'Abertura máxima': '3 cm',
      'Aplicação': 'Poda e esqueletamento de cafeeiros',
      'Fase recomendada': 'Julho a Setembro',
    }),
    is_active: true,
    is_new: true,
    is_best_seller: false,
    rating: null,
    review_count: 0,
    seo_title: 'Tesoura de Poda para Café | Aquimaq',
    seo_description:
      'Tesoura de poda profissional para poda e esqueletamento do cafeeiro. Lâmina inox, cabo ergonômico. Compre na Aquimaq.',
  },
  {
    name: 'Motopoda a Gasolina 2 Tempos 26cc',
    slug: 'motopoda-gasolina-2-tempos-26cc',
    description:
      'Motopoda a gasolina 2 tempos para poda e esqueletamento de cafeeiros e pomares. ' +
      'Motor de 26cc, leve e potente, com lâmina dupla de corte. Alta eficiência na poda de galhos.',
    price: 1290.00,
    old_price: null,
    discount: null,
    stock: 8,
    category: 'Máquinas e Equipamentos',
    culture: 'Café - Poda e Esqueletamento',
    brand: null,
    image_url: '',
    gallery: [],
    weight: 4.5,
    width: 20.0,
    height: 20.0,
    length: 170.0,
    technical_specs: JSON.stringify({
      'Motor': '2 tempos a gasolina',
      'Cilindrada': '26cc',
      'Comprimento da lâmina': '600 mm',
      'Peso': '4,5 kg',
      'Aplicação': 'Poda e esqueletamento de cafeeiros e frutíferas',
      'Fase recomendada': 'Julho a Setembro',
    }),
    is_active: true,
    is_new: false,
    is_best_seller: true,
    rating: null,
    review_count: 0,
    seo_title: 'Motopoda a Gasolina 26cc para Café | Aquimaq',
    seo_description:
      'Motopoda a gasolina 2 tempos 26cc para poda de cafeeiros. Motor potente, leve. Compre na Aquimaq.',
  },

  // ─── PRÉ-FLORADA E FLORADA ───────────────────────────────────────────────
  {
    name: 'Fertilizante Foliar Boro + Zinco para Florada do Café 1L',
    slug: 'fertilizante-foliar-boro-zinco-florada-cafe-1l',
    description:
      'Fertilizante foliar líquido enriquecido com Boro e Zinco, nutrientes essenciais para a indução e ' +
      'uniformidade da florada do cafeeiro. Reduz queda de flores e melhora o pegamento dos frutos.',
    price: 48.50,
    old_price: 55.00,
    discount: 12,
    stock: 100,
    category: 'Insumos Agrícolas',
    culture: 'Café - Pré-Florada e Florada',
    brand: null,
    image_url: '',
    gallery: [],
    weight: 1.1,
    width: 8.0,
    height: 20.0,
    length: 8.0,
    technical_specs: JSON.stringify({
      'Apresentação': 'Líquido concentrado',
      'Volume': '1 litro',
      'Nutrientes principais': 'Boro (B) 1,5% + Zinco (Zn) 5%',
      'Modo de aplicação': 'Pulverização foliar',
      'Dose recomendada': '200–300 mL / 100 L de água',
      'Fase recomendada': 'Setembro a Novembro (pré-florada e florada)',
    }),
    is_active: true,
    is_new: true,
    is_best_seller: false,
    rating: null,
    review_count: 0,
    seo_title: 'Fertilizante Foliar Boro Zinco para Florada do Café | Aquimaq',
    seo_description:
      'Fertilizante foliar Boro + Zinco para induzir a florada uniforme do café. 1 litro. Compre na Aquimaq.',
  },
  {
    name: 'Pulverizador Costal Manual 20L para Insumos Foliares',
    slug: 'pulverizador-costal-manual-20l-insumos-foliares',
    description:
      'Pulverizador costal manual de 20 litros com alça ergonômica e barra de alumínio. ' +
      'Ideal para aplicação de fertilizantes foliares, fungicidas e inseticidas na lavoura de café.',
    price: 189.90,
    old_price: 219.90,
    discount: 14,
    stock: 30,
    category: 'Máquinas e Equipamentos',
    culture: 'Café - Pré-Florada e Florada',
    brand: null,
    image_url: '',
    gallery: [],
    weight: 2.8,
    width: 30.0,
    height: 55.0,
    length: 20.0,
    technical_specs: JSON.stringify({
      'Capacidade': '20 litros',
      'Tipo': 'Costal manual',
      'Material do tanque': 'Polietileno de alta densidade',
      'Pressão de trabalho': '2–4 bar',
      'Barra': 'Alumínio 50 cm',
      'Aplicação': 'Fertilizantes foliares, fungicidas, inseticidas',
    }),
    is_active: true,
    is_new: false,
    is_best_seller: true,
    rating: null,
    review_count: 0,
    seo_title: 'Pulverizador Costal 20L para Café | Aquimaq',
    seo_description:
      'Pulverizador costal manual 20L para aplicação de insumos na lavoura de café. Compre na Aquimaq.',
  },

  // ─── CHUMBINHO E EXPANSÃO ────────────────────────────────────────────────
  {
    name: 'Fertilizante NPK 10-10-10 Granulado 25kg',
    slug: 'fertilizante-npk-10-10-10-granulado-25kg',
    description:
      'Adubo mineral granulado formulação NPK 10-10-10 para fertilização de cobertura no cafeeiro. ' +
      'Fornece nitrogênio, fósforo e potássio de forma equilibrada para o desenvolvimento dos frutos.',
    price: 129.90,
    old_price: null,
    discount: null,
    stock: 60,
    category: 'Insumos Agrícolas',
    culture: 'Café - Chumbinho e Expansão',
    brand: null,
    image_url: '',
    gallery: [],
    weight: 25.0,
    width: 40.0,
    height: 60.0,
    length: 15.0,
    technical_specs: JSON.stringify({
      'Formulação': 'NPK 10-10-10',
      'Apresentação': 'Granulado',
      'Peso': '25 kg',
      'Modo de aplicação': 'Cobertura no solo',
      'Dose': 'Conforme análise de solo e recomendação técnica',
      'Fase recomendada': 'Dezembro a Fevereiro (expansão dos frutos)',
    }),
    is_active: true,
    is_new: false,
    is_best_seller: true,
    rating: null,
    review_count: 0,
    seo_title: 'Fertilizante NPK 10-10-10 25kg para Café | Aquimaq',
    seo_description:
      'Adubo NPK 10-10-10 granulado 25kg para cobertura no cafeeiro. Fase chumbinho e expansão. Compre na Aquimaq.',
  },
  {
    name: 'Fungicida Preventivo para Ferrugem do Café 1L',
    slug: 'fungicida-preventivo-ferrugem-cafe-1l',
    description:
      'Fungicida sistêmico de amplo espectro para prevenção e controle da ferrugem do cafeeiro ' +
      '(Hemileia vastatrix). Aplicar preventivamente a partir do chumbinho para proteção máxima.',
    price: 76.00,
    old_price: 89.00,
    discount: 15,
    stock: 45,
    category: 'Insumos Agrícolas',
    culture: 'Café - Chumbinho e Expansão',
    brand: null,
    image_url: '',
    gallery: [],
    weight: 1.1,
    width: 8.0,
    height: 22.0,
    length: 8.0,
    technical_specs: JSON.stringify({
      'Grupo químico': 'Triazol + Estrobilurina',
      'Ação': 'Sistêmica, preventiva e curativa',
      'Alvo': 'Ferrugem do café (Hemileia vastatrix)',
      'Volume': '1 litro',
      'Dose': '0,5–0,75 L / ha',
      'Fase recomendada': 'Dezembro a Fevereiro (chumbinho)',
    }),
    is_active: true,
    is_new: false,
    is_best_seller: false,
    rating: null,
    review_count: 0,
    seo_title: 'Fungicida para Ferrugem do Café 1L | Aquimaq',
    seo_description:
      'Fungicida sistêmico preventivo para ferrugem do cafeeiro. 1 litro. Compre na Aquimaq.',
  },

  // ─── GRANAÇÃO E MATURAÇÃO ────────────────────────────────────────────────
  {
    name: 'Fertilizante Foliar Potássio + Cálcio para Maturação 1L',
    slug: 'fertilizante-foliar-potassio-calcio-maturacao-cafe-1l',
    description:
      'Fertilizante foliar rico em Potássio e Cálcio para uniformizar a maturação dos frutos do café. ' +
      'Melhora a cor, tamanho e densidade dos grãos, aumentando a classificação e o rendimento.',
    price: 52.00,
    old_price: null,
    discount: null,
    stock: 80,
    category: 'Insumos Agrícolas',
    culture: 'Café - Granação e Maturação',
    brand: null,
    image_url: '',
    gallery: [],
    weight: 1.2,
    width: 8.0,
    height: 22.0,
    length: 8.0,
    technical_specs: JSON.stringify({
      'Nutrientes': 'K₂O 12% + CaO 8%',
      'Apresentação': 'Líquido concentrado',
      'Volume': '1 litro',
      'Dose': '250–400 mL / 100 L de água',
      'Aplicação': 'Pulverização foliar',
      'Fase recomendada': 'Março a Maio (granação e maturação)',
    }),
    is_active: true,
    is_new: false,
    is_best_seller: false,
    rating: null,
    review_count: 0,
    seo_title: 'Fertilizante Foliar Potássio Cálcio para Maturação do Café | Aquimaq',
    seo_description:
      'Fertilizante foliar K + Ca para maturação uniforme dos frutos do café. 1 litro. Compre na Aquimaq.',
  },

  // ─── COLHEITA ────────────────────────────────────────────────────────────
  {
    name: 'Pano de Apanha para Colheita de Café 3m x 4m',
    slug: 'pano-apanha-colheita-cafe-3x4m',
    description:
      'Pano de apanha para colheita de café em lona de polipropileno trançado resistente. ' +
      'Dimensões 3m x 4m com ilhoses de reforço nas bordas. Fácil de armazenar e durável.',
    price: 79.90,
    old_price: 95.00,
    discount: 16,
    stock: 120,
    category: 'Colheita e Ferramentas',
    culture: 'Café - Colheita',
    brand: null,
    image_url: '',
    gallery: [],
    weight: 1.8,
    width: 40.0,
    height: 5.0,
    length: 40.0,
    technical_specs: JSON.stringify({
      'Dimensões': '3 m x 4 m (12 m²)',
      'Material': 'Lona polipropileno trançado',
      'Gramatura': '120 g/m²',
      'Bordas': 'Ilhoses de alumínio de reforço',
      'Aplicação': 'Colheita de café e outros frutos',
      'Fase recomendada': 'Maio a Agosto (colheita)',
    }),
    is_active: true,
    is_new: false,
    is_best_seller: true,
    rating: null,
    review_count: 0,
    seo_title: 'Pano de Apanha 3x4m para Colheita de Café | Aquimaq',
    seo_description:
      'Pano de apanha 3x4m em lona trançada para colheita de café. Durável, com ilhoses. Compre na Aquimaq.',
  },
  {
    name: 'Derriçadeira de Café a Gasolina 2 Tempos',
    slug: 'derricadeira-cafe-gasolina-2-tempos',
    description:
      'Derriçadeira motorizada a gasolina 2 tempos para colheita mecanizada do café. ' +
      'Dedos flexíveis de nylon que não danificam os galhos. Alta produtividade na colheita manual-mecanizada.',
    price: 980.00,
    old_price: 1150.00,
    discount: 15,
    stock: 12,
    category: 'Máquinas e Equipamentos',
    culture: 'Café - Colheita',
    brand: null,
    image_url: '',
    gallery: [],
    weight: 3.2,
    width: 15.0,
    height: 15.0,
    length: 120.0,
    technical_specs: JSON.stringify({
      'Motor': '2 tempos a gasolina',
      'Cilindrada': '26cc',
      'Velocidade dos dedos': '1800 RPM',
      'Dedos': '10 dedos flexíveis de nylon',
      'Peso': '3,2 kg',
      'Aplicação': 'Derriça de café em terreno acidentado',
      'Fase recomendada': 'Maio a Agosto (colheita)',
    }),
    is_active: true,
    is_new: false,
    is_best_seller: true,
    rating: null,
    review_count: 0,
    seo_title: 'Derriçadeira de Café a Gasolina 2 Tempos | Aquimaq',
    seo_description:
      'Derriçadeira motorizada a gasolina para colheita mecanizada do café. Leve e potente. Compre na Aquimaq.',
  },
  {
    name: 'Peneira Classificadora de Café 60cm — Crivo 17/18',
    slug: 'peneira-classificadora-cafe-60cm-crivo-17-18',
    description:
      'Peneira classificadora para beneficiamento pós-colheita do café. ' +
      'Crivo 17/18 para separação por tamanho dos grãos. Aro em madeira resinada e tela galvanizada.',
    price: 58.00,
    old_price: null,
    discount: null,
    stock: 35,
    category: 'Colheita e Ferramentas',
    culture: 'Café - Colheita',
    brand: null,
    image_url: '',
    gallery: [],
    weight: 0.8,
    width: 60.0,
    height: 8.0,
    length: 60.0,
    technical_specs: JSON.stringify({
      'Diâmetro': '60 cm',
      'Crivo': '17/18 (furo oblongo 6,75–7,14 mm)',
      'Aro': 'Madeira resinada',
      'Tela': 'Aço galvanizado',
      'Aplicação': 'Classificação de grãos de café pós-colheita',
      'Fase recomendada': 'Maio a Agosto (colheita e pós-colheita)',
    }),
    is_active: true,
    is_new: false,
    is_best_seller: false,
    rating: null,
    review_count: 0,
    seo_title: 'Peneira Classificadora de Café 60cm Crivo 17/18 | Aquimaq',
    seo_description:
      'Peneira classificadora 60cm crivo 17/18 para beneficiamento do café pós-colheita. Compre na Aquimaq.',
  },
];

async function main() {
  console.log(`⏳ Inserindo ${produtos.length} produtos de cafeicultura...\n`);

  let inseridos = 0;
  let erros = 0;

  for (const produto of produtos) {
    const { data, error } = await supabase
      .from('products')
      .insert(produto)
      .select('id, name')
      .single();

    if (error) {
      console.error(`❌ Erro ao inserir "${produto.name}":`, error.message);
      erros++;
    } else {
      console.log(`✅ ${data.name}`);
      console.log(`   ID: ${data.id} | Fase: ${produto.culture}`);
      inseridos++;
    }
  }

  console.log(`\n📊 Resultado: ${inseridos} inseridos, ${erros} erros.`);
  console.log('🔗 Acesse o painel admin para adicionar imagens e ajustar preços.');
}

main();
