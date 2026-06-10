import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

const AddBalanceModal = ({ wallet, isOpen, onClose, onConfirm }) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setAmount('');
    setError('');
  }, [isOpen, wallet]);

  if (!isOpen || !wallet) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter an amount greater than 0.');
      return;
    }

    try {
      onConfirm(numericAmount);
      onClose();
    } catch (saveError) {
      setError(saveError.message || 'Failed to add balance.');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-sm rounded-t-2xl bg-background p-5 shadow-2xl sm:rounded-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-primary">Add Balance</h2>
            <p className="mt-1 text-sm text-neutral-muted">
              {wallet.bankName || wallet.cardType}
              {wallet.cardNumber ? ` ending ${wallet.cardNumber.slice(-4)}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-neutral-muted hover:bg-white hover:text-primary"
            aria-label="Close add balance modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-text">Amount to Add</label>
            <input
              type="number"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setError('');
              }}
              min="0.01"
              step="0.01"
              autoFocus
              className="w-full rounded-lg border border-border bg-white px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="0.00"
            />
            {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Add Balance</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBalanceModal;
