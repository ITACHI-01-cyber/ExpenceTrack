import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import FintechChartTooltip from '../ui/FintechChartTooltip';
import useReducedMotion from '../../utils/useReducedMotion';

const PERIODS = [
  { label: '7d', days: 7 },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
];

const ExpenseStatsChart = ({ data, allTransactions = [] }) => {
  const [activePeriod, setActivePeriod] = useState(1); // default 14d
  const prefersReducedMotion = useReducedMotion();

  // Build daily expense data based on selected period from real transactions
  const chartData = useMemo(() => {
    const days = PERIODS[activePeriod].days;
    const now = new Date();
    const result = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      result.push({ date: dateStr, label, value: 0 });
    }

    // Fill with actual transaction data
    if (allTransactions.length > 0) {
      allTransactions.forEach(tx => {
        if (tx.type === 'expense') {
          const txDate = new Date(tx.date).toISOString().split('T')[0];
          const entry = result.find(r => r.date === txDate);
          if (entry) {
            entry.value += tx.amount;
          }
        }
      });
    } else if (data && data.length > 0 && data[0].date !== 'No Data') {
      // Fallback to passed-in data
      return data;
    }

    return result;
  }, [activePeriod, allTransactions, data]);

  // Calculate total and percentage change
  const { total, percentChange, isPositive, avgDaily } = useMemo(() => {
    const total = chartData.reduce((sum, d) => sum + d.value, 0);
    const days = PERIODS[activePeriod].days;
    const halfPoint = Math.floor(days / 2);
    
    const firstHalf = chartData.slice(0, halfPoint).reduce((s, d) => s + d.value, 0);
    const secondHalf = chartData.slice(halfPoint).reduce((s, d) => s + d.value, 0);
    
    let percentChange = 0;
    if (firstHalf > 0) {
      percentChange = ((secondHalf - firstHalf) / firstHalf) * 100;
    }
    
    const avgDaily = days > 0 ? total / days : 0;

    return { total, percentChange, isPositive: percentChange >= 0, avgDaily };
  }, [chartData, activePeriod]);

  // Find the last non-zero data point for the reference dot
  const lastDataPoint = useMemo(() => {
    for (let i = chartData.length - 1; i >= 0; i--) {
      if (chartData[i].value > 0) return { ...chartData[i], index: i };
    }
    return chartData[chartData.length - 1];
  }, [chartData]);

  const formatTotal = (num) => {
    if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return num.toLocaleString();
    return num.toString();
  };

  return (
    <div className="flex h-full flex-col rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
      {/* Header with period toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-muted">Expense trend</p>
        <div className="flex rounded-full border border-border bg-background p-0.5">
          {PERIODS.map((period, idx) => (
            <button
              key={period.label}
              onClick={() => setActivePeriod(idx)}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                activePeriod === idx
                  ? 'bg-surface text-neutral-text shadow-sm'
                  : 'text-neutral-muted hover:text-neutral-text'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Big number + percentage */}
      <div className="flex items-baseline gap-3 mb-1">
        <h2 className="text-3xl font-extrabold tracking-tight text-neutral-text tabular-nums sm:text-4xl">
          ₹{formatTotal(total)}
        </h2>
        {total > 0 && (
          <span className={`flex items-center gap-0.5 text-sm font-semibold ${
            isPositive ? 'text-emerald-500' : 'text-red-400'
          }`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(percentChange).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="expense-trend-chart mt-3 min-h-[145px] w-full min-w-0 flex-1 overflow-hidden rounded-2xl px-1 py-2 sm:min-h-[170px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={145} initialDimension={{ width: 320, height: 170 }}>
          <AreaChart data={chartData} margin={{ top: 12, right: 12, left: 2, bottom: 0 }}>
            <defs>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#b9a3ff" stopOpacity={0.32} />
                <stop offset="65%" stopColor="#8c6be5" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#8c6be5" stopOpacity={0} />
              </linearGradient>
              <filter id="expensePointGlow" x="-150%" y="-150%" width="400%" height="400%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 7" />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={42}
              tick={{ fill: 'var(--chart-axis)', fontSize: 9 }}
              tickFormatter={(value) => value >= 1000 ? `${Math.round(value / 1000)}k` : value}
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--chart-axis)', fontSize: 9 }}
              dy={8}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <Tooltip
              content={<FintechChartTooltip seriesLabels={{ value: 'Expenses' }} />}
              cursor={{ stroke: 'var(--chart-grid)', strokeDasharray: '3 4' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#b9a3ff"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#expenseGradient)"
              dot={{ r: 3, fill: '#ddd2ff', stroke: '#6e51b2', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#ffffff', stroke: '#a78bfa', strokeWidth: 4, style: { filter: 'drop-shadow(0 0 6px rgba(185, 163, 255, 0.9))' } }}
              animationDuration={prefersReducedMotion ? 0 : 900}
              animationEasing="ease-out"
              isAnimationActive={!prefersReducedMotion}
            />
            {lastDataPoint && lastDataPoint.value > 0 && (
              <ReferenceDot
                x={lastDataPoint.label}
                y={lastDataPoint.value}
                r={7}
                fill="#ffffff"
                stroke="#a78bfa"
                strokeWidth={3}
                style={{ filter: 'drop-shadow(0 0 7px rgba(185, 163, 255, 0.85))' }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom stats */}
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary-light"></div>
          <span className="text-xs text-neutral-muted">Avg/day</span>
          <span className="text-xs font-semibold text-neutral-text tabular-nums">₹{Math.round(avgDaily).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-neutral-muted"></div>
          <span className="text-xs text-neutral-muted">Transactions</span>
          <span className="text-xs font-semibold text-neutral-text tabular-nums">
            {allTransactions.filter(t => t.type === 'expense').length || '—'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ExpenseStatsChart;
