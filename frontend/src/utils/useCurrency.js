/**
 * useCurrency.js
 * React hook that returns a currency-aware formatting function.
 *
 * Usage:
 *   const fmt = useCurrency();
 *   fmt(10000)  →  "₹10,000.00" (when user currency is INR)
 *               →  "$10,000.00" (when user currency is USD)
 *
 * All dashboard components should use this instead of calling
 * formatCurrency() with a hardcoded second argument.
 */
import { useCallback } from 'react';
import useAuthStore from '../store/authStore';
import { formatCurrency } from './formatCurrency';

const useCurrency = () => {
  const currency = useAuthStore((state) => state.user?.currency || 'INR');

  const fmt = useCallback(
    (value) => formatCurrency(value, currency),
    [currency]
  );

  return fmt;
};

export default useCurrency;
