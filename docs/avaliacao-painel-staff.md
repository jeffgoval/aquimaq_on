# Avaliação: Interface do painel staff (admin / gerente / vendedor)

## Problema

A interface do staff está **misturada** com o layout e a linguagem visual da loja (cliente final). Isso gera:
- Confusão entre “área da loja” e “área de gestão”
- Sensação de ferramenta pouco profissional
- Inconsistência entre páginas (umas mais “admin”, outras mais “marketing”)

---

## O que está a acontecer hoje

### 1. Uso da identidade da loja no painel
- **AdminLayout** usa o **logo e nome da loja** na sidebar e fundo claro (stone-50).
- Faz sentido mostrar “de que loja é o painel”, mas o resto do painel deveria ter identidade própria de **back office**, não de site público.

### 2. StoreSettings = página de “cliente”
- **Configurações** (StoreSettings) é usada dentro do admin mas está desenhada como página de **marketing**:
  - Títulos grandes (`text-3xl font-extrabold`), verde da marca (`agro-600`, `agro-700`, `bg-agro-50`)
  - Blocos muito redondos (`rounded-2xl`), copy “Configurações da Loja” com ícone de loja
  - Abas e formulário com estilo “landing” (grays + verde)
- Parece uma página pública da loja, não uma secção do painel de gestão.

### 3. Inconsistência de cores no admin
- Várias páginas admin usam **stone** (neutro): Dashboard, Pedidos, Usuários, Banners, etc.
- Outras ainda usam **agro** (verde) em botões e destaques: Sazonalidade, Config. IA, partes de Banners.
- Padrão de mercado: painel usa **paleta neutra** (slate/stone/zinc); cor de marca fica na loja, não no back office.

### 4. Hierarquia e densidade
- Em algumas áreas há títulos muito grandes e muito ar (“hero”) para um painel.
- Em painéis de referência (Stripe, Shopify, Vercel, etc.) a hierarquia é mais contida (ex.: `text-xl` para título de página, `text-sm` para secundário) e a densidade de informação é maior (tabelas, listas, filtros bem visíveis).

### 5. Estrutura
- StoreSettings é uma **página cheia** com header e “Voltar” próprios, em vez de se ler como mais uma secção do painel (como Pedidos ou Produtos).
- O conteúdo poderia seguir o mesmo padrão das outras secções: título alinhado ao layout admin, breadcrumb, conteúdo em cards/tabs com o mesmo estilo do resto do painel.

---

## Padrão de mercado (referências)

- **Stripe Dashboard:** fundo neutro (cinza claro), sidebar escura ou clara, sem cor de marca forte; botões primários neutros (preto/cinza escuro) ou um azul discreto.
- **Shopify Admin:** sidebar escura, área de conteúdo clara; formulários e tabelas compactos; uma única cor de destaque (azul) para ações, não a cor da loja.
- **Vercel Dashboard:** fundo preto/cinza, cards com bordas subtis; tipografia clara e hierarquia forte; sem “marketing” no painel.

Princípios comuns:
- **Neutro no painel:** slate/stone/zinc (ou cinza) em todo o back office.
- **Cor de marca só na loja:** verde/agro só no site do cliente.
- **Identidade clara:** “Isto é ferramenta de gestão”, não “Isto é a loja”.
- **Consistência:** mesmas regras de espaçamento, cantos (ex.: `rounded-lg`), cards e botões em todas as secções do painel.

---

## Recomendações concretas

### 1. Paleta única para o painel staff
- **Remover** uso de `agro-*` em todo o painel (AdminLayout e todas as páginas admin, incluindo StoreSettings).
- **Usar** apenas tons neutros: `stone` ou `slate` (ex.: `stone-50` fundo, `stone-100` bordas, `stone-700/800` texto e botões primários).
- Opcional: um único accent para “ação primária” no painel (ex.: `blue-600` ou `stone-800`), igual em todas as secções.

### 2. Reestilizar StoreSettings como “secção do painel”
- Reduzir tamanho de títulos: por exemplo `text-xl font-semibold` para o título principal, sem `font-extrabold` nem `text-3xl`.
- Trocar abas e botões de `agro-*` para `stone-*` (ex.: aba ativa `border-stone-700 text-stone-900`, botão primário `bg-stone-800 hover:bg-stone-700 text-white`).
- Usar o mesmo padrão de cards do resto do admin: `rounded-xl` (ou `rounded-lg`), `border border-stone-200`, sem `rounded-2xl` nem sombras de “marketing”.
- Texto de apoio e labels em `text-stone-500` / `text-stone-600`, alinhado ao resto do painel.

### 3. Unificar botões e links no admin
- Em **AdminSeasonalSwitcher**, **AdminAISettings**, **AdminShippingGuard**, **AdminBannerManagement** e qualquer outro componente admin: substituir `bg-agro-600 hover:bg-agro-700` por um estilo neutro (ex.: `bg-stone-800 hover:bg-stone-700 text-white`).
- Manter cores semânticas apenas para estados (sucesso = verde, erro = vermelho, aviso = âmbar), sem ser a cor da marca.

### 4. AdminLayout
- Manter logo e nome da loja na sidebar (contexto), mas garantir que o restante (sidebar, header, conteúdo) use apenas a paleta neutra.
- Evitar qualquer elemento verde/agro no layout do painel.

### 5. Hierarquia e densidade
- Título de página: `text-xl` ou `text-2xl`, `font-semibold`.
- Subtítulo/descrição: `text-sm text-stone-500`.
- Cards e tabelas: mesmo estilo em todas as secções (borda, padding, `rounded-lg`/`rounded-xl`).

### 6. (Opcional) Integrar Configurações ao layout
- Fazer StoreSettings parecer “mais uma secção” do painel: mesmo header height e breadcrumb que as outras páginas, conteúdo dentro da área principal do AdminLayout, sem duplicar um “hero” próprio.

---

## Resumo

| Onde | Problema | Ação sugerida |
|------|----------|----------------|
| StoreSettings | Visual de “loja” (agro, títulos grandes, rounded-2xl) | Paleta stone, títulos menores, cards alinhados ao restante do painel |
| Várias páginas admin | Botões e links em agro (verde) | Trocar para stone-800 ou accent neutro único |
| Global admin | Mistura de identidade “loja” e “ferramenta” | Definir: painel = neutro; cor de marca só na loja |
| Hierarquia | Alguns títulos e espaços “hero” | Padronizar títulos (text-xl/2xl) e densidade |

Implementando estas mudanças, o painel fica visualmente **separado** da loja e alinhado a um **padrão profissional** de back office (neutro, consistente, orientado à gestão).
