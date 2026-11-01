import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChartNoAxesCombined } from 'lucide-react';
import useCurrency from '../../utils/useCurrency';

const CATEGORY_COLORS = ['#C5F542', '#7CC7B4', '#E3B95C', '#FF786D', '#82965A', '#8CA6A0'];

const DonutRing = ({ segments, size = 148, strokeWidth = 19 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#292D20"
        strokeWidth={strokeWidth}
      />
      {segments.map((segment) => {
        const length = (segment.percentage / 100) * circumference;
        const circle = (
          <circle
            key={segment.name}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={-(offset * circumference) / 100 + circumference * 0.25}
            strokeLinecap="butt"
          />
        );
        offset += segment.percentage;
        return circle;
      })}
    </svg>
  );
};

const BudgetDonut = ({ transactions = [], monthlySpent = 0, monthlyBudgetLimit }) => {
  const navigate = useNavigate();
  const fmt = useCurrency();
  const expenseTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.type === 'expense' && Number(transaction.amount) > 0),
    [transactions]
  );
  const spentByCategory = useMemo(() => {
    const categoryTotals = new Map();
    expenseTransactions.forEach((transaction) => {
      const name = transaction.category?.trim() || 'Uncategorized';
      categoryTotals.set(name, (categoryTotals.get(name) || 0) + Number(transaction.amount));
    });
    return [...categoryTotals.entries()].sort((a, b) => b[1] - a[1]);
  }, [expenseTransactions]);

  const totalSpent = expenseTransactions.length
    ? expenseTransactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0)
    : Number(monthlySpent) || 0;
  const limit = Number(monthlyBudgetLimit);
  const hasBudget = monthlyBudgetLimit !== null
    && monthlyBudgetLimit !== undefined
    && Number.isFinite(limit);
  const usedPercent = hasBudget && limit > 0
    ? Math.min(100, Math.round((totalSpent / limit) * 100))
    : null;
  const segments = spentByCategory.map(([name, amount], index) => ({
    name,
    amount,
    percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));

  return (
    <section className="flex h-full flex-col rounded-2xl border border-[#292D20] bg-[#15180F] p-5 sm:p-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C5F542]/10 text-[#C5F542]">
            <ChartNoAxesCombined size={17} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-[#F4F5ED]">Budget & spending</h2>
            <p className="mt-0.5 text-[10px] text-[#929684]">This month · expense transactions</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/budget')}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C5F542] hover:underline"
        >
          View budget <ArrowRight size={12} />
        </button>
      </header>

      <div className="my-5 flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <DonutRing segments={segments} />
          <div className="absolute flex max-w-[110px] flex-col items-center text-center">
            <span className="font-mono text-lg font-bold text-[#F4F5ED]" data-financial="true">{fmt(totalSpent)}</span>
            <span className="mt-1 text-[9px] uppercase tracking-wider text-[#929684]">
              {usedPercent === null ? 'spent' : `${usedPercent}% of limit`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        {segments.length ? segments.slice(0, 5).map((segment) => (
          <div key={segment.name} className="flex items-center gap-2.5 text-xs">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
            <span className="min-w-0 flex-1 truncate text-[#929684]">{segment.name}</span>
            <span className="font-mono text-[11px] font-semibold text-[#F4F5ED]">{fmt(segment.amount)}</span>
          </div>
        )) : (
          <p className="py-2 text-center text-xs text-[#929684]">
            No expense transactions recorded this month.
          </p>
        )}
      </div>

      <footer className="mt-4 border-t border-[#292D20] pt-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-[#929684]">Monthly budget limit</span>
          <span className="font-mono font-semibold text-[#F4F5ED]">
            {hasBudget ? fmt(limit) : 'Not set'}
          </span>
        </div>
      </footer>
    </section>
  );
};

export default BudgetDonut;
