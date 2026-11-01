import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import useCurrency from '../../utils/useCurrency';
import useReducedMotion from '../../utils/useReducedMotion';

/* ── Metric definitions ── */
const METRICS = [
  { key: 'expenses', label: 'Expenses', color: '#FF786D', gradientFrom: '#FFC0B8', gradientTo: '#FF786D' },
  { key: 'income', label: 'Income', color: '#C5F542', gradientFrom: '#E8FF9A', gradientTo: '#C5F542' },
  { key: 'net', label: 'Net Cash Flow', color: '#7CC7B4', gradientFrom: '#B3E8D9', gradientTo: '#7CC7B4' },
];

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

const dayLabel = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const monthLabel = (d) => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

/* ── Custom Tooltip ── */
const StatsTooltip = ({ active, payload, label, metricLabel, metricColor }) => {
  const fmt = useCurrency();
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  return (
    <div className="rounded-xl border border-[#3A3F2B] bg-[#15180F] px-4 py-3 shadow-xl">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#929684]">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: metricColor }}
        />
        <span className="text-[11px] font-medium text-[#929684]">{metricLabel}</span>
        <span className="ml-auto text-sm font-bold tabular-nums text-[#F4F5ED]">
          {fmt(val)}
        </span>
      </div>
    </div>
  );
};

