/**
 * Rotas centralizadas do app.
 * Use ROUTES para Link/navigate; use ROUTE_PATHS para <Route path={...} /> (segmentos relativos ao parent).
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
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
  ADMIN: '/admin',
  ACCOUNT: '/conta',
} as const;

/** Segmentos de path para <Route path="..." /> (sem barra inicial). */
export const ROUTE_PATHS = {
  HOME: '',
  LOGIN: 'login',
  ACCOUNT: 'conta',
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
