import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { upsertStockNotification } from '../stockNotificationService';
import { supabase } from '../supabase';

describe('stockNotificationService', () => {
  const mockUpsert = mock.fn();

  beforeEach(() => {
    mockUpsert.mock.resetCalls();
    const fromChain = {
      upsert: mockUpsert,
    };
    mock.method(supabase, 'from', () => fromChain);
  });

  it('deve chamar upsert em stock_notifications com product_id, user_id e email', async () => {
    mockUpsert.mock.mockImplementationOnce(async (_data: unknown, _opts: unknown) => ({
      data: null,
      error: null,
    }));

    const result = await upsertStockNotification(
      'product-123',
      'user-456',
      'user@example.com'
    );

    assert.strictEqual(result.error, null);
    assert.strictEqual(mockUpsert.mock.calls.length, 1);
    const [data, opts] = mockUpsert.mock.calls[0].arguments;
    assert.deepStrictEqual(data, {
      product_id: 'product-123',
      user_id: 'user-456',
      email: 'user@example.com',
    });
    assert.deepStrictEqual(opts, { onConflict: 'product_id,user_id' });
  });

  it('deve retornar error quando o Supabase falhar', async () => {
    const supabaseError = new Error('Constraint violation');
    mockUpsert.mock.mockImplementationOnce(async () => ({
      data: null,
      error: supabaseError,
    }));

    const result = await upsertStockNotification('p1', 'u1', 'e@e.com');

    assert.strictEqual(result.error, supabaseError);
  });
});
