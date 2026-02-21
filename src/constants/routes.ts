/**
 * Rotas centralizadas do app.
 * Use ROUTES para Link/navigate; use ROUTE_PATHS para <Route path={...} /> (segmentos relativos ao parent).
 */
export const ROUTES = {
  HOME: '/',
  PRODUCT: (id: string) => `/produto/${id}`,
  CART: '/carrinho',
  WISHLIST: '/favoritos',
  POLICY_PRIVACY: '/politica-privacidade',
  POLICY_DELIVERY: '/politica-entrega',
  POLICY_RETURNS: '/trocas',
  PAYMENT_SUCCESS: '/pagamento/sucesso',
  PAYMENT_FAILURE: '/pagamento/falha',
  PAYMENT_PENDING: '/pagamento/pendente',
  CONTACT: '/contato',
  ABOUT: '/sobre',
  WORK_WITH_US: '/trabalhe-conosco',
  FAQ: '/faq',
} as const;

/** Segmentos de path para <Route path="..." /> (sem barra inicial). */
export const ROUTE_PATHS = {
  HOME: '',
  PRODUCT: 'produto/:id',
  CART: 'carrinho',
  WISHLIST: 'favoritos',
  POLICY_PRIVACY: 'politica-privacidade',
  POLICY_DELIVERY: 'politica-entrega',
  POLICY_RETURNS: 'trocas',
  PAYMENT_SUCCESS: 'pagamento/sucesso',
  PAYMENT_FAILURE: 'pagamento/falha',
  PAYMENT_PENDING: 'pagamento/pendente',
} as const;
