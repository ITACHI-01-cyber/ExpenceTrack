/**
 * RecentTransactions.jsx — fixed: useCurrency hook only in main component
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReceiptText,
  ArrowRight,
  Utensils,
  Heart,
  ShoppingBag,
  ArrowDownLeft,
  ArrowUpRight,
  MoreHorizontal,
  Car,
  Home,
  Laptop,
  Zap,
  Coffee,
} from 'lucide-react';
import useCurrency from '../../utils/useCurrency';

/* ── Category icon mapping — pure function, no hooks ── */
const getCategoryDetails = (category, type) => {
  const cat = (category || '').toLowerCase();
  if (type === 'income') {
    return { icon: ArrowDownLeft, bg: 'bg-[#C5F542]/10', text: 'text-[#C5F542]' };
  }
  if (cat.includes('food') || cat.includes('grocer') || cat.includes('din') || cat.includes('cafe') || cat.includes('restaur')) {
    return { icon: Utensils, bg: 'bg-[#292D20]', text: 'text-[#C5F542]' };
  }
  if (cat.includes('health') || cat.includes('med') || cat.includes('fit')) {
    return { icon: Heart, bg: 'bg-[#292D20]', text: 'text-[#C5F542]' };
  }
  if (cat.includes('shop') || cat.includes('cloth') || cat.includes('buy') || cat.includes('amazon') || cat.includes('fashion')) {
    return { icon: ShoppingBag, bg: 'bg-[#292D20]', text: 'text-[#C5F542]' };
  }
  if (cat.includes('travel') || cat.includes('transport') || cat.includes('uber') || cat.includes('cab') || cat.includes('taxi')) {
    return { icon: Car, bg: 'bg-[#292D20]', text: 'text-[#C5F542]' };
  }
  if (cat.includes('home') || cat.includes('rent') || cat.includes('house') || cat.includes('util')) {
    return { icon: Home, bg: 'bg-[#292D20]', text: 'text-[#C5F542]' };
  }
  if (cat.includes('tech') || cat.includes('gadget') || cat.includes('electr') || cat.includes('laptop') || cat.includes('subscri')) {
    return { icon: Laptop, bg: 'bg-[#292D20]', text: 'text-[#C5F542]' };
  }
  if (cat.includes('bill') || cat.includes('electric') || cat.includes('internet') || cat.includes('phone')) {
    return { icon: Zap, bg: 'bg-[#292D20]', text: 'text-[#C5F542]' };
  }
  if (cat.includes('coffee') || cat.includes('beverage')) {
    return { icon: Coffee, bg: 'bg-[#292D20]', text: 'text-[#C5F542]' };
  }
  return { icon: MoreHorizontal, bg: 'bg-[#292D20]', text: 'text-[#929684]' };
};

/* ── Date formatter — pure function, no hooks ── */
const formatTxDate = (dateStr) => {
  if (!dateStr) return '—';
  const txDate = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isToday = txDate.toDateString() === now.toDateString();
  const isYesterday = txDate.toDateString() === yesterday.toDateString();
  const timeStr = txDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today ${timeStr}`;
  if (isYesterday) return `Yesterday ${timeStr}`;
  return `${txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${timeStr}`;
};

/* ── Skeleton loader ── */
const SkeletonRow = () => (
  <div className="flex items-center gap-3 py-3">
    <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 w-32 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
      <div className="h-2.5 w-20 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
    </div>
    <div className="h-3 w-16 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
  </div>
);

/* ── Main Component ── */
const RecentTransactions = ({ transactions = [], wallets = [], loading = false }) => {
  const navigate = useNavigate();
  const fmt = useCurrency();
  const displayTx = transactions.slice(0, 5);

  return (
    <section className="flex h-full flex-col rounded-2xl border border-[#292D20] bg-[#15180F] p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#292D20] pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C5F542]/10 text-[#C5F542]">
            <ReceiptText size={16} />
          </div>
          <h2 className="text-sm font-bold text-[#F4F5ED]">Recent transactions</h2>
        </div>
        <button
          type="button"
          onClick={() => navigate('/transactions')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#C5F542] transition hover:underline"
        >
          See all <ArrowRight size={13} />
        </button>
      </div>

      {/* Column headers */}
      <div className="mt-3 hidden grid-cols-[1fr_auto_auto] gap-x-4 text-[10px] font-bold uppercase tracking-wider text-[#929684] sm:grid">
        <span>Payment name · Category</span>
        <span className="w-28 text-right">Method</span>
        <span className="w-20 text-right">Amount</span>
      </div>

      {/* Rows */}
      <div className="mt-1 flex-1 divide-y divide-[#292D20]">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : displayTx.length > 0 ? (
          displayTx.map((tx, index) => {
            const details = getCategoryDetails(tx.category, tx.type);
            const Icon = details.icon;
            const isExpense = tx.type === 'expense';
            return (
              <div
                key={`${tx.id || tx.date || 'transaction'}-${index}`}
                className="grid grid-cols-1 items-center gap-x-4 py-3 sm:grid-cols-[1fr_auto_auto]"
              >
                {/* Name + category */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${details.bg} ${details.text}`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-[#F4F5ED]">
                      {tx.description || tx.category || 'Transaction'}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-[#929684]">
                      {tx.category || '—'} · {formatTxDate(tx.date)}
                    </p>
                  </div>
                </div>

                {/* Payment method */}
                <div className="hidden sm:block">
                  <span className="truncate font-mono text-[11px] text-[#929684]">
                    {tx.walletName
                      || tx.paymentMethod
                      || wallets.find((wallet) => wallet.id === tx.walletId)?.cardName
                      || wallets.find((wallet) => wallet.id === tx.walletId)?.bankName
                      || '—'}
                  </span>
                </div>

                {/* Amount */}
                <div className="mt-1 text-right sm:mt-0">
                  <p className={`font-mono text-xs font-bold tabular-nums ${
                    isExpense ? 'text-[#F4F5ED]' : 'text-[#C5F542]'
                  }`}>
                    {isExpense ? `- ${fmt(tx.amount)}` : `+ ${fmt(tx.amount)}`}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <ReceiptText size={28} className="text-[#929684]" />
            <p className="text-xs font-semibold text-[#F4F5ED]">No recent transactions</p>
            <button
              type="button"
              onClick={() => navigate('/transactions')}
              className="text-[11px] font-semibold text-[#C5F542] hover:underline"
            >
              Add your first transaction →
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      {!loading && displayTx.length > 0 && (
        <div className="border-t border-[#292D20] pt-3 text-right">
          <span className="font-mono text-[10px] text-[#929684]">
            Showing latest {displayTx.length} of your transactions
          </span>
        </div>
      )}
    </section>
  );
};

export default RecentTransactions;
