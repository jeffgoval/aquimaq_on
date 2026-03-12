import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createCheckout } from '../checkoutService';
import { supabase } from '@/services/supabase';
import { ENV } from '@/config/env';

// Mock the dependencies
mock.method(supabase.auth, 'getSession', async () => ({
  data: { session: { access_token: 'fake-token' } },
}));

// Mock window for Node.js environment
if (typeof global.window === 'undefined') {
  (global as any).window = {
    location: {
      origin: 'http://localhost:3000'
    }
  };
}

// Polyfill import.meta.env
// Node testrunner without vite doesn't inject it automatically if tested directly via node
const _global = global as any;
if (!_global.import) _global.import = {};
if (!_global.import.meta) _global.import.meta = {};
if (!_global.import.meta.env) _global.import.meta.env = { DEV: true };

describe('checkoutService', () => {
  beforeEach(() => {
    // Reset any mocks or clean up before each test if needed
  });

  it('deve formatar o payload corretamente e chamar a edge function de checkout', async (t) => {
    // Intercept fetch calls
    mock.method(global, 'fetch', async (url: string, options: any) => {
      // Verifica URL
      assert.strictEqual(url, `${ENV.VITE_SUPABASE_URL}/functions/v1/checkout`);
      
      // Verifica headers
      assert.strictEqual(options.headers['Authorization'], 'Bearer fake-token');
      assert.strictEqual(options.headers['apikey'], ENV.VITE_SUPABASE_ANON_KEY);
      
      // Verifica payload enviado
      const body = JSON.parse(options.body);
      
      // Valida itens (frete deve ser um item separado quando aplicável)
      assert.strictEqual(body.items.length, 2);
      assert.strictEqual(body.items[0].id, 'p1');
      assert.strictEqual(body.items[0].quantity, 2);
      assert.strictEqual(body.items[0].unit_price, 0); // Servidor recalcula
      
      // Item do frete
      assert.strictEqual(body.items[1].id, 'shipping');
      assert.strictEqual(body.items[1].unit_price, 15.5);
      
      // Valida dados do pagador
      assert.strictEqual(body.payer.first_name, 'João');
      assert.strictEqual(body.payer.last_name, 'da Silva');
      
      return {
        ok: true,
        json: async () => ({
          order_id: 'ord-123',
          checkout_url: 'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=123',
        }),
      } as Response;
    });

    const mockProfile = {
      id: 'uuid',
      name: 'João da Silva',
      email: 'joao@example.com',
      phone: '11999999999',
      street: 'Rua das Flores',
      number: '123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01001-000',
    } as any;

    const mockCart = [
      {
        id: 'p1',
        name: 'Produto Teste',
        price: 100,
        quantity: 2,
      } as any,
    ];

    const result = await createCheckout({
      cart: mockCart,
      shippingCost: 15.5,
      selectedShipping: {
        id: 'pac',
        price: 15.5,
        service: 'PAC',
        carrier: 'Correios',
        estimatedDays: 5,
      } as any,
      profile: mockProfile,
    });

    assert.strictEqual(result.order_id, 'ord-123');
    assert.strictEqual(result.checkout_url, 'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=123');
    
    // Restaurar fetch original
    mock.restoreAll();
  });

  it('deve lançar erro se o usuário não estiver logado', async () => {
    // Forçar mock para não retornar token
    mock.method(supabase.auth, 'getSession', async () => ({
      data: { session: null },
    }));

    await assert.rejects(
      async () => {
        await createCheckout({
          cart: [],
          shippingCost: 0,
          selectedShipping: { id: 'pickup_store', price: 0, service: 'Retirada', carrier: 'Loja', estimatedDays: 0 } as any,
          profile: {} as any,
        });
      },
      (error: Error) => error.message === 'Você precisa estar logado para finalizar a compra.'
    );
    
    mock.restoreAll();
  });

  it('deve lançar erro se a edge function falhar', async () => {
    mock.method(supabase.auth, 'getSession', async () => ({
      data: { session: { access_token: 'fake-token' } },
    }));

    mock.method(global, 'fetch', async () => ({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Endereço inválido' }),
    }));

    await assert.rejects(
      async () => {
        await createCheckout({
          cart: [],
          shippingCost: 0,
          selectedShipping: { id: 'pickup_store', price: 0, service: 'Retirada', carrier: 'Loja', estimatedDays: 0 } as any,
          profile: {} as any,
        });
      },
      (error: Error) => error.message === 'Endereço inválido'
    );
    
    mock.restoreAll();
  });
});
