import React from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import { Wallet } from 'lucide-react';

const DENOMINATIONS = [500, 100, 20, 1];

const breakdownNotes = (amount = 0) => {
  let remaining = Math.floor(Number(amount || 0));
  const result = {};
  DENOMINATIONS.forEach((d) => {
    result[d] = Math.floor(remaining / d);
    remaining = remaining % d;
  });
  return result;
};

const NotePill = ({ denom, count }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="rounded-md bg-white/10 px-3 py-2 font-semibold text-sm">{count}×</div>
    <div className="text-xs opacity-80">₹{denom}</div>
  </div>
);

const BigWallet = ({ wallets = [], selectedId, onSelect, onAddMoney, onEdit, onRemove }) => {
  const selected = wallets.find((w) => w.id === selectedId) || wallets[0] || null;
  const notes = breakdownNotes(selected?.balance || 0);

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="mx-auto w-full max-w-2xl rounded-2xl bg-gradient-to-r from-primary/70 to-secondary/60 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-white/90">My Wallet</div>
            <div className="mt-2 text-3xl font-extrabold text-white">
              {formatCurrency(selected?.balance || 0)}
            </div>
            <div className="mt-1 text-xs text-white/80">{selected ? (selected.bankName || selected.cardType || 'Cash') : 'No accounts'}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/10 p-3 text-white/90"><Wallet /></div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {DENOMINATIONS.map((d) => (
              <NotePill key={d} denom={d} count={notes[d]} />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onAddMoney && selected && (
              <button
                type="button"
                onClick={() => onAddMoney(selected)}
                className="inline-flex items-center justify-center rounded-full bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Add balance
              </button>
            )}

            {onEdit && selected && (
              <button
                type="button"
                onClick={() => onEdit(selected)}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Edit selected card
              </button>
            )}

            {onRemove && selected && (
              <button
                type="button"
                onClick={() => onRemove(selected)}
                className="inline-flex items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/20"
              >
                Remove selected card
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto py-2 px-1">
        {wallets.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => onSelect?.(w.id)}
            className={`min-w-[170px] rounded-2xl border p-3 text-left shadow-sm transition ${w.id === selected?.id ? 'border-primary/30 ring-2 ring-primary/20 bg-white/10' : 'border-white/10 hover:shadow-md'}`}
            aria-current={w.id === selected?.id ? 'true' : undefined}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{w.bankName || w.cardType || 'Account'}</div>
                <div className="mt-1 text-xs opacity-80 truncate">{w.cardNumber ? `•••• ${String(w.cardNumber).slice(-4)}` : (w.cardType === 'upi' ? w.cardNumber : 'Cash')}</div>
              </div>
              <div className="text-sm font-bold whitespace-nowrap">{formatCurrency(w.balance || 0)}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BigWallet;
