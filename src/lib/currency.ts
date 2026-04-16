/**
 * Currency conversion utilities
 * Using ExchangeRate-API (free tier: 1500 requests/month)
 */

const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest/';

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  date: string;
}

let cachedRates: ExchangeRates | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 3600000; // 1 hour

export async function getExchangeRates(base: string = 'USD'): Promise<ExchangeRates> {
  const now = Date.now();
  
  // Return cached rates if still valid
  if (cachedRates && cachedRates.base === base && now - cacheTime < CACHE_DURATION) {
    return cachedRates;
  }
  
  try {
    const response = await fetch(`${EXCHANGE_RATE_API}${base}`);
    const data = await response.json();
    
    cachedRates = {
      base: data.base,
      rates: data.rates,
      date: data.date,
    };
    cacheTime = now;
    
    return cachedRates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    // Return fallback rates if API fails
    return {
      base: 'USD',
      rates: {
        USD: 1,
        EUR: 0.92,
        GBP: 0.79,
        AED: 3.67,
        CAD: 1.36,
        AUD: 1.52,
      },
      date: new Date().toISOString().split('T')[0],
    };
  }
}

export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  if (from === to) return amount;
  
  const rates = await getExchangeRates(from);
  const rate = rates.rates[to];
  
  if (!rate) {
    throw new Error(`Exchange rate not found for ${from} to ${to}`);
  }
  
  return Number((amount * rate).toFixed(2));
}

export const COMMON_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
];
