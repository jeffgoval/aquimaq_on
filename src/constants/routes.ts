/**
 * Rotas centralizadas do app.
 * Use ROUTES para Link/navigate; use ROUTE_PATHS para <Route path={...} /> (segmentos relativos ao parent).
 */
export const ROUTES = {
  HOME: '/',
  PRODUCT: (id: string) => `/produto/${id}`,
  CART: '/carrinho',
  CHECKOUT: '/checkout',
  WISHLIST: '/favoritos',
  POLICY_PRIVACY: '/politica-privacidade',
  POLICY_DELIVERY: '/politica-entrega',
  POLICY_RETURNS: '/trocas',
  LOGIN: '/login',
  REGISTER: '/registar',
  FORGOT_PASSWORD: '/recuperar-password',
  UPDATE_PASSWORD: '/atualizar-password',
  PROFILE: '/perfil',
  ORDERS: '/pedidos',
  CONTACT: '/contato',
  ABOUT: '/sobre',
  WORK_WITH_US: '/trabalhe-conosco',
  FAQ: '/faq',

  ADMIN: '/admin',
  ADMIN_PRODUCTS: '/admin/produtos',
  ADMIN_ORDERS: '/admin/pedidos',
  ADMIN_BANNERS: '/admin/banners',
  ADMIN_USERS: '/admin/usuarios',
  ADMIN_SETTINGS: '/admin/configuracoes',
  ADMIN_ANALYTICS: '/admin/analytics',
} as const;

/** Segmentos de path para <Route path="..." /> (sem barra inicial). */
export const ROUTE_PATHS = {
  HOME: '',
  PRODUCT: 'produto/:id',
  CART: 'carrinho',
  CHECKOUT: 'checkout',
  WISHLIST: 'favoritos',
  POLICY_PRIVACY: 'politica-privacidade',
  POLICY_DELIVERY: 'politica-entrega',
  POLICY_RETURNS: 'trocas',
  LOGIN: 'login',
  REGISTER: 'registar',
  FORGOT_PASSWORD: 'recuperar-password',
  UPDATE_PASSWORD: 'atualizar-password',
  PROFILE: 'perfil',

  ADMIN: 'admin',
  ADMIN_PRODUCTS: 'produtos',
  ADMIN_ORDERS: 'pedidos',
  ADMIN_BANNERS: 'banners',
  ADMIN_USERS: 'usuarios',
  ADMIN_SETTINGS: 'configuracoes',
  ADMIN_ANALYTICS: 'analytics',
} as const;

/** URL de login com redirect (ex: /login?redirect=/checkout). */
export const loginWithRedirect = (returnTo: string): string =>
  `${ROUTES.LOGIN}?redirect=${encodeURIComponent(returnTo)}`;
