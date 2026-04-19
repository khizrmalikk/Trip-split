'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { COMMON_CURRENCIES } from './currency';

const STORAGE_KEY = 'dap_preferred_currency';

interface CurrencyContextValue {
  currency: string;
  setCurrency: (code: string) => void;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: 'USD',
  setCurrency: () => {},
  symbol: '$',
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState('USD');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && COMMON_CURRENCIES.find((c) => c.code === stored)) {
      setCurrencyState(stored);
    }
  }, []);

  const setCurrency = (code: string) => {
    setCurrencyState(code);
    localStorage.setItem(STORAGE_KEY, code);
  };

  const symbol = COMMON_CURRENCIES.find((c) => c.code === currency)?.symbol ?? '$';

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, symbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
