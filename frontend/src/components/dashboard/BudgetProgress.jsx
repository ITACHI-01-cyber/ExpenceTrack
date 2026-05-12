import React from 'react';
import AnimatedNumber from '../ui/AnimatedNumber';
import { formatCurrency } from '../../utils/formatCurrency';

const BudgetProgress = ({ limit, spent }) => {
  const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

  return (
    <div className="mt-6 flex flex-col gap-3 animate-[fade-in_0.5s_ease-out_0.2s_both]">
      <div className="flex justify-between border-b border-border pb-3">
        <div>
          <p className="text-xs text-neutral-muted mb-1">Monthly budget limit</p>
          <p className="text-success font-semibold tabular-nums"><AnimatedNumber value={limit} formatter={formatCurrency} /></p>
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-muted mb-1">Spent</p>
          <p className="text-danger font-semibold tabular-nums"><AnimatedNumber value={spent} formatter={formatCurrency} /></p>
        </div>
      </div>
      
      <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default BudgetProgress;
