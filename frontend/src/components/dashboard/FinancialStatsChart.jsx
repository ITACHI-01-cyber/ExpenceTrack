import React, { useState, useMemo, useCallback } from 'react';
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
import { formatCurrency } from '../../utils/formatCurrency';
import useReducedMotion from '../../utils/useReducedMotion';

/* ── Metric definitions ── */
const METRICS = [
  { key: 'expenses', label: 'Expenses', color: '#8B5CF6', gradientFrom: '#C4B5FD', gradientTo: '#8B5CF6' },
  { key: 'income', label: 'Income', color: '#10B981', gradientFrom: '#6EE7B7', gradientTo: '#10B981' },
  { key: 'net', label: 'Net Cash Flow', color: '#6366F1', gradientFrom: '#A5B4FC', gradientTo: '#6366F1' },
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

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const dayLabel = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const monthLabel = (d) => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

/* ── ISO week helper ── */
const getISOWeek = (d) => {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
};

/* ── Custom Tooltip ── */
const StatsTooltip = ({ active, payload, label, metricLabel, metricColor }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  return (
    <div className="rounded-2xl border border-[#EBE8F3] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(25,15,45,0.12)]">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#77728A]">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: metricColor }}
        />
        <span className="text-[11px] font-medium text-[#77728A]">{metricLabel}</span>
        <span className="ml-auto text-sm font-bold tabular-nums text-[#171329]">
          {formatCurrency(val)}
        </span>
      </div>
    </div>
  );
};

/* ── Main component ── */
const FinancialStatsChart = ({ allTransactions = [] }) => {
  const [activeMetric, setActiveMetric] = useState(0); // 0=expenses, 1=income, 2=net
  const [activePeriod, setActivePeriod] = useState(1); // 0=week, 1=month, 2=year
  const prefersReducedMotion = useReducedMotion();

  const metric = METRICS[activeMetric];
  const period = PERIODS[activePeriod];

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
  }, [allTransactions, activeMetric, activePeriod, metric.key, period.key]);

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
    <div className="flex h-full flex-col rounded-[1.75rem] border border-[#EBE8F3] bg-white p-5 shadow-[0_10px_30px_rgba(25,15,45,0.03)]">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1EBFB] text-[#6936F5]">
            <BarChart3 size={17} />
          </div>
          <h2 className="text-sm font-extrabold text-[#171329]">Financial Statistics</h2>
        </div>

        {/* Period selector */}
        <div className="flex rounded-full border border-[#EBE8F3] bg-[#FAF8FD] p-0.5">
          {PERIODS.map((p, idx) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setActivePeriod(idx)}
              className={`rounded-full px-3.5 py-1 text-[11px] font-semibold transition-all duration-200 ${
                activePeriod === idx
                  ? 'bg-white text-[#171329] shadow-sm'
                  : 'text-[#77728A] hover:text-[#171329]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
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
                ? 'bg-[#171329] text-white shadow-sm'
                : 'bg-[#F5F3FA] text-[#77728A] hover:bg-[#EBE8F3] hover:text-[#171329]'
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
        <p className="text-2xl font-black tabular-nums tracking-tight text-[#171329]">
          {metric.key === 'net' && total < 0 ? '-' : ''}
          {formatCurrency(Math.abs(total))}
        </p>
        {percentChange !== null && (
          <span
            className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
              trend === 'up'
                ? metric.key === 'expenses'
                  ? 'bg-[#FEF2F2] text-[#EF4444]'
                  : 'bg-[#ECFDF5] text-[#10B981]'
                : trend === 'down'
                  ? metric.key === 'expenses'
                    ? 'bg-[#ECFDF5] text-[#10B981]'
                    : 'bg-[#FEF2F2] text-[#EF4444]'
                  : 'bg-[#F5F3FA] text-[#77728A]'
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
        <p className="mt-0.5 text-[10px] text-[#9E97B3]">
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
                stroke="#EBE8F3"
                strokeDasharray="4 6"
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
                domain={yDomain}
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9E97B3', fontSize: 10, fontWeight: 500 }}
                dy={8}
                interval="preserveStartEnd"
                minTickGap={32}
              />
              <Tooltip
                content={
                  <StatsTooltip metricLabel={metric.label} metricColor={metric.color} />
                }
                cursor={{ stroke: '#D6D0E5', strokeDasharray: '4 4' }}
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
                  fill: '#ffffff',
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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5F3FA]">
              <BarChart3 size={22} className="text-[#B8B2C8]" />
            </div>
            <p className="text-xs font-semibold text-[#9E97B3]">No {metric.label.toLowerCase()} data</p>
            <p className="text-[10px] text-[#B8B2C8]">
              Transactions will appear here once recorded.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialStatsChart;
