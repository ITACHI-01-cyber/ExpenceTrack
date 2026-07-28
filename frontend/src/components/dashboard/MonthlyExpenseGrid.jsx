import React, { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const filterLabels = {
  week: 'This Week',
  month: 'This Month',
  lastMonth: 'Last Month',
  year: 'This Year',
  custom: 'Custom Range'
};

const MonthlyExpenseGrid = ({ categories = [], filterType = 'month', customRange, onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const [tempRange, setTempRange] = useState({
    startDate: customRange?.startDate || '',
    endDate: customRange?.endDate || ''
  });

  useEffect(() => {
    if (customRange?.startDate && customRange?.endDate) {
      setTempRange(customRange);
    }
  }, [customRange]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterSelect = (type) => {
    if (type !== 'custom') {
      onFilterChange(type);
      setIsOpen(false);
    } else {
      onFilterChange('custom', tempRange.startDate && tempRange.endDate ? tempRange : null);
    }
  };

  const applyCustomRange = () => {
    if (tempRange.startDate && tempRange.endDate) {
      onFilterChange('custom', tempRange);
      setIsOpen(false);
    }
  };

  const getRangeLabel = () => {
    const now = new Date();
    const formatDateShort = (date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    };

    if (filterType === 'week') {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      return `${formatDateShort(startOfWeek)} - ${formatDateShort(now)}`;
    } else if (filterType === 'month') {
      return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (filterType === 'lastMonth') {
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return lastMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (filterType === 'year') {
      return `${now.getFullYear()}`;
    } else if (filterType === 'custom' && customRange?.startDate && customRange?.endDate) {
      const start = new Date(customRange.startDate);
      const end = new Date(customRange.endDate);
      return `${formatDateShort(start)} - ${formatDateShort(end)}`;
    }
    return '';
  };

  return (
    <div className="h-full">
      <div className="mb-4 flex min-h-[44px] items-start justify-between gap-4">
        <div className="flex flex-col">
          <h3 className="font-semibold leading-tight text-neutral-text">
            {filterType === 'week' && 'Weekly Expenses'}
            {filterType === 'month' && 'Monthly Expenses'}
            {filterType === 'lastMonth' && "Last Month's Expenses"}
            {filterType === 'year' && 'Yearly Expenses'}
            {filterType === 'custom' && 'Filtered Expenses'}
          </h3>
          <span className="text-[10px] text-neutral-muted font-medium mt-0.5">{getRangeLabel()}</span>
        </div>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 shrink-0 text-xs font-semibold text-neutral-muted transition-colors hover:text-primary bg-white border border-border/80 hover:border-primary/30 px-3 py-1.5 rounded-lg shadow-sm"
          >
            <Filter size={12} />
            <span>{filterLabels[filterType] || 'Filter'}</span>
            <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isOpen && (
            <div className="absolute right-0 mt-1.5 w-64 bg-white border border-primary/20 rounded-xl shadow-xl z-50 p-3 animate-[fade-in_0.2s_ease-out]">
              <div className="space-y-1">
                {Object.entries(filterLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => handleFilterSelect(key)}
                    className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                      filterType === key 
                        ? 'bg-primary/10 text-primary font-semibold' 
                        : 'text-neutral-text hover:bg-neutral-muted/10'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {filterType === 'custom' && (
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-neutral-muted mb-1">From Date</label>
                    <input 
                      type="date"
                      value={tempRange.startDate}
                      onChange={(e) => setTempRange({ ...tempRange, startDate: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-neutral-text focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-neutral-muted mb-1">To Date</label>
                    <input 
                      type="date"
                      value={tempRange.endDate}
                      onChange={(e) => setTempRange({ ...tempRange, endDate: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-neutral-text focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <button
                    onClick={applyCustomRange}
                    disabled={!tempRange.startDate || !tempRange.endDate}
                    className="w-full bg-primary text-white font-medium py-1.5 rounded-lg text-xs hover:bg-primary/95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply Range
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-neutral-muted border border-dashed border-border rounded-xl h-[120px] bg-white/50 animate-[fade-in_0.5s_ease-out_both]">
          <p className="text-xs font-medium">No expenses found for this period</p>
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default MonthlyExpenseGrid;
