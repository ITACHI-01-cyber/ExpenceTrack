import React, { useState, useEffect } from 'react';
import Button from './Button';
import api from '../../services/api';
import guestStorage from '../../services/guestStorage';
import useAuthStore from '../../store/authStore';

const EditBudgetModal = ({ isOpen, onClose, currentBudgetLimit, currentIncome, onSaveSuccess, isGuest }) => {
  const currency = useAuthStore((state) => state.user?.currency);
  const [formData, setFormData] = useState({
    budgetLimit: currentBudgetLimit ?? '',
    monthlyIncome: currentIncome ?? ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setFormData({
        budgetLimit: currentBudgetLimit ?? '',
        monthlyIncome: currentIncome ?? ''
      });
    }
  }, [isOpen, currentBudgetLimit, currentIncome]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError('');
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const budgetLimitText = String(formData.budgetLimit ?? '').trim();
    const incomeText = String(formData.monthlyIncome ?? '').trim();

    if (!budgetLimitText) {
      setError('Monthly budget limit is required.');
      return;
    }

    if (!incomeText) {
      setError('Expected monthly income is required.');
      return;
    }

    const rawBudgetLimit = Number(budgetLimitText);
    const rawMonthlyIncome = Number(incomeText);

    if (!Number.isFinite(rawBudgetLimit) || rawBudgetLimit < 0) {
      setError('Monthly budget limit must be a valid non-negative number.');
      return;
    }

    if (!Number.isFinite(rawMonthlyIncome) || rawMonthlyIncome < 0) {
      setError('Expected monthly income must be a valid non-negative number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const now = new Date();
      const payload = {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        budgetLimit: rawBudgetLimit,
        monthlyIncome: rawMonthlyIncome
      };

      if (isGuest) {
        guestStorage.budget.save(payload);
        onSaveSuccess?.();
        onClose();
      } else {
        const res = await api.post('/budget', payload);
        if (res.data.success) {
          onSaveSuccess?.();
          onClose();
        }
      }
    } catch (err) {
      console.error('Failed to save budget', err);
      setError(err.response?.data?.message || err.message || 'Unable to save budget settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background max-w-md w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-border">
        <div className="border-b border-border p-6">
          <h2 className="text-xl font-bold text-primary">Set Monthly Limits</h2>
          <p className="mt-1 text-sm text-neutral-muted">Update your expected monthly income and budget limit.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label htmlFor="monthly-income" className="mb-2 block text-sm font-semibold text-neutral-text">
              Expected Monthly Income{currency ? ` (${currency})` : ''}
            </label>
            <input
              id="monthly-income"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              name="monthlyIncome"
              value={formData.monthlyIncome}
              onChange={handleChange}
              placeholder="e.g. 50,000"
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-neutral-text placeholder:text-neutral-muted/80 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              aria-invalid={Boolean(error)}
              required
            />
          </div>

          <div>
            <label htmlFor="budget-limit" className="mb-2 block text-sm font-semibold text-neutral-text">
              Monthly Budget Limit{currency ? ` (${currency})` : ''}
            </label>
            <input
              id="budget-limit"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              name="budgetLimit"
              value={formData.budgetLimit}
              onChange={handleChange}
              placeholder="e.g. 35,000"
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-neutral-text placeholder:text-neutral-muted/80 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              aria-invalid={Boolean(error)}
              required
            />
          </div>

          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBudgetModal;
