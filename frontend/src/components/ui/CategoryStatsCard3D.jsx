import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronDown } from 'lucide-react';
import FintechChartTooltip from './FintechChartTooltip';
import useReducedMotion from '../../utils/useReducedMotion';

const COLORS = [
  '#4F2A8A',
  '#6D4BC3',
  '#8A73D1',
  '#22A06B',
  '#A9A1B8'
];

const CategoryStatsCard3D = ({ transactions = [] }) => {
  const [selectedType, setSelectedType] = useState('expense'); // 'expense' | 'income'
  const [showDropdown, setShowDropdown] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Group and sum transactions by category
  const { categoryData, totalAmount } = useMemo(() => {
    const filtered = transactions.filter(t => t.type === selectedType);
    const totalAmount = filtered.reduce((sum, t) => sum + t.amount, 0);

    const categoriesMap = {};
    filtered.forEach(t => {
      const cat = t.category || 'Others';
      categoriesMap[cat] = (categoriesMap[cat] || 0) + t.amount;
    });

    const sortedCategories = Object.entries(categoriesMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    let categoryData = [];
    if (sortedCategories.length > 4) {
      categoryData = sortedCategories.slice(0, 3);
      const othersValue = sortedCategories.slice(3).reduce((sum, item) => sum + item.value, 0);
      categoryData.push({ name: 'Others', value: othersValue });
    } else {
      categoryData = sortedCategories;
    }

    return { categoryData, totalAmount };
  }, [transactions, selectedType]);

  return (
    <section className="flex h-full min-h-[250px] w-full min-w-0 flex-col rounded-card border border-border bg-surface p-4 shadow-card sm:p-5">
          
          {/* Header Row */}
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-muted">
              Category breakdown
            </h3>
            
            <div className="flex gap-2 items-center relative">
              <button 
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex cursor-pointer select-none items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-bold text-neutral-text transition-colors hover:bg-primary/5"
              >
                <span className="capitalize">{selectedType}</span>
                <ChevronDown size={11} />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 top-7 z-50 w-24 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-xl">
                  <button 
                    type="button"
                    onClick={() => { setSelectedType('expense'); setShowDropdown(false); }}
                    className={`w-full px-3 py-1.5 text-left text-xs text-neutral-text transition-colors hover:bg-primary/5 ${selectedType === 'expense' ? 'font-bold text-primary' : ''}`}
                  >
                    Expense
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setSelectedType('income'); setShowDropdown(false); }}
                    className={`w-full px-3 py-1.5 text-left text-xs text-neutral-text transition-colors hover:bg-primary/5 ${selectedType === 'income' ? 'font-bold text-primary' : ''}`}
                  >
                    Income
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Subtitle comment */}
          <p className="mb-3 text-[10px] text-neutral-muted">
            {totalAmount > 0 
              ? `Your ${selectedType}s grouped by category.`
              : `No ${selectedType}s recorded yet.`
            }
          </p>

          {/* Chart & Legend Row */}
          <div className="mt-1 flex min-h-0 flex-1 flex-row items-center gap-3">
            {/* Center Donut Chart */}
            <div className="relative flex h-32 w-[40%] min-w-[108px] max-w-[140px] shrink-0 items-center justify-center">
              {totalAmount > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100} initialDimension={{ width: 120, height: 120 }}>
                  <PieChart>
                    <Tooltip content={<FintechChartTooltip seriesLabels={{ value: 'Total' }} />} />
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius="62%"
                      outerRadius="88%"
                      paddingAngle={4}
                      cornerRadius={5}
                      dataKey="value"
                      stroke="var(--surface-color)"
                      strokeWidth={2}
                      animationDuration={prefersReducedMotion ? 0 : 700}
                      isAnimationActive={!prefersReducedMotion}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-8 border-primary/10" />
              )}

              {/* Center text overlay */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-1 text-center">
                <span className="text-[7.5px] uppercase leading-none tracking-wider text-neutral-muted">
                  {selectedType === 'expense' ? 'Expenses' : 'Income'}
                </span>
                <span className="mt-0.5 max-w-[75px] truncate px-0.5 text-[11px] font-bold leading-none text-neutral-text sm:text-xs">
                  ₹{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Dynamic Legend */}
            <div className="flex h-full min-w-0 flex-1 flex-col justify-center space-y-2.5 overflow-y-auto border-l border-border pl-3 pr-1">
              {categoryData.length > 0 ? (
                categoryData.map((item, index) => {
                  const percent = totalAmount > 0 ? ((item.value / totalAmount) * 100).toFixed(0) : 0;
                  return (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0 pr-1">
                        <span 
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                        />
                        <span className="truncate font-medium capitalize text-neutral-text">
                          {item.name}
                        </span>
                      </div>
                      <span className="ml-1 shrink-0 tabular-nums text-neutral-muted">
                        {percent}%
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="py-2 text-center text-xs italic text-neutral-muted">No categories found</p>
              )}
            </div>
          </div>

    </section>
  );
};

export default CategoryStatsCard3D;
