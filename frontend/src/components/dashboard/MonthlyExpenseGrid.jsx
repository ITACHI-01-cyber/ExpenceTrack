import React from 'react';
import { formatCurrency } from '../../utils/formatCurrency';

const MonthlyExpenseGrid = ({ categories }) => {
  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-neutral-text">Monthly Expenses</h3>
        <button className="text-sm text-neutral-muted hover:text-primary transition-colors">Edit</button>
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
