import React from 'react';
import { Check, Pencil, Plus, Target } from 'lucide-react';
import useCurrency from '../../utils/useCurrency';

const getGoalProgress = (goal) => {
  const target = Number(goal.amount) || 0;
  const saved = Number(goal.savedAmount) || (goal.completed ? target : 0);
  return {
    target,
    saved,
    remaining: Math.max(0, target - saved),
    percentage: target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0,
  };
};

const GoalRow = ({ goal, onEdit, onToggle }) => {
  const fmt = useCurrency();
  const { target, saved, remaining, percentage } = getGoalProgress(goal);
  const title = goal.title || goal.name || 'Savings goal';

  return (
    <article className="rounded-xl border border-[#292D20] bg-[#10120C] p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-xs font-semibold text-[#F4F5ED]">{title}</h3>
          <p className="mt-1 text-[10px] text-[#929684]">{goal.medium || 'Goal progress from saved account data'}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onToggle?.(goal, !goal.completed)}
            aria-label={goal.completed ? `Mark ${title} incomplete` : `Mark ${title} complete`}
            title={goal.completed ? 'Mark incomplete' : 'Mark complete'}
            className="rounded-md p-1.5 text-[#929684] transition hover:bg-[#292D20] hover:text-[#C5F542]"
          >
            <Check size={13} />
          </button>
          <button
            type="button"
            onClick={() => onEdit?.(goal)}
            aria-label={`Edit ${title}`}
            title="Edit goal"
            className="rounded-md p-1.5 text-[#929684] transition hover:bg-[#292D20] hover:text-[#C5F542]"
          >
            <Pencil size={12} />
          </button>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#292D20]">
        <div className="h-full rounded-full bg-[#C5F542] transition-all" style={{ width: `${percentage}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-[10px]">
        <span className="font-mono text-[#C5F542]">{fmt(saved)} saved</span>
        <span className="text-[#929684]">{fmt(remaining)} remaining · target {fmt(target)}</span>
      </div>
    </article>
  );
};

const SavingsGoals = ({ goals = [], loading = false, onAddGoal, onEditGoal, onToggleGoal }) => {
  const fmt = useCurrency();
  const totalTarget = goals.reduce((sum, goal) => sum + getGoalProgress(goal).target, 0);
  const totalSaved = goals.reduce((sum, goal) => sum + getGoalProgress(goal).saved, 0);
  const totalRemaining = Math.max(0, totalTarget - totalSaved);
  const overallPercentage = totalTarget > 0
    ? Math.min(100, Math.round((totalSaved / totalTarget) * 100))
    : 0;
  const circumference = 2 * Math.PI * 38;

  return (
    <section className="flex h-full flex-col rounded-2xl border border-[#292D20] bg-[#15180F] p-5 sm:p-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C5F542]/10 text-[#C5F542]">
            <Target size={17} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-[#F4F5ED]">Savings goals</h2>
            <p className="mt-0.5 text-[10px] text-[#929684]">{goals.length} active {goals.length === 1 ? 'goal' : 'goals'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAddGoal}
          aria-label="Add savings goal"
          className="rounded-full border border-[#292D20] p-2 text-[#C5F542] transition hover:border-[#C5F542]/50 hover:bg-[#C5F542]/10"
        >
          <Plus size={15} />
        </button>
      </header>

      {goals.length > 0 && !loading && (
        <div className="mt-4 flex items-center gap-4 rounded-xl border border-[#292D20] bg-[#10120C] p-3">
          <div className="relative h-[92px] w-[92px] shrink-0">
            <svg className="-rotate-90" width="92" height="92" viewBox="0 0 92 92" aria-label={`${overallPercentage}% of savings goal amount completed`}>
              <circle cx="46" cy="46" r="38" fill="none" stroke="#292D20" strokeWidth="8" />
              <circle
                cx="46"
                cy="46"
                r="38"
                fill="none"
                stroke="#C5F542"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - overallPercentage / 100)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-lg font-bold text-[#F4F5ED]">{overallPercentage}%</span>
              <span className="text-[8px] uppercase tracking-wider text-[#929684]">complete</span>
            </div>
          </div>
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-3">
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wider text-[#929684]">Goal target</p>
              <p className="mt-1 truncate font-mono text-xs font-bold text-[#F4F5ED]">{fmt(totalTarget)}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wider text-[#929684]">Completed</p>
              <p className="mt-1 truncate font-mono text-xs font-bold text-[#C5F542]">{fmt(totalSaved)}</p>
            </div>
            <div className="col-span-2 min-w-0">
              <p className="text-[9px] uppercase tracking-wider text-[#929684]">Remaining</p>
              <p className="mt-1 truncate font-mono text-xs font-bold text-[#F4F5ED]">{fmt(totalRemaining)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex-1 space-y-2.5 overflow-y-auto">
        {loading ? (
          <p className="py-6 text-center text-xs text-[#929684]">Loading savings goals…</p>
        ) : goals.length ? (
          goals.map((goal) => (
            <GoalRow key={goal.id} goal={goal} onEdit={onEditGoal} onToggle={onToggleGoal} />
          ))
        ) : (
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center">
            <Target size={25} className="text-[#929684]" />
            <p className="text-xs font-semibold text-[#F4F5ED]">No savings goals yet</p>
            <p className="max-w-56 text-[10px] text-[#929684]">Create a goal to track progress using your saved goal records.</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onAddGoal}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#C5F542] px-4 py-2.5 text-xs font-bold text-[#0B0D09] transition hover:bg-[#D5FF59]"
      >
        <Plus size={14} /> Add goal
      </button>
    </section>
  );
};

export default SavingsGoals;
