import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface AlertDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onClose: () => void;
  tone?: 'danger' | 'warning' | 'info';
}

const TONE_STYLES: Record<NonNullable<AlertDialogProps['tone']>, {
  icon: React.ReactNode;
  title: string;
  button: string;
}> = {
  danger: {
    icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
    title: 'text-stone-900',
    button: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    title: 'text-stone-900',
    button: 'bg-stone-900 hover:bg-stone-700 text-white',
  },
  info: {
    icon: <AlertTriangle className="w-5 h-5 text-blue-600" />,
    title: 'text-stone-900',
    button: 'bg-stone-900 hover:bg-stone-700 text-white',
  },
};

export const AlertDialog: React.FC<AlertDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = 'OK',
  onClose,
  tone = 'warning',
}) => {
  if (!open) return null;

  const styles = TONE_STYLES[tone];

  return (
    <div
      className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl border border-stone-200 overflow-hidden">
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              {styles.icon}
              <h3 className={cn('text-base font-semibold', styles.title)}>{title}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md hover:bg-stone-100 text-stone-500"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-stone-600 text-sm mt-3 whitespace-pre-wrap">{description}</p>
        </div>

        <div className="px-5 pb-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={cn('px-4 py-2 text-sm font-medium rounded-lg transition-colors', styles.button)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

