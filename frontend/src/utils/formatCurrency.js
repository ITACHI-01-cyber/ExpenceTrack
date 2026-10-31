/**
 * formatCurrency
 * Formats a monetary value with the correct locale and symbol for the given currency.
 *
 * @param {number} value
 * @param {string} currency  ISO-4217 code, e.g. 'INR', 'USD', 'EUR'. Defaults to 'INR'.
 * @returns {string}
 */
export const formatCurrency = (value, currency = 'INR') => {
  const code = (currency || 'INR').toUpperCase();

  // Sensible locale per currency for proper grouping/decimal formatting
  const localeMap = {
    INR: 'en-IN',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    JPY: 'ja-JP',
    AED: 'ar-AE',
    SGD: 'en-SG',
    CAD: 'en-CA',
    AUD: 'en-AU',
  };
  const locale = localeMap[code] || 'en-IN';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  } catch {
    // Fallback for any unknown currency code
    return `${code} ${Number(value || 0).toFixed(2)}`;
  }
};
