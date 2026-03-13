import { supabase } from '@/services/supabase';
import { formatCurrency } from '@/utils/format';
import type { Coupon } from '@/types';

/**
 * Valida um código de cupom no frontend.
 * A validação definitiva ocorre na Edge Function de checkout (anti-fraude).
 */
export async function validateCoupon(code: string, subtotal: number): Promise<Coupon> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .eq('active', true)
    .single();

  if (error || !data) throw new Error('Cupom inválido ou não encontrado.');

  const coupon = data as Coupon;

  if (coupon.expiration_date && new Date(coupon.expiration_date) < new Date()) {
    throw new Error('Este cupom está expirado.');
  }

  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    throw new Error('Este cupom já atingiu o limite de usos.');
  }

  if (subtotal < coupon.min_purchase_amount) {
    throw new Error(
      `Compra mínima de ${formatCurrency(coupon.min_purchase_amount)} para usar este cupom.`
    );
  }

  return coupon;
}
