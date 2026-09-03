// The only currencies this system supports.
export const SUPPORTED_CURRENCIES = ['GHS', 'USD', 'GBP', 'EUR'];

// Fixed approximate rates for seed purposes and if the live FX API is unreachable.
// Rates are expressed as 1 USD = X of the given currency (e.g. 1 USD = 12 GHS).
// Not live data, just a safety net.
export const FALLBACK_RATES_TO_USD = {
  USD: 1,
  GHS: 12,
  GBP: 0.79,
  EUR: 0.92,
};