/* ── Main component ── */
const FinancialStatsChart = ({ allTransactions = [], selectedPeriod = 'month' }) => {
  const fmt = useCurrency();
  const [activeMetric, setActiveMetric] = useState(0); // 0=expenses, 1=income, 2=net
  const prefersReducedMotion = useReducedMotion();

  const metric = METRICS[activeMetric];
  const period = PERIODS.find((item) => item.key === selectedPeriod) || PERIODS[1];

  /* ── Build aggregated chart data ── */
  const { chartData, prevChartData } = useMemo(() => {
    const now = startOfDay(new Date());

    const buildBuckets = (startDate, endDate, bucketMode) => {
      const buckets = [];

      if (bucketMode === 'day') {
        const cur = new Date(startDate);
        while (cur <= endDate) {
          buckets.push({
            dateStart: new Date(cur),
            dateEnd: new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), 23, 59, 59, 999),
            label: dayLabel(cur),
            income: 0,
            expenses: 0,
          });
          cur.setDate(cur.getDate() + 1);
        }
      } else if (bucketMode === 'week') {
        // For "month" period, aggregate by week
        const cur = new Date(startDate);
        let weekNum = 1;
        while (cur <= endDate) {
          const weekEnd = new Date(cur);
          weekEnd.setDate(weekEnd.getDate() + 6);
          const clampedEnd = weekEnd > endDate ? new Date(endDate) : weekEnd;
          buckets.push({
            dateStart: new Date(cur),
            dateEnd: new Date(clampedEnd.getFullYear(), clampedEnd.getMonth(), clampedEnd.getDate(), 23, 59, 59, 999),
            label: `W${weekNum}`,
            income: 0,
            expenses: 0,
          });
          cur.setDate(cur.getDate() + 7);
          weekNum++;
        }
      } else if (bucketMode === 'month') {
        const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        while (cur <= endDate) {
          const monthEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0, 23, 59, 59, 999);
          buckets.push({
            dateStart: new Date(cur),
            dateEnd: monthEnd > endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999) : monthEnd,
            label: monthLabel(cur),
            income: 0,
            expenses: 0,
          });
          cur.setMonth(cur.getMonth() + 1);
        }
      }

      return buckets;
    };

    // Determine current and previous ranges
    let currentStart, currentEnd, prevStart, prevEnd, bucketMode;

    if (period.key === 'week') {
      currentEnd = new Date(now);
      currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - 6);
      prevEnd = new Date(currentStart);
      prevEnd.setDate(prevEnd.getDate() - 1);
      prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - 6);
      bucketMode = 'day';
    } else if (period.key === 'month') {
      currentEnd = new Date(now);
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      bucketMode = 'day';
    } else {
      // year
      currentStart = new Date(now.getFullYear(), 0, 1);
      currentEnd = new Date(now);
      prevStart = new Date(now.getFullYear() - 1, 0, 1);
      prevEnd = new Date(now.getFullYear() - 1, 11, 31);
      bucketMode = 'month';
    }

    const currentBuckets = buildBuckets(currentStart, currentEnd, bucketMode);
    const prevBuckets = buildBuckets(prevStart, prevEnd, bucketMode);

    // Fill buckets with transaction data
    const fillBuckets = (buckets) => {
      allTransactions.forEach((tx) => {
        const txDate = new Date(tx.date);
        const amount = Number(tx.amount) || 0;
        if (amount <= 0) return;

        for (const bucket of buckets) {
          if (txDate >= bucket.dateStart && txDate <= bucket.dateEnd) {
            if (tx.type === 'expense') {
              bucket.expenses += amount;
            } else if (tx.type === 'income') {
              bucket.income += amount;
            }
            break;
          }
        }
      });
    };

    fillBuckets(currentBuckets);
    fillBuckets(prevBuckets);

    // Map to chart-ready format
    const mapBuckets = (buckets) =>
      buckets.map((b) => ({
        label: b.label,
        value:
          metric.key === 'expenses'
            ? b.expenses
            : metric.key === 'income'
              ? b.income
              : b.income - b.expenses,
      }));

    return {
      chartData: mapBuckets(currentBuckets),
      prevChartData: mapBuckets(prevBuckets),
    };
  }, [allTransactions, activeMetric, metric.key, period.key]);

  /* ── Summary stats ── */
  const { total, prevTotal, percentChange, trend } = useMemo(() => {
    const total = chartData.reduce((s, d) => s + d.value, 0);
    const prevTotal = prevChartData.reduce((s, d) => s + d.value, 0);

    let percentChange = null;
    let trend = 'flat';

    if (prevTotal !== 0) {
      percentChange = ((total - prevTotal) / Math.abs(prevTotal)) * 100;
      trend = percentChange > 0.5 ? 'up' : percentChange < -0.5 ? 'down' : 'flat';
    } else if (total > 0) {
      trend = 'up';
    } else if (total < 0) {
      trend = 'down';
    }

    return { total, prevTotal, percentChange, trend };
  }, [chartData, prevChartData]);

  /* ── Has any data? ── */
  const hasData = chartData.some((d) => d.value !== 0);

  /* ── Y-axis domain for net (can go negative) ── */
  const yDomain = useMemo(() => {
    if (metric.key === 'net') {
      const vals = chartData.map((d) => d.value);
      const min = Math.min(...vals, 0);
      const max = Math.max(...vals, 0);
      const padding = Math.max(Math.abs(max - min) * 0.1, 100);
      return [Math.floor(min - padding), Math.ceil(max + padding)];
    }
    return [0, 'auto'];
  }, [chartData, metric.key]);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#292D20] bg-[#15180F] p-5 sm:p-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C5F542]/10 text-[#C5F542]">
            <BarChart3 size={17} />
          </div>
          <h2 className="text-sm font-extrabold text-[#F4F5ED]">Financial Statistics</h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#929684]">{period.label} view</span>
      </div>

      {/* ── Metric tabs ── */}
      <div className="mt-3.5 flex gap-1.5">
        {METRICS.map((m, idx) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setActiveMetric(idx)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
              activeMetric === idx
                ? 'bg-[#C5F542] text-[#0B0D09]'
                : 'bg-[#10120C] text-[#929684] hover:bg-[#292D20] hover:text-[#F4F5ED]'
            }`}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: activeMetric === idx ? m.color : '#B8B2C8' }}
            />
            {m.label}
          </button>
        ))}
      </div>

      {/* ── Total + Comparison ── */}
      <div className="mt-4 flex items-baseline gap-2.5">
        <p className="text-2xl font-black tabular-nums tracking-tight text-[#F4F5ED]">
          {metric.key === 'net' && total < 0 ? '-' : ''}
          {fmt(Math.abs(total))}
        </p>
        {percentChange !== null && (
          <span
            className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
              trend === 'up'
                ? metric.key === 'expenses'
                  ? 'bg-[#351F1C] text-[#FF786D]'
                  : 'bg-[#253019] text-[#C5F542]'
                : trend === 'down'
                  ? metric.key === 'expenses'
                    ? 'bg-[#253019] text-[#C5F542]'
                    : 'bg-[#351F1C] text-[#FF786D]'
                  : 'bg-[#292D20] text-[#929684]'
            }`}
          >
            {trend === 'up' ? (
              <TrendingUp size={12} />
            ) : trend === 'down' ? (
              <TrendingDown size={12} />
            ) : (
              <Minus size={12} />
            )}
            {Math.abs(percentChange).toFixed(1)}%
          </span>
        )}
      </div>
      {percentChange !== null && (
        <p className="mt-0.5 text-[10px] text-[#929684]">
          vs previous {period.label.toLowerCase()}
        </p>
      )}

      {/* ── Chart area ── */}
      <div className="mt-3 min-h-[150px] w-full min-w-0 flex-1">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150}>
            <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`statsGrad-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={metric.gradientFrom} stopOpacity={0.35} />
                  <stop offset="85%" stopColor={metric.gradientTo} stopOpacity={0.04} />
                  <stop offset="100%" stopColor={metric.gradientTo} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="var(--chart-grid)"
                strokeDasharray="4 6"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={44}
                tick={{ fill: 'var(--chart-axis)', fontSize: 10, fontWeight: 500 }}
                tickFormatter={(v) =>
                  Math.abs(v) >= 100000
                    ? `${(v / 100000).toFixed(1)}L`
                    : Math.abs(v) >= 1000
                      ? `${(v / 1000).toFixed(0)}k`
                      : v.toString()
                }
                domain={yDomain}
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--chart-axis)', fontSize: 10, fontWeight: 500 }}
                dy={8}
                interval="preserveStartEnd"
                minTickGap={32}
              />
              <Tooltip
                content={
                  <StatsTooltip metricLabel={metric.label} metricColor={metric.color} />
                }
                cursor={{ stroke: 'var(--chart-axis)', strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={metric.color}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#statsGrad-${metric.key})`}
                dot={false}
                activeDot={{
                  r: 6,
                  fill: 'var(--card-bg)',
                  stroke: metric.color,
                  strokeWidth: 3,
                  style: {
                    filter: `drop-shadow(0 0 6px ${metric.color}66)`,
                  },
                }}
                animationDuration={prefersReducedMotion ? 0 : 800}
                animationEasing="ease-out"
                isAnimationActive={!prefersReducedMotion}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full min-h-[150px] flex-col items-center justify-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#10120C]">
              <BarChart3 size={22} className="text-[#929684]" />
            </div>
            <p className="text-xs font-semibold text-[#F4F5ED]">No {metric.label.toLowerCase()} data</p>
            <p className="text-[10px] text-[#929684]">
              Transactions will appear here once recorded.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialStatsChart;
