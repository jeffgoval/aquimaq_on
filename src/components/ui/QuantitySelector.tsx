import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  disabled?: boolean;
  showMaxMessage?: boolean;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  value,
  min,
  max,
  onChange,
  disabled = false,
  showMaxMessage = true,
}) => {
  const clamped = Math.max(min, Math.min(max, value));
  const atMin = clamped <= min;
  const atMax = clamped >= max;

  const handleDecrement = () => {
    if (!atMin) onChange(clamped - 1);
  };

  const handleIncrement = () => {
    if (!atMax) onChange(clamped + 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value, 10);
    if (!Number.isNaN(parsed) && parsed >= min && parsed <= max) {
      onChange(parsed);
    } else if (e.target.value === '') {
      onChange(min);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || atMin}
          aria-label="Diminuir quantidade"
          className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Minus size={18} />
        </button>
        <input
          type="number"
          min={min}
          max={max}
          value={clamped}
          onChange={handleInputChange}
          disabled={disabled}
          className="w-16 h-10 text-center border border-gray-200 rounded-lg font-semibold text-gray-900 focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          aria-label="Quantidade"
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || atMax}
          aria-label="Aumentar quantidade"
          className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>
      {showMaxMessage && atMax && max > 0 && (
        <p className="text-xs text-amber-600 font-medium">
          Estoque máximo disponível
        </p>
      )}
    </div>
  );
};

export default QuantitySelector;
