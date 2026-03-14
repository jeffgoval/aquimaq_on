import React from 'react';
import { AlertTriangle, CheckCircle, Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const LOW_STOCK_THRESHOLD = 5;

export type NotifyState = 'idle' | 'loading' | 'done' | 'error';

interface ProductStockNotifyProps {
  stock: number;
  notifyState: NotifyState;
  onNotify: () => void;
}

export const ProductStockNotify: React.FC<ProductStockNotifyProps> = ({
  stock,
  notifyState,
  onNotify,
}) => {
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= LOW_STOCK_THRESHOLD;

  if (isOutOfStock) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
          <AlertTriangle size={16} />
          <span className="text-sm font-semibold">Produto indisponível no momento</span>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={onNotify}
          disabled={notifyState === 'loading' || notifyState === 'done'}
          className="w-full border-2 border-agro-500"
        >
          {notifyState === 'done' ? (
            <>
              <BellOff size={15} /> Você será avisado!
            </>
          ) : notifyState === 'loading' ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Registrando...
            </>
          ) : (
            <>
              <Bell size={15} /> Avise-me quando disponível
            </>
          )}
        </Button>
        {notifyState === 'error' && (
          <p className="text-xs text-red-500 text-center">Erro ao registrar. Tente novamente.</p>
        )}
      </div>
    );
  }

  if (isLowStock) {
    return (
      <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
        <AlertTriangle size={16} />
        <span className="text-sm font-semibold">
          Restam apenas <strong>{stock}</strong> unidades em estoque!
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-emerald-700">
      <CheckCircle size={15} />
      <span className="text-sm font-medium">Em estoque ({stock} disponíveis)</span>
    </div>
  );
};
