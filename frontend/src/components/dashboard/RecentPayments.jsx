import React from 'react';
import { ChevronRight } from 'lucide-react';
import { formatDate } from '../../utils/dateHelpers';
import { formatCurrency } from '../../utils/formatCurrency';

const RecentPayments = ({ transactions }) => {
  return (
    <div className="mt-8">
      <h3 className="font-semibold text-neutral-text mb-4">Recent Payments</h3>
      <div className="flex flex-col gap-4">
        {transactions.map((tx, idx) => (
          <div 
            key={tx.id || idx} 
            className="flex items-center justify-between group hover:bg-white hover:shadow-sm p-2 -mx-2 rounded-xl transition-all duration-300 animate-[fade-in_0.5s_ease-out_both]"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${tx.type === 'income' ? 'bg-success' : 'bg-danger'}`}></div>
              <div>
                <p className="font-medium text-sm text-neutral-text">{tx.category}</p>
                <p className="text-xs text-neutral-muted">{formatDate(tx.date)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <p className={`font-semibold text-sm ${tx.type === 'income' ? 'text-neutral-text' : 'text-neutral-text'}`}>
                {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
              </p>
              <ChevronRight size={16} className="text-neutral-muted opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentPayments;
