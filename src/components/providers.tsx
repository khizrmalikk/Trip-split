'use client';

import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/toast';
import { CurrencyProvider } from '@/lib/currency-context';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CurrencyProvider>
      <ToastProvider>{children}</ToastProvider>
    </CurrencyProvider>
  );
}
