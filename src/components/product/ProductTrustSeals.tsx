import React from 'react';
import { ShieldCheck, Truck, CreditCard, RefreshCcw } from 'lucide-react';

export interface TrustSealItem {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}

interface ProductTrustSealsProps {
  seals: TrustSealItem[];
  /** 'desktop' = below gallery (hidden on mobile), 'mobile' = below CTAs (hidden on desktop) */
  variant: 'desktop' | 'mobile';
}

export const ProductTrustSeals: React.FC<ProductTrustSealsProps> = ({ seals, variant }) => {
  const isDesktop = variant === 'desktop';
  return (
    <div
      className={
        isDesktop
          ? 'hidden lg:grid grid-cols-4 gap-3 mt-5 p-4 bg-gray-50 rounded-xl border border-gray-100'
          : 'lg:hidden grid grid-cols-4 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100'
      }
    >
      {seals.map(({ icon: Icon, label }) => (
        <div key={label} className="flex flex-col items-center gap-1.5 text-center">
          <div
            className={
              isDesktop
                ? 'w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100'
                : 'w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100'
            }
          >
            <Icon size={isDesktop ? 16 : 14} className="text-agro-700" />
          </div>
          <span
            className={
              isDesktop
                ? 'text-[11px] font-medium text-gray-600 leading-tight'
                : 'text-[10px] font-medium text-gray-500 leading-tight'
            }
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
};
