/**
 * BudgetDonut.jsx — fixed: useCurrency hook only in main BudgetDonut component
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target } from 'lucide-react';
import useCurrency from '../../utils/useCurrency';

const CATEGORY_COLORS = [
  '#7C3AED',
  '#A78BFA',
  '#C4B5FD',
  '#374151',
  '#6B7280',
  '#9CA3AF',
  '#4F46E5',
  '#818CF8',
];

/* ── SVG Donut ring component — pure, no hooks ── */
const DonutRing = ({ segments, size = 160, strokeWidth = 22 }) => {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Track */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#EDE9FE"
        strokeWidth={strokeWidth}
      />
      {segments.map((seg, i) => {
        const length = (seg.pct / 100) * circumference;
        const element = (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={-(offset * circumference) / 100 + circumference * 0.25}
            strokeLinecap="butt"
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        );
        offset += seg.pct;
        return element;
      })}
    </svg>
  );
};

/* ── Main Component ── */
const BudgetDonut = ({ budget, monthlySpent, monthlyBudgetLimit }) => {
  const navigate = useNavigate();
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const fmt = useCurrency();

  const categories = budget?.categories || [];
  const hasCategories = categories.length > 0;

  const totalSpent = hasCategories
    ? categories.reduce((s, c) => s + (Number(c.spentAmount) || 0), 0)
    : monthlySpent || 0;

  const segments = hasCategories
    ? categories
        .filter((c) => Number(c.spentAmount) > 0)
        .map((c, i) => ({
          name: c.name,
          spent: Number(c.spentAmount) || 0,
          budget: Number(c.budgetAmount) || 0,
          pct: totalSpent > 0 ? Math.round((Number(c.spentAmount) / totalSpent) * 100) : 0,
          color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
        }))
    : [];

  const budgetLimit = monthlyBudgetLimit || budget?.budgetLimit || 0;
  const utilizationPct = budgetLimit > 0 ? Math.min(100, Math.round((totalSpent / budgetLimit) * 100)) : 0;

  const displaySegments =
    segments.length > 0
      ? segments
      : budgetLimit > 0
        ? [
            { name: 'Spent', spent: totalSpent, pct: utilizationPct, color: '#7C3AED' },
            { name: 'Remaining', spent: budgetLimit - totalSpent, pct: 100 - utilizationPct, color: '#EDE9FE' },
          ]
        : [];

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Target size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-text">Budget</h2>
            <p className="text-[10px] text-neutral-muted">This month</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/budget')}
          className="text-[11px] font-semibold text-primary hover:underline"
        >
          View all →
        </button>
      </div>

      {/* Donut + center text */}
      <div className="my-4 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <DonutRing
            segments={displaySegments.length > 0 ? displaySegments : [{ pct: 100, color: '#EDE9FE' }]}
            size={150}
            strokeWidth={20}
          />
          <div className="absolute flex flex-col items-center text-center">
            <span className="text-[10px] font-semibold text-neutral-muted">
              {utilizationPct}%
            </span>
            <span className="font-mono text-base font-black tracking-tight text-neutral-text">
              {fmt(totalSpent)}
            </span>
            <span className="text-[9px] text-neutral-muted">of {fmt(budgetLimit || totalSpent)}</span>
          </div>
        </div>
      </div>

      {/* Category list */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {segments.length > 0 ? (
          segments.slice(0, 6).map((seg, i) => (
            <button
              key={seg.name}
              type="button"
              onClick={() => navigate('/budget')}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                hoveredIdx === i ? 'bg-neutral-50 dark:bg-neutral-800' : ''
              }`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <span className="flex-1 truncate text-[11px] font-medium text-neutral-text">
                {seg.name}
              </span>
              <span className="shrink-0 font-mono text-[11px] font-semibold tabular-nums text-neutral-text">
                {fmt(seg.spent)}
              </span>
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
            <p className="text-xs font-semibold text-neutral-muted">No budget set</p>
            <button
              type="button"
              onClick={() => navigate('/budget')}
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              Configure budget →
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      {budgetLimit > 0 && (
        <div className="mt-3 border-t border-border/60 pt-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-neutral-muted">Total for month</span>
            <span className="font-mono font-bold tabular-nums text-neutral-text">
              {fmt(budgetLimit)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetDonut;
