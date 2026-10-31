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
    return { icon: ArrowDownLeft, bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400' };
  }
  if (cat.includes('food') || cat.includes('grocer') || cat.includes('din') || cat.includes('cafe') || cat.includes('restaur')) {
    return { icon: Utensils, bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-500' };
  }
  if (cat.includes('health') || cat.includes('med') || cat.includes('fit')) {
    return { icon: Heart, bg: 'bg-pink-50 dark:bg-pink-950/40', text: 'text-pink-500' };
  }
  if (cat.includes('shop') || cat.includes('cloth') || cat.includes('buy') || cat.includes('amazon') || cat.includes('fashion')) {
    return { icon: ShoppingBag, bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-500' };
  }
  if (cat.includes('travel') || cat.includes('transport') || cat.includes('uber') || cat.includes('cab') || cat.includes('taxi')) {
    return { icon: Car, bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-500' };
  }
  if (cat.includes('home') || cat.includes('rent') || cat.includes('house') || cat.includes('util')) {
    return { icon: Home, bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-500' };
  }
  if (cat.includes('tech') || cat.includes('gadget') || cat.includes('electr') || cat.includes('laptop') || cat.includes('subscri')) {
    return { icon: Laptop, bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-500' };
  }
  if (cat.includes('bill') || cat.includes('electric') || cat.includes('internet') || cat.includes('phone')) {
    return { icon: Zap, bg: 'bg-yellow-50 dark:bg-yellow-950/40', text: 'text-yellow-600' };
  }
  if (cat.includes('coffee') || cat.includes('beverage')) {
    return { icon: Coffee, bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-500' };
  }
  return { icon: MoreHorizontal, bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-muted' };
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
const RecentTransactions = ({ transactions = [], loading = false }) => {
  const navigate = useNavigate();
  const fmt = useCurrency();
  const displayTx = transactions.slice(0, 5);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ReceiptText size={16} />
          </div>
          <h2 className="text-sm font-bold text-neutral-text">Recent Transactions</h2>
        </div>
        <button
          type="button"
          onClick={() => navigate('/transactions')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:underline"
        >
          See all <ArrowRight size={13} />
        </button>
      </div>

      {/* Column headers */}
      <div className="mt-3 hidden grid-cols-[1fr_auto_auto_auto] gap-x-4 text-[10px] font-bold uppercase tracking-wider text-neutral-muted sm:grid">
        <span>Payment name · Category</span>
        <span className="w-28 text-right">Method</span>
        <span className="w-20 text-right">Amount</span>
      </div>

      {/* Rows */}
      <div className="mt-1 flex-1 divide-y divide-border/40">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : displayTx.length > 0 ? (
          displayTx.map((tx) => {
            const details = getCategoryDetails(tx.category, tx.type);
            const Icon = details.icon;
            const isExpense = tx.type === 'expense';
            return (
              <div
                key={tx.id || Math.random()}
                className="grid grid-cols-1 items-center gap-x-4 py-3 sm:grid-cols-[1fr_auto_auto]"
              >
                {/* Name + category */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${details.bg} ${details.text}`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-neutral-text">
                      {tx.description || tx.category || 'Transaction'}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-neutral-muted">
                      {tx.category || '—'} · {formatTxDate(tx.date)}
                    </p>
                  </div>
                </div>

                {/* Payment method */}
                <div className="hidden sm:block">
                  <span className="truncate font-mono text-[11px] text-neutral-muted">
                    {tx.walletName || tx.paymentMethod || '—'}
                  </span>
                </div>

                {/* Amount */}
                <div className="mt-1 text-right sm:mt-0">
                  <p className={`font-mono text-xs font-bold tabular-nums ${
                    isExpense ? 'text-neutral-text' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {isExpense ? `- ${fmt(tx.amount)}` : `+ ${fmt(tx.amount)}`}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <ReceiptText size={28} className="text-neutral-muted opacity-40" />
            <p className="text-xs font-semibold text-neutral-muted">No recent transactions</p>
            <button
              type="button"
              onClick={() => navigate('/transactions')}
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              Add your first transaction →
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      {!loading && displayTx.length > 0 && (
        <div className="border-t border-border/60 pt-3 text-right">
          <span className="text-[10px] text-neutral-muted font-mono">
            Showing latest {displayTx.length} of your transactions
          </span>
        </div>
      )}
    </div>
  );
};

export default RecentTransactions;
