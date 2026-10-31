/**
 * SummaryCards.jsx
 * Four financial summary cards: Total Balance, Income, Expenses, Total Savings.
 * All values come from real API data passed as props.
 */
import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Wallet, Target, Pencil, TrendingUp, TrendingDown } from 'lucide-react';
import useCurrency from '../../utils/useCurrency';

const Card = ({ icon: Icon, iconBg, iconText, label, sublabel, value, valueClass, badge, onEdit, trend, trendValue }) => (
  <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg} ${iconText}`}>
        <Icon size={18} />
      </span>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="text-[10px] font-medium text-neutral-muted">{badge}</span>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            title="Edit"
            aria-label="Edit"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-muted transition-all hover:bg-primary/10 hover:text-primary"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>
    </div>

    <div className="mt-4">
      <p className="truncate text-xs font-semibold text-neutral-muted">{label}</p>
      <p className={`mt-1 truncate font-mono text-xl font-bold tracking-tight tabular-nums ${valueClass || 'text-neutral-text'}`}>
        {value}
      </p>
      {sublabel && (
        <p className="mt-1 text-[10px] text-neutral-muted">{sublabel}</p>
      )}
    </div>

    {(trend !== undefined && trendValue !== null && trendValue !== undefined) && (
      <div className="mt-3">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
          trend === 'up'
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
            : trend === 'down'
              ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/40'
              : 'bg-neutral-100 text-neutral-muted dark:bg-neutral-800'
        }`}>
          {trend === 'up' ? <TrendingUp size={10} /> : trend === 'down' ? <TrendingDown size={10} /> : null}
          {trendValue !== null ? `${Math.abs(trendValue).toFixed(1)}% vs last month` : 'vs last month'}
        </span>
      </div>
    )}
  </div>
);

const SummaryCards = ({
  totalBalance,
  monthlyIncome,
  monthlyExpenses,
  totalSavings,
  savingsGoalTotal,
  onEditBudget,
}) => {
  const fmt = useCurrency();
  // Savings: use actual completed goal amounts, no inference
  const savingsValue = totalSavings ?? 0;

  return (
    <section
      aria-label="Monthly financial metrics"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch"
    >
      {/* 1. Total Balance */}
      <Card
        icon={Wallet}
        iconBg="bg-primary/10"
        iconText="text-primary"
        label="Total Balance"
        value={fmt(totalBalance)}
        badge="All wallets"
      />

      {/* 2. Monthly Income */}
      <Card
        icon={ArrowDownLeft}
        iconBg="bg-emerald-50 dark:bg-emerald-950/40"
        iconText="text-emerald-600 dark:text-emerald-400"
        label="Monthly Income"
        value={fmt(monthlyIncome)}
        onEdit={onEditBudget}
      />

      {/* 3. Expenses */}
      <Card
        icon={ArrowUpRight}
        iconBg="bg-rose-50 dark:bg-rose-950/40"
        iconText="text-rose-500"
        label="Expenses"
        value={fmt(monthlyExpenses)}
        badge="Total outflow"
      />

      {/* 4. Total Savings */}
      <Card
        icon={Target}
        iconBg="bg-violet-50 dark:bg-violet-950/40"
        iconText="text-violet-600"
        label="Total Savings"
        value={fmt(savingsValue)}
        sublabel={savingsGoalTotal > 0 ? `Goal: ${fmt(savingsGoalTotal)}` : undefined}
      />
    </section>
  );
};

export default SummaryCards;
