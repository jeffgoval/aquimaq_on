import React from 'react';
import { Truck, MapPin, Store, Loader2 } from 'lucide-react';
import type { ShippingOption } from '@/types';
import { formatCurrency } from '@/utils/format';
import { MASK_INPUT_MAX_LENGTH, MASK_PLACEHOLDER, maskCEP } from '@/utils/masks';
import { validateCEP } from '@/utils/validators';

interface ProductShippingEstimatorProps {
  cep: string;
  onCepChange: (value: string) => void;
  onShippingErrorClear: () => void;
  shippingLoading: boolean;
  shippingError: string | null;
  shippingCalculated: boolean;
  shippingOptions: ShippingOption[];
  onCalculateShipping: (e: React.FormEvent) => void;
}

export const ProductShippingEstimator: React.FC<ProductShippingEstimatorProps> = ({
  cep,
  onCepChange,
  onShippingErrorClear,
  shippingLoading,
  shippingError,
  shippingCalculated,
  shippingOptions,
  onCalculateShipping,
}) => (
  <div className="border border-gray-200 rounded-xl overflow-hidden">
    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
      <Truck size={16} className="text-agro-700" />
      <span className="text-sm font-semibold text-gray-800">Calcular Frete e Prazo</span>
    </div>
    <div className="p-4">
      <form onSubmit={onCalculateShipping} className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <MapPin
            size={14}
            className="absolute left-3 top-3 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={cep}
            onChange={(e) => {
              onCepChange(maskCEP(e.target.value));
              onShippingErrorClear();
            }}
            placeholder={MASK_PLACEHOLDER.cep}
            maxLength={MASK_INPUT_MAX_LENGTH.cep}
            inputMode="numeric"
            autoComplete="postal-code"
            className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={shippingLoading || !validateCEP(cep)}
          className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 shrink-0"
        >
          {shippingLoading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            'Calcular'
          )}
        </button>
      </form>

      {shippingError && (
        <p className="text-amber-700 text-xs mb-3">{shippingError}</p>
      )}

      {shippingCalculated && (
        <div className="space-y-2">
          {shippingOptions.map((option) => (
            <div
              key={option.id}
              className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                {option.carrier === 'Loja Física' ? (
                  <Store size={14} className="text-gray-400 shrink-0" />
                ) : (
                  <Truck size={14} className="text-gray-400 shrink-0" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {option.carrier} — {option.service}
                  </p>
                  <p className="text-xs text-gray-500">
                    {option.estimatedDays === 0
                      ? 'Disponível imediatamente'
                      : `Até ${option.estimatedDays} dias úteis`}
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold shrink-0 ml-2">
                {option.price === 0 ? (
                  <span className="text-emerald-600">Grátis</span>
                ) : (
                  <span className="text-gray-900">
                    {formatCurrency(option.price)}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
