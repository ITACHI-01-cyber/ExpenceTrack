/**
 * MoneyFlowChart.jsx
 * Income vs Expense bar chart with Week / Month / Year period filter
 * and optional account (wallet) filter.
 * All data is aggregated from real transaction records passed as props.
 */
import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { BarChart3, ChevronDown } from 'lucide-react';
import useCurrency from '../../utils/useCurrency';

/* ── Period definitions ── */
const PERIODS = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];

/* ── Date helpers ── */
const startOfDay = (d) => {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
};

const dayLabel = (d) =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const monthLabel = (d) =>
  d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
const weekLabel = (d) => d.toLocaleDateString('en-US', { weekday: 'short' });

/* ── Custom Tooltip ── */
const FlowTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-lg">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-muted">
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-[11px]">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.fill }}
          />
          <span className="font-medium text-neutral-muted capitalize">{entry.name}</span>
          <span className="ml-auto font-bold tabular-nums text-neutral-text">
            {entry.value?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ── Main Component ── */
const MoneyFlowChart = ({ allTransactions = [], wallets = [] }) => {
  const [period, setPeriod] = useState('month');
  const [selectedWalletId, setSelectedWalletId] = useState('all');
  const fmt = useCurrency();

  /* ── Filter transactions by wallet ── */
  const filteredTx = useMemo(() => {
    if (selectedWalletId === 'all') return allTransactions;
    return allTransactions.filter((tx) => tx.walletId === selectedWalletId);
  }, [allTransactions, selectedWalletId]);

  /* ── Aggregate into chart buckets ── */
  const chartData = useMemo(() => {
    const now = startOfDay(new Date());

    if (period === 'week') {
      // Last 7 days
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        days.push({
          label: weekLabel(d),
          dateStart: startOfDay(d),
          dateEnd: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999),
          income: 0,
          expense: 0,
        });
      }
      filteredTx.forEach((tx) => {
        const txDate = new Date(tx.date);
        const amount = Number(tx.amount) || 0;
        if (amount <= 0) return;
        for (const bucket of days) {
          if (txDate >= bucket.dateStart && txDate <= bucket.dateEnd) {
            if (tx.type === 'income') bucket.income += amount;
            else if (tx.type === 'expense') bucket.expense += amount;
            break;
          }
        }
      });
      return days;
    }

    if (period === 'month') {
      // Current month by week (W1–W5)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const weeks = [];
      const cur = new Date(monthStart);
      let wn = 1;
      while (cur <= monthEnd) {
        const weekEnd = new Date(cur);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const clampedEnd =
          weekEnd > monthEnd
            ? new Date(monthEnd)
            : new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate(), 23, 59, 59, 999);
        weeks.push({
          label: `W${wn}`,
          dateStart: new Date(cur),
          dateEnd: clampedEnd,
          income: 0,
          expense: 0,
        });
        cur.setDate(cur.getDate() + 7);
        wn++;
      }
      filteredTx.forEach((tx) => {
        const txDate = new Date(tx.date);
        const amount = Number(tx.amount) || 0;
        if (amount <= 0) return;
        for (const bucket of weeks) {
          if (txDate >= bucket.dateStart && txDate <= bucket.dateEnd) {
            if (tx.type === 'income') bucket.income += amount;
            else if (tx.type === 'expense') bucket.expense += amount;
            break;
          }
        }
      });
      return weeks;
    }

    // year — aggregate by month (last 12 months)
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      months.push({
        label: monthLabel(d),
        dateStart: d,
        dateEnd: mEnd,
        income: 0,
        expense: 0,
      });
    }
    filteredTx.forEach((tx) => {
      const txDate = new Date(tx.date);
      const amount = Number(tx.amount) || 0;
      if (amount <= 0) return;
      for (const bucket of months) {
        if (txDate >= bucket.dateStart && txDate <= bucket.dateEnd) {
          if (tx.type === 'income') bucket.income += amount;
          else if (tx.type === 'expense') bucket.expense += amount;
          break;
        }
      }
    });
    return months;
  }, [filteredTx, period]);

  const hasData = chartData.some((d) => d.income > 0 || d.expense > 0);

  // Summary totals
  const totalIncome = chartData.reduce((s, d) => s + d.income, 0);
  const totalExpense = chartData.reduce((s, d) => s + d.expense, 0);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BarChart3 size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-text">Money Flow</h2>
            <p className="text-[10px] text-neutral-muted">Income vs Expenses</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Wallet filter */}
          {wallets.length > 0 && (
            <div className="relative">
              <select
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                className="h-7 appearance-none rounded-full border border-border bg-surface pl-3 pr-7 text-[11px] font-medium text-neutral-text outline-none hover:border-primary/40 focus:border-primary cursor-pointer"
              >
                <option value="all">All accounts</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.cardName || w.bankName || w.cardType}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-muted"
              />
            </div>
          )}

          {/* Period selector */}
          <div className="flex rounded-full border border-border bg-bg p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all duration-150 ${
                  period === p.key
                    ? 'bg-surface text-neutral-text shadow-sm'
                    : 'text-neutral-muted hover:text-neutral-text'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary numbers */}
      <div className="mt-4 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#7C3AED]" />
          <span className="text-[10px] font-medium text-neutral-muted">Income</span>
          <span className="ml-1 font-mono text-xs font-bold tabular-nums text-neutral-text">
            {fmt(totalIncome)}          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#C4B5FD]" />
          <span className="text-[10px] font-medium text-neutral-muted">Expense</span>
          <span className="ml-1 font-mono text-xs font-bold tabular-nums text-neutral-text">
            {fmt(totalExpense)}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-4 flex-1 min-h-[200px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <BarChart
              data={chartData}
              barCategoryGap="30%"
              barGap={4}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke="#EBE8F3" strokeDasharray="4 6" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9E97B3', fontSize: 10, fontWeight: 500 }}
                dy={6}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={44}
                tick={{ fill: '#9E97B3', fontSize: 10, fontWeight: 500 }}
                tickFormatter={(v) =>
                  Math.abs(v) >= 100000
                    ? `${(v / 100000).toFixed(1)}L`
                    : Math.abs(v) >= 1000
                      ? `${(v / 1000).toFixed(0)}k`
                      : v.toString()
                }
              />
              <Tooltip content={<FlowTooltip />} cursor={{ fill: 'rgba(112,70,184,0.05)' }} />
              <Bar dataKey="income" name="Income" fill="#7C3AED" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="expense" name="Expense" fill="#C4B5FD" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-50 dark:bg-neutral-800">
              <BarChart3 size={22} className="text-neutral-muted" />
            </div>
            <p className="text-xs font-semibold text-neutral-muted">No transactions yet</p>
            <p className="text-[10px] text-neutral-muted">
              Your money flow will appear once you record transactions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoneyFlowChart;
