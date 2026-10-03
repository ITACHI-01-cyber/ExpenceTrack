import React from 'react';
import { formatCurrency } from '../../utils/formatCurrency';

const FintechChartTooltip = ({ active, payload, label, seriesLabels = {} }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-32 rounded-xl border border-border bg-surface px-3 py-2.5 shadow-hover">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-muted">{label}</p>
      <div className="space-y-1">
        {payload.map((item, index) => {
          const name = seriesLabels[item.dataKey] || item.name || item.dataKey;
          return (
            <div key={`${item.dataKey}-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-muted">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
                {name}
              </span>
              <span className="text-xs font-bold tabular-nums text-neutral-text">{formatCurrency(item.value)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FintechChartTooltip;
