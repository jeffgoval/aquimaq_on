import React from 'react';
import { cn } from '@/utils/cn';

type BadgeVariant = 'new' | 'bestSeller' | 'discount' | 'seasonal' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  new: 'bg-emerald-100 text-emerald-700',
  bestSeller: 'bg-amber-100 text-amber-700',
  discount: 'bg-red-100 text-red-600',
  seasonal: '', // caller passes custom class for seasonal
  default: 'bg-gray-100 text-gray-700',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className,
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full',
      variant !== 'seasonal' && variantClasses[variant],
      className
    )}
  >
    {children}
  </span>
);
