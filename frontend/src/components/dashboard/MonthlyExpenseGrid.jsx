import React from 'react';
import { formatCurrency } from '../../utils/formatCurrency';

const MonthlyExpenseGrid = ({ categories }) => {
  return (
    <div className="h-full">
      <div className="mb-4 flex min-h-7 items-center justify-between gap-4">
        <h3 className="font-semibold leading-tight text-neutral-text">Monthly Expenses</h3>
        <button className="shrink-0 text-sm text-neutral-muted transition-colors hover:text-primary">Edit</button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {categories.map((cat, idx) => (
          <div 
            key={cat.name} 
            className="bg-white border border-primary/20 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow animate-[fade-in_0.5s_ease-out_both]"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <p className="text-xs text-neutral-muted mb-1">{cat.name}</p>
            <p className="text-sm font-semibold text-neutral-text">{formatCurrency(cat.amount)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthlyExpenseGrid;
