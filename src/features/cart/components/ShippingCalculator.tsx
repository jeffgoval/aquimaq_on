import React, { useState } from 'react';
import { Truck, MapPin, Loader2, Store } from 'lucide-react';
import { calculateShipping } from '@/services/shippingService';
import { validateCEP } from '@/utils/validators';
import { maskCEP } from '@/utils/masks';
import { formatCurrency } from '@/utils/format';
import { CartItem, ShippingOption } from '@/types';
import { useStore } from '@/contexts/StoreContext';

interface ShippingCalculatorProps {
  cartTotal: number;
  items?: CartItem[];
  onSelectOption: (option: ShippingOption | null) => void;
  selectedOptionId?: string;
  initialZip?: string;
  /** Chamado quando o CEP é validado e o frete é calculado (para persistir no contexto). */
  onZipValid?: (rawZip: string) => void;
}

const ShippingCalculator: React.FC<ShippingCalculatorProps> = ({
  cartTotal,
  items = [],
  onSelectOption,
  selectedOptionId,
  initialZip,
  onZipValid
}) => {
  const { settings } = useStore();
  const whatsappNumber = settings?.phone?.replace(/\D/g, '') ?? import.meta.env.VITE_WHATSAPP_NUMBER ?? '';
  const [cep, setCep] = useState(initialZip ? maskCEP(initialZip) : '');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [calculated, setCalculated] = useState(false);

  /* State to track previous items for comparison or debounce */
  const [debouncedItems, setDebouncedItems] = useState(items);

  // Auto-calculate if initialZip is present e válido
  React.useEffect(() => {
    if (initialZip && validateCEP(initialZip)) {
      setCep(maskCEP(initialZip));
      calculate(true); // Preserve selection on initial load (fix persistence)
    }
  }, [initialZip]);

  // Debounce items change to trigger recalc
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedItems(items);
    }, 800);
    return () => clearTimeout(timer);
  }, [items]);

  // Trigger recalc when debounced items change, if ZIP is valid
  React.useEffect(() => {
    if (validateCEP(cep) && debouncedItems.length > 0 && calculated) {
      calculate(true); // Preserve selection if possible
    }
  }, [debouncedItems]);

  const calculate = async (preserveSelection = false) => {
    const rawCep = cep.replace(/\D/g, '');
    if (!validateCEP(cep)) {
      if (!initialZip) setError('Digite um CEP válido (8 dígitos).');
      return;
    }

    setLoading(true);
    setError(null);
    if (!preserveSelection) {
      setCalculated(false);
      onSelectOption(null);
    }

    try {
      const { options: newOptions, error: shippingError } = await calculateShipping(rawCep, items);
      setOptions(newOptions);
      setCalculated(true);
      onZipValid?.(rawCep);

      if (shippingError) {
        setError(shippingError);
      } else {
        setError(null);
      }

      if (preserveSelection && selectedOptionId) {
        const stillExists = newOptions.find(r => r.id === selectedOptionId);
        if (stillExists) {
          onSelectOption(stillExists);
        } else {
          onSelectOption(null);
        }
      } else if (!preserveSelection) {
        onSelectOption(null);
      }

    } catch (err) {
      console.error(err);
      setOptions([
        { id: 'pickup_store', carrier: 'Loja Física', service: 'Retirada no Balcão', price: 0, estimatedDays: 0 }
      ]);
      setCalculated(true);
      setError('Frete indisponível no momento. Você pode escolher retirada na loja.');
      onSelectOption(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    calculate();
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCep(maskCEP(e.target.value));
    if (error) setError(null);
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
        <Truck className="mr-2" size={18} />
        Calcular Frete e Prazo
      </h3>

      <form onSubmit={handleCalculate} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={cep}
            onChange={handleCepChange}
            placeholder="00000-000"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-agro-500 focus:border-agro-500 text-sm"
            maxLength={9}
          />
          <MapPin size={16} className="absolute left-3 top-2.5 text-gray-400" />
        </div>
        <button
          type="submit"
          disabled={loading || !validateCEP(cep)}
          className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Calcular'}
        </button>
      </form>

      {error && (
        <div className="mb-3">
          <p className="text-amber-800 text-xs">{error}</p>
        </div>
      )}

      {calculated && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
          {options.map((option) => (
            <div
              key={option.id}
              onClick={() => onSelectOption(option)}
              className={`
                relative flex justify-between items-center p-3 rounded-lg border cursor-pointer transition-all
                ${selectedOptionId === option.id
                  ? 'border-agro-500 bg-agro-50 ring-1 ring-agro-500'
                  : 'border-gray-200 bg-white hover:border-agro-300'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`
                  w-4 h-4 rounded-full border flex items-center justify-center
                  ${selectedOptionId === option.id ? 'border-agro-600' : 'border-gray-300'}
                `}>
                  {selectedOptionId === option.id && <div className="w-2 h-2 rounded-full bg-agro-600" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    {option.carrier === 'Loja Física' ? <Store size={14} /> : null}
                    {option.carrier} - {option.service}
                  </p>
                  <p className="text-xs text-gray-500">
                    {option.estimatedDays === 0
                      ? 'Disponível imediatamente'
                      : `Até ${option.estimatedDays} dias úteis`}
                  </p>
                </div>
              </div>
              <span className="font-semibold text-gray-900 text-sm">
                {option.price === 0
                  ? 'Grátis'
                  : formatCurrency(option.price)
                }
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShippingCalculator;
