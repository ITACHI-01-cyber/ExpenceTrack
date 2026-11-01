import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Pencil, SlidersHorizontal, WalletCards } from 'lucide-react';
import useCurrency from '../../utils/useCurrency';

const SummaryCard = ({ icon: Icon, label, value, caption, onEdit, tone = 'lime' }) => {
  const toneClass = tone === 'danger' ? 'text-[#FF786D]' : 'text-[#C5F542]';

  return (
    <article className="relative min-w-0 rounded-2xl border border-[#292D20] bg-[#15180F] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#C5F542]/10 ${toneClass}`}>
            <Icon size={15} />
          </span>
          <p className="truncate text-xs font-medium text-[#929684]">{label}</p>
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${label.toLowerCase()}`}
            className="rounded-md p-1.5 text-[#929684] transition hover:bg-[#292D20] hover:text-[#C5F542]"
          >
            <Pencil size={13} />
          </button>
        )}
      </div>
      <p className={`mt-4 truncate font-mono text-xl font-bold tracking-tight sm:text-2xl ${toneClass}`} data-financial="true">
        {value}
      </p>
      {caption && <p className="mt-1 truncate text-[10px] text-[#929684]">{caption}</p>}
    </article>
  );
};

const SummaryCards = ({
  monthlyIncome,
  monthlyExpenses,
  budgetLimit,
  budgetLeft,
  hasBudget,
  onEditBudget,
}) => {
  const fmt = useCurrency();

  return (
    <section aria-label="Monthly financial summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        icon={ArrowDownLeft}
        label="Monthly income"
        value={fmt(monthlyIncome)}
        caption="Recorded or configured"
        onEdit={onEditBudget}
      />
      <SummaryCard
        icon={ArrowUpRight}
        label="Expenses"
        value={fmt(monthlyExpenses)}
        caption="Eligible expenses this month"
      />
      <SummaryCard
        icon={SlidersHorizontal}
        label="Budget limit"
        value={hasBudget ? fmt(budgetLimit) : 'Not set'}
        caption={hasBudget ? 'Configured for this month' : 'Set a monthly budget'}
        onEdit={onEditBudget}
      />
      <SummaryCard
        icon={WalletCards}
        label="Budget left"
        value={hasBudget ? fmt(budgetLeft) : '—'}
        caption={hasBudget ? 'Limit minus eligible expenses' : 'Requires a configured limit'}
        tone={hasBudget && budgetLeft < 0 ? 'danger' : 'lime'}
      />
    </section>
  );
};

export default SummaryCards;
