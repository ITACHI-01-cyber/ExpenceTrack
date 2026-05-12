import React from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import { Target, Plus } from 'lucide-react';

const SavingsGoalsGrid = ({ goals, onAddClick }) => {
  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-neutral-text flex items-center gap-2">
          <Target size={18} className="text-primary" /> 
          Savings & Investment Targets
        </h3>
        <button 
          onClick={onAddClick}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark transition-colors bg-primary/10 px-3 py-1.5 rounded-full font-medium"
        >
          <Plus size={16} /> Add Target
        </button>
      </div>
      
      {goals.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
          <Target size={32} className="text-neutral-muted mb-3 opacity-50" />
          <p className="text-sm font-medium text-neutral-text">No targets set for this month.</p>
          <p className="text-xs text-neutral-muted mt-1">Set a goal to start saving or investing!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {goals.map((goal, idx) => (
            <div 
              key={goal.id} 
              className="bg-white border-l-4 border-l-primary rounded-r-xl p-4 flex flex-col shadow-sm hover:shadow-md transition-all animate-[fade-in_0.5s_ease-out_both]"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-bold text-neutral-text leading-tight">{goal.title}</p>
                <p className="text-sm font-bold text-primary tabular-nums whitespace-nowrap ml-2">
                  {formatCurrency(goal.amount)}
                </p>
              </div>
              <div className="mt-auto flex items-center">
                <span className="text-[10px] font-medium bg-neutral-100 text-neutral-muted px-2 py-0.5 rounded uppercase tracking-wide">
                  Via: {goal.medium}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavingsGoalsGrid;
