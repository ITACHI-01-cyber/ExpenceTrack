import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertTriangle, 
  SlidersHorizontal, 
  Calendar,
  CheckCircle2,
  TrendingDown,
  Layers,
  Sparkles
} from 'lucide-react';
import EditBudgetModal from '../components/ui/EditBudgetModal';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import guestStorage from '../services/guestStorage';
import { formatCurrency } from '../utils/formatCurrency';

const BudgetPlannerPage = () => {
  const { isGuest } = useAuthStore();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all'); // all, warning, normal

  const now = new Date();
  const currentMonthName = now.toLocaleString('default', { month: 'long' });
  const currentYear = now.getFullYear();

  const fetchData = async () => {
    try {
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      if (isGuest) {
        const txs = guestStorage.transactions.getAll({ month, year });
        setTransactions(txs);
        const summaryData = guestStorage.budget.getSummary();
        setSummary(summaryData);
      } else {
        const [txRes, sumRes] = await Promise.all([
          api.get(`/transactions?month=${month}&year=${year}`),
          api.get('/dashboard/summary')
        ]);

        if (txRes.data?.success) {
          setTransactions(txRes.data.data);
        }
        if (sumRes.data?.success) {
          setSummary(sumRes.data.data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch budget planner data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute Financial Model
  const {
    totalIncome,
    totalExpense,
    budgetLimit,
    remainingBudget,
    percentUsed,
    categoryBudgets,
    overBudgetCategories,
    recentBudgetTransactions
  } = useMemo(() => {
    let tIncome = 0;
    let tExpense = 0;
    const catMap = {};

    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      const cat = tx.category || 'General';

      if (tx.type === 'income') {
        tIncome += amt;
      } else if (tx.type === 'expense') {
        tExpense += amt;
        if (!catMap[cat]) {
          catMap[cat] = { spent: 0, count: 0, isRecurring: false };
        }
        catMap[cat].spent += amt;
        catMap[cat].count += 1;
        if (tx.isRecurring) catMap[cat].isRecurring = true;
      }
    });

    const bLimit = Number(summary?.monthlyBudgetLimit) || 0;
    const remaining = bLimit - tExpense;
    const pct = bLimit > 0 ? Math.min(Math.round((tExpense / bLimit) * 100), 999) : 0;

    // Derived category budget caps (balanced proportional benchmark)
    const categoryCount = Object.keys(catMap).length || 1;
    const avgCap = bLimit > 0 ? bLimit / categoryCount : 0;

    const categories = Object.entries(catMap).map(([name, data]) => {
      // Benchmark allocation per category
      const allocated = Math.max(data.spent, avgCap);
      const catPct = allocated > 0 ? Math.round((data.spent / allocated) * 100) : 0;
      const isOver = data.spent > allocated;
      const isWarning = catPct >= 80 && !isOver;

      return {
        name,
        spent: data.spent,
        allocated,
        percent: catPct,
        count: data.count,
        isRecurring: data.isRecurring,
        isOver,
        isWarning
      };
    }).sort((a, b) => b.spent - a.spent);

    const overList = categories.filter((c) => c.isOver || c.isWarning);

    // Recent activity transactions
    const recent = [...transactions]
      .filter((t) => t.type === 'expense')
      .slice(0, 8);

    return {
      totalIncome: tIncome,
      totalExpense: tExpense,
      budgetLimit: bLimit,
      remainingBudget: remaining,
      percentUsed: pct,
      categoryBudgets: categories,
      overBudgetCategories: overList,
      recentBudgetTransactions: recent
    };
  }, [transactions, summary]);

  const filteredCategories = useMemo(() => {
    if (filterType === 'warning') {
      return categoryBudgets.filter((c) => c.isOver || c.isWarning);
    }
    if (filterType === 'normal') {
      return categoryBudgets.filter((c) => !c.isOver && !c.isWarning);
    }
    return categoryBudgets;
  }, [categoryBudgets, filterType]);

  if (loading) {
    return (
      <Layout>
        <TopBar />
        <div className="flex h-64 items-center justify-center font-mono text-xs uppercase tracking-widest text-neutral-400">
          Syncing Financial Data...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        
        {/* ── Page Header: Linear-style minimal toolbar ── */}
        <div className="flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Finances / Monthly Budget
              </p>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Budget & Allocations
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300">
              <Calendar size={13} className="text-neutral-400" />
              <span>{currentMonthName} {currentYear}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsBudgetModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              <SlidersHorizontal size={13} />
              <span>Configure Limits</span>
            </button>
          </div>
        </div>

        {/* ── Warning Banner (Only displayed if categories exceed thresholds) ── */}
        {overBudgetCategories.length > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
            <AlertTriangle size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <span className="font-semibold">{overBudgetCategories.length} categor{overBudgetCategories.length > 1 ? 'ies have' : 'y has'}</span> reached or exceeded 80% of projected allocation ({overBudgetCategories.map((c) => c.name).join(', ')}).
            </div>
          </div>
        )}

        {/* ── Hero Metric Grid: Stripe / Linear Monospace Hierarchy ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* 1. Remaining Budget (Main Anchor) */}
          <div className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-neutral-300 dark:hover:border-neutral-700">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Remaining Safe-To-Spend
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <h2 className={`font-mono text-2xl font-bold tracking-tight tabular-nums ${remainingBudget < 0 ? 'text-red-500' : 'text-neutral-900 dark:text-white'}`}>
                {remainingBudget < 0 ? `-${formatCurrency(Math.abs(remainingBudget))}` : formatCurrency(remainingBudget)}
              </h2>
              <span className={`font-mono text-xs font-semibold tabular-nums ${remainingBudget < 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {100 - percentUsed}% left
              </span>
            </div>
            {/* Minimal Progress Bar */}
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div 
                className={`h-full transition-all duration-500 ${percentUsed > 100 ? 'bg-red-500' : percentUsed > 80 ? 'bg-amber-500' : 'bg-neutral-900 dark:bg-neutral-100'}`} 
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>
          </div>

          {/* 2. Budget Limit */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Monthly Limit
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <h2 className="font-mono text-2xl font-bold tracking-tight tabular-nums text-neutral-900 dark:text-white">
                {formatCurrency(budgetLimit)}
              </h2>
              <span className="text-[11px] text-neutral-400">Target Cap</span>
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              Configured threshold for {currentMonthName}
            </p>
          </div>

          {/* 3. Actual Spent */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Actual Outflow
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <h2 className="font-mono text-2xl font-bold tracking-tight tabular-nums text-neutral-900 dark:text-white">
                {formatCurrency(totalExpense)}
              </h2>
              <span className="font-mono text-xs font-semibold tabular-nums text-neutral-500">
                {percentUsed}% spent
              </span>
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              Across {transactions.filter((t) => t.type === 'expense').length} expense transactions
            </p>
          </div>

          {/* 4. Total Inflow */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Monthly Inflow
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <h2 className="font-mono text-2xl font-bold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(totalIncome)}
              </h2>
              <span className="inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400">
                <ArrowDownLeft size={14} />
              </span>
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              Net balance: <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">{formatCurrency(totalIncome - totalExpense)}</span>
            </p>
          </div>

        </div>

        {/* ── Main Data Section: Category Breakdown + Recent Activity ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          
          {/* Category-wise spending table (8 cols) */}
          <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Category Allocations & Velocity
                </h3>
                <p className="text-xs text-neutral-500">
                  Track actual spending against projected category limits
                </p>
              </div>

              {/* Segmented Filter */}
              <div className="flex items-center rounded-lg border border-border p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`rounded-md px-2.5 py-1 transition-colors ${filterType === 'all' ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
                >
                  All ({categoryBudgets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('warning')}
                  className={`rounded-md px-2.5 py-1 transition-colors ${filterType === 'warning' ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
                >
                  Alerts ({overBudgetCategories.length})
                </button>
              </div>
            </div>

            {/* Category Rows */}
            <div className="mt-4 divide-y divide-border/40">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((cat) => (
                  <div key={cat.name} className="py-3.5 group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                          {cat.name}
                        </span>
                        {cat.isRecurring && (
                          <span className="rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-neutral-500">
                            Fixed Bill
                          </span>
                        )}
                        {cat.isOver ? (
                          <span className="rounded bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                            Over limit
                          </span>
                        ) : cat.isWarning ? (
                          <span className="rounded bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                            80%+ spent
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold tabular-nums text-neutral-900 dark:text-white">
                          {formatCurrency(cat.spent)}
                        </span>
                        <span className="font-mono text-xs text-neutral-400 tabular-nums">
                          / {formatCurrency(cat.allocated)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div
                          className={`h-full transition-all duration-300 ${
                            cat.isOver 
                              ? 'bg-red-500' 
                              : cat.isWarning 
                              ? 'bg-amber-500' 
                              : 'bg-neutral-900 dark:bg-neutral-200'
                          }`}
                          style={{ width: `${Math.min(cat.percent, 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-medium tabular-nums text-neutral-400 w-10 text-right">
                        {cat.percent}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-neutral-400 font-mono">
                  No categories matching filter
                </div>
              )}
            </div>
          </div>

          {/* Recent Budget Activity (4 cols) */}
          <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Budget Activity Feed
            </h3>
            <p className="text-xs text-neutral-500">
              Recent recorded expense deductions
            </p>

            <div className="mt-4 divide-y divide-border/40">
              {recentBudgetTransactions.length > 0 ? (
                recentBudgetTransactions.map((tx) => (
                  <div key={tx.id || Math.random()} className="py-2.5 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <p className="truncate text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        {tx.description || tx.category || 'Expense'}
                      </p>
                      <p className="text-[10px] text-neutral-400 font-mono">
                        {tx.date ? new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'} • {tx.category}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold tabular-nums text-neutral-900 dark:text-white shrink-0">
                      -{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-neutral-400 font-mono">
                  No recent deductions recorded
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      <EditBudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        currentBudgetLimit={summary?.monthlyBudgetLimit}
        currentIncome={summary?.monthlyIncome}
        onSaveSuccess={fetchData}
        isGuest={isGuest}
      />
    </Layout>
  );
};

export default BudgetPlannerPage;
