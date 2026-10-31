/**
 * SavingsGoals.jsx
 * Displays individual savings goals with progress bars.
 * Connected to real goals API data.
 * Supports: add, edit, delete, toggle completion.
 */
import React from 'react';
import { Target, Plus, Pencil, Check, Trash2 } from 'lucide-react';
import useCurrency from '../../utils/useCurrency';

/* ── Individual goal row ── */
const GoalRow = ({ goal, onEdit, onToggle, onDelete }) => {
  const fmt = useCurrency();
  const target = Number(goal.amount) || 0;
  const saved = Number(goal.savedAmount) || (goal.completed ? target : 0);
  const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
  const isCompleted = goal.completed || pct >= 100;

  // Pick a color based on goal name hash
  const colors = ['#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];
  const colorIdx = goal.name
    ? goal.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length
    : 0;
  const barColor = colors[colorIdx];

  return (
    <div className="group relative flex flex-col gap-1.5 rounded-xl border border-border/60 bg-neutral-50/60 dark:bg-neutral-800/40 p-3 transition hover:border-border">
      {/* Name + amount + actions */}
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-bold text-neutral-text">{goal.name}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-mono text-xs font-semibold tabular-nums text-neutral-text">
            {fmt(target)}
          </span>
          {/* Action buttons — visible on hover */}
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onToggle?.(goal, !goal.completed)}
              title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
              className={`flex h-6 w-6 items-center justify-center rounded-md transition ${
                isCompleted
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-neutral-100 text-neutral-muted hover:bg-emerald-100 hover:text-emerald-600 dark:bg-neutral-700'
              }`}
            >
              <Check size={11} />
            </button>
            <button
              type="button"
              onClick={() => onEdit?.(goal)}
              title="Edit goal"
              className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-100 text-neutral-muted transition hover:bg-primary/10 hover:text-primary dark:bg-neutral-700"
            >
              <Pencil size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>

      {/* Progress label */}
      <div className="flex items-center justify-between">
        <span
          className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold"
          style={{ backgroundColor: `${barColor}1A`, color: barColor }}
        >
          {pct}%
        </span>
        {isCompleted && (
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            ✓ Completed
          </span>
        )}
        {!isCompleted && saved > 0 && (
          <span className="font-mono text-[10px] text-neutral-muted">
            {fmt(saved)} saved
          </span>
        )}
      </div>
    </div>
  );
};

/* ── Main Component ── */
const SavingsGoals = ({
  goals = [],
  loading = false,
  onAddGoal,
  onEditGoal,
  onToggleGoal,
}) => {
  const totalTarget = goals.reduce((s, g) => s + (Number(g.amount) || 0), 0);
  const totalSaved = goals.reduce((s, g) => {
    const saved = Number(g.savedAmount) || (g.completed ? Number(g.amount) || 0 : 0);
    return s + saved;
  }, 0);
  const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Target size={16} />
          </div>
          <h2 className="text-sm font-bold text-neutral-text">Saving Goals</h2>
        </div>
        <button
          type="button"
          onClick={onAddGoal}
          aria-label="Add savings goal"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary transition hover:bg-primary/20"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Overall progress summary */}
      {goals.length > 0 && (
        <div className="mt-4">
          <p className="font-mono text-3xl font-black tracking-tight text-neutral-text">
            {overallPct}%
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-muted">Goal target</p>
              <p className="font-mono font-bold tabular-nums text-neutral-text">
                {fmt(totalTarget)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-neutral-muted">Saved</p>
              <p className="font-mono font-bold tabular-nums text-neutral-text">
                {fmt(totalSaved)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Goal list */}
      <div className="mt-4 flex-1 space-y-2.5 overflow-y-auto">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
          ))
        ) : goals.length > 0 ? (
          goals.map((goal) => (
            <GoalRow
              key={goal.id}
              goal={goal}
              onEdit={onEditGoal}
              onToggle={onToggleGoal}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <Target size={28} className="text-neutral-muted opacity-40" />
            <p className="text-xs font-semibold text-neutral-muted">No savings goals yet</p>
            <p className="text-[10px] text-neutral-muted">
              Create your first goal to track progress.
            </p>
          </div>
        )}
      </div>

      {/* Add goal CTA */}
      <button
        type="button"
        onClick={onAddGoal}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-xs font-semibold text-primary transition hover:border-primary/50 hover:bg-primary/5"
      >
        <Plus size={14} /> Add savings goal
      </button>
    </div>
  );
};

export default SavingsGoals;
