import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import FintechChartTooltip from './FintechChartTooltip';
import useReducedMotion from '../../utils/useReducedMotion';

const TransactionStatsCard3D = ({ transactions = [] }) => {
  const prefersReducedMotion = useReducedMotion();
  const { chartData, totalExpenses, changeAmount, changePercent } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, now.getMonth() - i, 1);
      months.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        monthNum: d.getMonth(),
        yearNum: d.getFullYear(),
        value: 0,
      });
    }

    transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        const txDate = new Date(tx.date);
        const entry = months.find(
          (m) => m.monthNum === txDate.getMonth() && m.yearNum === txDate.getFullYear()
        );
        if (entry) entry.value += tx.amount;
      }
    });

    let running = 0;
    const chartData = months.map((month) => {
      running += month.value;
      return { ...month, trend: running };
    });

    const totalExpenses = months.reduce((sum, month) => sum + month.value, 0);
    const currentMonth = months[months.length - 1]?.value || 0;
    const prevMonth = months[months.length - 2]?.value || 0;
    const changeAmount = currentMonth - prevMonth;
    const changePercent = prevMonth > 0 ? (changeAmount / prevMonth) * 100 : 0;

    return { chartData, totalExpenses, changeAmount, changePercent };
  }, [transactions]);

  return (
    <section className="flex h-full min-h-[250px] w-full min-w-0 flex-col rounded-card border border-border bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-muted">Activity overview</p>
          <h2 className="mt-1 text-sm font-bold text-neutral-text">Expenses · last 6 months</h2>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">6 MONTHS</span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-2xl font-extrabold tracking-tight text-neutral-text tabular-nums">
          {formatCurrency(totalExpenses)}
        </p>
        <span className={`mb-1 inline-flex items-center gap-1 text-xs font-semibold ${changeAmount > 0 ? 'text-danger' : 'text-success'}`}>
          {changeAmount > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {changeAmount > 0 ? '+' : ''}{changePercent.toFixed(1)}%
        </span>
      </div>

      <div className="mt-3 min-h-[120px] w-full min-w-0 flex-1">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={120} initialDimension={{ width: 320, height: 120 }}>
          <BarChart data={chartData} margin={{ top: 14, right: 4, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="monthlyExpenseBars" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9b7aea" />
                <stop offset="100%" stopColor="#563290" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 6" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
              dy={5}
            />
            <YAxis hide domain={[0, 'dataMax + 10%']} />
            <Tooltip content={<FintechChartTooltip seriesLabels={{ value: 'Expenses' }} />} cursor={{ fill: 'rgba(109,75,195,0.08)' }} />
            <Bar
              dataKey="value"
              fill="url(#monthlyExpenseBars)"
              background={{ fill: 'var(--chart-grid)', radius: [7, 7, 0, 0] }}
              radius={[7, 7, 0, 0]}
              maxBarSize={30}
              animationDuration={prefersReducedMotion ? 0 : 750}
              isAnimationActive={!prefersReducedMotion}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default TransactionStatsCard3D;
