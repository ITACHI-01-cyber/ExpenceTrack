import React from 'react';
import AnimatedNumber from '../ui/AnimatedNumber';
import { formatCurrency } from '../../utils/formatCurrency';

const BudgetProgress = ({ limit, spent, remaining = limit - spent, className = '' }) => {
  const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

  return (
    <div className={`flex flex-col gap-4 rounded-card border border-border bg-surface p-5 shadow-card animate-[fade-in_0.5s_ease-out_0.2s_both] sm:p-6 ${className}`}>
      <div className="flex justify-between border-b border-border pb-4 pr-10">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-muted">Monthly budget limit</p>
          <p className="font-bold tabular-nums text-neutral-text"><AnimatedNumber value={limit} formatter={formatCurrency} /></p>
        </div>
        <div className="text-right">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-muted">Spent</p>
          <p className="text-danger font-semibold tabular-nums"><AnimatedNumber value={spent} formatter={formatCurrency} /></p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-neutral-muted">Budget used</span>
        <span className="font-bold tabular-nums text-neutral-text">{Math.round(percent)}%</span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-primary/10"
        role="progressbar"
        aria-label="Monthly budget used"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div 
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-1000 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
        <span className="font-medium text-neutral-muted">Remaining</span>
        <span className="font-bold tabular-nums text-neutral-text"><AnimatedNumber value={remaining} formatter={formatCurrency} /></span>
      </div>
    </div>
  );
};

export default BudgetProgress;
