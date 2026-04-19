'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  exiting?: boolean;
}

interface ToastContextValue {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider />');
  }
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Variant styles                                                     */
/* ------------------------------------------------------------------ */

const variantConfig: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; bg: string; border: string; text: string; iconColor: string }
> = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    iconColor: 'text-green-500',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    iconColor: 'text-red-500',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    iconColor: 'text-blue-500',
  },
};

/* ------------------------------------------------------------------ */
/*  Single toast                                                       */
/* ------------------------------------------------------------------ */

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const config = variantConfig[item.variant];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={cn(
        'pointer-events-auto flex w-80 items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm',
        'transition-all duration-300 ease-out',
        item.exiting
          ? 'translate-x-full opacity-0'
          : 'translate-x-0 opacity-100 animate-[slideIn_0.3s_ease-out]',
        config.bg,
        config.border,
      )}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', config.iconColor)} />
      <p className={cn('flex-1 text-sm font-medium', config.text)}>{item.message}</p>
      <button
        onClick={() => onDismiss(item.id)}
        className={cn(
          'shrink-0 rounded-md p-1 transition-colors hover:bg-black/5',
          config.text,
        )}
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Provider + Toaster                                                 */
/* ------------------------------------------------------------------ */

let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    );
    // Remove from DOM after the exit animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = `toast-${++idCounter}`;
      setToasts((prev) => [...prev, { id, message, variant }]);
      // Auto-dismiss after 3 seconds
      setTimeout(() => dismiss(id), 3000);
    },
    [dismiss],
  );

  const toast = {
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    info: (message: string) => addToast(message, 'info'),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Toaster (renders all active toasts)                                */
/* ------------------------------------------------------------------ */

function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-3"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} item={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
