/** Source-of-truth único para labels e cores de status de pedido.
 *  Importar aqui em vez de redefinir inline em cada componente.
 */
export const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; shortLabel: string }> = {
  aguardando_pagamento: { label: 'Aguardando Pagamento', shortLabel: 'Aguardando', color: 'text-amber-600 bg-amber-50' },
  pago:                 { label: 'Pago',                 shortLabel: 'Pago',       color: 'text-emerald-600 bg-emerald-50' },
  em_separacao:         { label: 'Em Separação',          shortLabel: 'Separando',  color: 'text-blue-600 bg-blue-50' },
  enviado:              { label: 'Enviado',               shortLabel: 'Enviado',    color: 'text-violet-600 bg-violet-50' },
  pronto_retirada:      { label: 'Pronto para Retirada',  shortLabel: 'Retirada',   color: 'text-indigo-600 bg-indigo-50' },
  entregue:             { label: 'Entregue',              shortLabel: 'Entregue',   color: 'text-emerald-600 bg-emerald-50' },
  cancelado:            { label: 'Cancelado',             shortLabel: 'Cancelado',  color: 'text-stone-500 bg-stone-100' },
};

/** Lista de opções para `<select>` de filtro. */
export const ORDER_STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os Status' },
  ...Object.entries(ORDER_STATUS_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label })),
];

/** Opções de troca de status para pedidos de ENTREGA. */
export const DELIVERY_STATUS_OPTIONS = ORDER_STATUS_OPTIONS
  .slice(1)
  .filter(o => o.value !== 'pronto_retirada');

/** Opções de troca de status para pedidos de RETIRADA. */
export const PICKUP_STATUS_OPTIONS = ORDER_STATUS_OPTIONS
  .slice(1)
  .filter(o => o.value !== 'enviado');
