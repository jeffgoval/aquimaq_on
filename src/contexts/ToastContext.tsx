import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { ToastType } from '@/components/Toast';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ToastOptions {
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (message: string, type: ToastType, options?: ToastOptions) => void;
  hideToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let nextId = 1;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType, options?: ToastOptions) => {
    const id = nextId++;
    setToasts((prev) => [...prev, {
      id,
      message,
      type,
      duration: options?.duration,
      actionLabel: options?.actionLabel,
      onAction: options?.onAction,
    }]);
  }, []);

  const hideToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (ctx === undefined) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}

