import assert from 'node:assert/strict';
import test from 'node:test';

import { getCartItemCount, getCartSubtotal, getGrandTotal, getShippingCost } from '@/utils/cart-calculations';
import { ProductCategory, type CartItem, type ShippingOption } from '@/types';

const makeItem = (overrides: Partial<CartItem>): CartItem => ({
  id: '1',
  name: 'Produto',
  description: 'Desc',
  technicalSpecs: 'Specs',
  category: ProductCategory.TOOLS,
  imageUrl: 'https://example.com/image.png',
  stock: 10,
  rating: 4,
  reviewCount: 3,
  price: 100,
  quantity: 1,
  ...overrides,
});

test('calcula subtotal com desconto de atacado quando aplicável', () => {
  const cart: CartItem[] = [
    makeItem({ id: 'a', price: 50, quantity: 4, wholesaleMinAmount: 200, wholesaleDiscountPercent: 10 }),
    makeItem({ id: 'b', price: 20, quantity: 2 }),
  ];

  assert.equal(getCartSubtotal(cart), 220);
});

test('calcula quantidade total de itens', () => {
  const cart: CartItem[] = [makeItem({ quantity: 2 }), makeItem({ id: 'b', quantity: 5 })];
  assert.equal(getCartItemCount(cart), 7);
});

test('retorna custo de frete e total geral', () => {
  const shipping: ShippingOption = {
    id: 's1',
    carrier: 'Correios',
    service: 'PAC',
    price: 35,
    estimatedDays: 5,
  };

  assert.equal(getShippingCost(shipping), 35);
  assert.equal(getShippingCost(null), 0);
  assert.equal(getGrandTotal(220, getShippingCost(shipping)), 255);
});
