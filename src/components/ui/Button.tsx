import React from 'react';
import { cn } from '@/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-lg shadow-orange-200/60 disabled:bg-gray-300 disabled:shadow-none',
  secondary:
    'bg-white border-2 border-agro-600 text-agro-700 hover:bg-agro-50 active:bg-agro-100 disabled:border-gray-200 disabled:text-gray-400',
  outline:
    'bg-white border border-gray-200 text-gray-600 hover:bg-agro-50 hover:text-agro-700 hover:border-agro-300 disabled:opacity-40',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'py-4 text-base',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  disabled,
  type = 'button',
  ...rest
}) => (
  <button
    type={type}
    disabled={disabled}
    className={cn(
      'rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed',
      variantClasses[variant],
      size === 'lg' ? 'py-4' : sizeClasses[size],
      variant === 'primary' && size === 'lg' && 'w-full',
      variant === 'secondary' && size === 'lg' && 'w-full py-3.5',
      className
    )}
    {...rest}
  >
    {children}
  </button>
);
