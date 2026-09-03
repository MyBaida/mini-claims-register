import { FALLBACK_RATES_TO_USD } from './currencies.js';

// Used when the live API is unreachable. Converts using USD as a pivot.
export function fallbackRate(fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return 1;
  return FALLBACK_RATES_TO_USD[toCurrency] / FALLBACK_RATES_TO_USD[fromCurrency];
}

// Returns { rate, source }, where source is 'same-currency', 'live', or 'fallback',
// so we always know (and can store) how a rate was actually obtained.
export async function getExchangeRate(fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) {
    return { rate: 1, source: 'same-currency' };
  }

  try {
    const from = fromCurrency.toLowerCase();
    const to = toCurrency.toLowerCase();
    const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${from}.json`;

    // This is to not let a slow/hanging API stall a payment being recorded.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`FX API responded with ${response.status}`);

    const data = await response.json();
    const rate = data[from]?.[to];

    if (typeof rate !== 'number') {
      throw new Error(`FX API did not return a rate for ${from} -> ${to}`);
    }

    return { rate, source: 'live' };
  } catch (err) {
    // Network error, timeout, bad response (any failure falls back quietly).
    return { rate: fallbackRate(fromCurrency, toCurrency), source: 'fallback' };
  }
}