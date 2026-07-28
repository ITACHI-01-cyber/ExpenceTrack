import React from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import { Check, Plus, Target, X, Edit2, Trash2 } from 'lucide-react';

const SavingsGoalsGrid = ({ goals, onAddClick, onStatusChange, onEditClick, onDeleteClick }) => {
  return (
    <div className="h-full">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h3 className="font-semibold text-neutral-text flex items-center gap-2 text-sm sm:text-base">
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {goals.map((goal, idx) => (
            <div 
              key={goal.id} 
              className={`bg-white border-l-4 rounded-r-xl p-4 flex flex-col shadow-sm hover:shadow-md transition-all group animate-[fade-in_0.5s_ease-out_both] ${
                goal.completed ? 'border-l-success' : 'border-l-primary'
              }`}
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-sm font-bold text-neutral-text leading-tight truncate">{goal.title}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <p className="text-sm font-bold text-primary tabular-nums whitespace-nowrap">
                    {formatCurrency(goal.amount)}
                  </p>
                  
                  {/* Action triggers */}
                  <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity ml-1.5">
                    <button 
                      onClick={() => onEditClick?.(goal)}
                      className="p-1 rounded text-neutral-muted hover:text-primary hover:bg-neutral-muted/10 transition-colors"
                      title="Edit Target"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      onClick={() => onDeleteClick?.(goal.id)}
                      className="p-1 rounded text-neutral-muted hover:text-danger hover:bg-danger/10 transition-colors"
                      title="Delete Target"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-medium bg-neutral-100 text-neutral-muted px-2 py-0.5 rounded uppercase tracking-wide">
                  Via: {goal.medium}
                </span>
                <div className="grid w-full grid-cols-2 overflow-hidden rounded-md border border-border bg-background sm:w-auto">
                  <button
                    type="button"
                    onClick={() => onStatusChange?.(goal, true)}
                    className={`flex h-8 items-center justify-center gap-1 px-2 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                      goal.completed
                        ? 'bg-success text-white shadow-sm'
                        : 'text-neutral-muted hover:bg-success/10 hover:text-success'
                    }`}
                    title="Mark done"
                    aria-label="Mark investment done"
                  >
                    <Check size={14} />
                    Done
                  </button>
                  <button
                    type="button"
                    onClick={() => onStatusChange?.(goal, false)}
                    className={`flex h-8 items-center justify-center gap-1 border-l border-border px-2 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                      goal.completed
                        ? 'text-neutral-muted hover:bg-danger/10 hover:text-danger'
                        : 'bg-danger text-white shadow-sm'
                    }`}
                    title="Mark not done"
                    aria-label="Mark investment not done"
                  >
                    <X size={14} />
                    Not Done
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavingsGoalsGrid;
