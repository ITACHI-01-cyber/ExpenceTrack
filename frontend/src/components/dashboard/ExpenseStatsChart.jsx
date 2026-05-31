import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

const PERIODS = [
  { label: '7d', days: 7 },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
];

const ExpenseStatsChart = ({ data, allTransactions = [] }) => {
  const [activePeriod, setActivePeriod] = useState(1); // default 14d

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

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-100 text-xs">
          <p className="text-gray-500 mb-0.5">{payload[0].payload.label}</p>
          <p className="font-bold text-gray-900">₹{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  const formatTotal = (num) => {
    if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return num.toLocaleString();
    return num.toString();
  };

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border p-5 h-full flex flex-col sm:p-6">
      {/* Header with period toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Expenses</p>
        <div className="flex bg-background rounded-full p-0.5">
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
        <h2 className="text-3xl sm:text-4xl font-bold text-neutral-text tabular-nums tracking-tight">
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
      <div className="flex-1 min-h-[120px] w-full mt-2 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              dy={8}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#expenseGradient)"
              animationDuration={1200}
              animationEasing="ease-out"
            />
            {lastDataPoint && lastDataPoint.value > 0 && (
              <ReferenceDot
                x={lastDataPoint.label}
                y={lastDataPoint.value}
                r={5}
                fill="#10b981"
                stroke="white"
                strokeWidth={2}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom stats */}
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
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
