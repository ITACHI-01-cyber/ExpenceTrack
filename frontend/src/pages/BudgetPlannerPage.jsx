import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import {
  ChevronDown,
  BarChart3,
  Target,
  ReceiptText,
  Plus,
  Pencil,
  ArrowRight,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import EditBudgetModal from '../components/ui/EditBudgetModal';
import AddGoalModal from '../components/ui/AddGoalModal';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import guestStorage from '../services/guestStorage';
import useCurrency from '../utils/useCurrency';

/* ── Category color palette ── */
const CATEGORY_COLORS = [
  '#7C3AED',
  '#A78BFA',
  '#C4B5FD',
  '#374151',
  '#6B7280',
  '#9CA3AF',
  '#4F46E5',
  '#818CF8',
];

/* ── Friendly date format ── */
const formatTxDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/* ── SVG Donut ring ── */
const DonutRing = ({ segments, size = 180, strokeWidth = 18 }) => {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#EDE9FE" strokeWidth={strokeWidth} />
      {segments.map((seg, i) => {
        const length = (seg.pct / 100) * circumference;
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={-(offset * circumference) / 100 + circumference * 0.25}
            strokeLinecap="butt"
          />
        );
        offset += seg.pct;
        return el;
      })}
    </svg>
  );
};

const BudgetPlannerPage = () => {
  const { isGuest } = useAuthStore();
  const navigate = useNavigate();
  const fmt = useCurrency();

  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [goals, setGoals] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);

  /* ── Filters ── */
  const [selectedWalletId, setSelectedWalletId] = useState('all');

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  /* ── Fetch real data only ── */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (isGuest) {
        const txs = guestStorage.transactions.getAll({});
        const sum = guestStorage.budget.getSummary();
        const gList = guestStorage.goals.getAll({});
        const wList = guestStorage.wallets.getAll();
        const bud = guestStorage.budget.get(currentMonth, currentYear);
        setTransactions(txs || []);
        setSummary(sum || null);
        setGoals(gList || []);
        setWallets(wList || []);
        setBudget(bud || null);
      } else {
        const [txRes, sumRes, goalsRes, wRes, budgetRes] = await Promise.allSettled([
          api.get('/transactions'),
          api.get('/dashboard/summary'),
          api.get('/goals'),
          api.get('/wallets'),
          api.get(`/budget?month=${currentMonth}&year=${currentYear}`),
        ]);
        if (txRes.status === 'fulfilled' && txRes.value.data?.success)
          setTransactions(txRes.value.data.data);
        if (sumRes.status === 'fulfilled' && sumRes.value.data?.success)
          setSummary(sumRes.value.data.data);
        if (goalsRes.status === 'fulfilled' && goalsRes.value.data?.success)
          setGoals(goalsRes.value.data.data);
        if (wRes.status === 'fulfilled' && wRes.value.data?.success)
          setWallets(wRes.value.data.data);
        if (budgetRes.status === 'fulfilled' && budgetRes.value.data?.success)
          setBudget(budgetRes.value.data.data);
      }
    } catch (err) {
      console.error('Failed to load budget page data', err);
    } finally {
      setLoading(false);
    }
  }, [isGuest, currentMonth, currentYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Derived financial computations — NO hardcoded fallbacks ── */
  const stats = useMemo(() => {
    // Filter by wallet if needed
    const filteredTx = selectedWalletId === 'all'
      ? transactions
      : transactions.filter((tx) => tx.walletId === selectedWalletId);

    let income = 0;
    let expense = 0;
    const catExp = {};

    filteredTx.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (amt <= 0) return;
      const cat = tx.category || 'Other';
      if (tx.type === 'income') {
        income += amt;
      } else if (tx.type === 'expense') {
        expense += amt;
        catExp[cat] = (catExp[cat] || 0) + amt;
      }
    });

    // Use API-provided income if budget has configured income
    const incomeFromSummary = Number(summary?.monthlyIncome) || 0;
    const finalIncome = incomeFromSummary > 0 ? incomeFromSummary : income;

    // Total wallet balance from API (excludes credit cards)
    const totalBalance = Number(summary?.availableBalance) ||
      wallets
        .filter((w) => w.cardType?.toLowerCase() !== 'credit')
        .reduce((acc, w) => acc + (Number(w.balance) || 0), 0);

    // Savings = completed goals only
    const totalSavings = goals.reduce((acc, g) => acc + (g.completed ? Number(g.amount) || 0 : 0), 0);

    // Budget limit from configured budget document only — never inferred
    const budgetLimit = Number(summary?.monthlyBudgetLimit) || Number(budget?.budgetLimit) || 0;

    // Category breakdown from actual budget categories OR real transactions
    const budgetCategories = (budget?.categories || []).filter((c) => Number(c.spentAmount) > 0);
    const categoryEntries = budgetCategories.length > 0
      ? budgetCategories.map((c, i) => ({
          name: c.name,
          value: Number(c.spentAmount),
          color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
        }))
      : Object.entries(catExp)
          .map(([name, value], i) => ({
            name,
            value,
            color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
          }))
          .sort((a, b) => b.value - a.value);

    const totalCategorySpent = categoryEntries.reduce((s, c) => s + c.value, 0);
    const utilizationPct = budgetLimit > 0
      ? Math.min(100, Math.round((expense / budgetLimit) * 100))
      : 0;

    return {
      totalBalance,
      income: finalIncome,
      expense,
      totalSavings,
      budgetLimit,
      utilizationPct,
      totalCategorySpent,
      categories: categoryEntries,
      hasBudget: budgetLimit > 0,
      hasIncome: finalIncome > 0,
      hasExpense: expense > 0,
    };
  }, [transactions, wallets, goals, summary, budget, selectedWalletId]);

  /* ── Monthly bar chart — real data by month, NO fallback bars ── */
  const barChartData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = {};

    const filteredTx = selectedWalletId === 'all'
      ? transactions
      : transactions.filter((tx) => tx.walletId === selectedWalletId);

    filteredTx.forEach((tx) => {
      if (!tx.date) return;
      const d = new Date(tx.date);
      if (isNaN(d.getTime())) return;
      const mName = monthNames[d.getMonth()];
      if (!monthlyMap[mName]) monthlyMap[mName] = { income: 0, expense: 0 };
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') monthlyMap[mName].income += amt;
      if (tx.type === 'expense') monthlyMap[mName].expense += amt;
    });

    // Return only months that have actual data
    return monthNames
      .filter((m) => monthlyMap[m])
      .map((m) => ({
        month: m,
        income: monthlyMap[m].income,
        expense: monthlyMap[m].expense,
      }));
  }, [transactions, selectedWalletId]);

  /* ── Recent transactions — real only, no fallback rows ── */
  const recentTransactions = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted.slice(0, 5).map((t) => ({
      id: t.id,
      date: formatTxDate(t.date),
      amount: t.type === 'expense' ? `-${fmt(t.amount)}` : `+${fmt(t.amount)}`,
      paymentName: t.description || t.category || 'Transaction',
      method: t.walletId
        ? (wallets.find((w) => w.id === t.walletId)?.cardName ||
           wallets.find((w) => w.id === t.walletId)?.bankName ||
           'Card')
        : '—',
      category: t.category || '—',
      isExpense: t.type === 'expense',
    }));
  }, [transactions, wallets, fmt]);

  /* ── Goals display — real goals only, no fallback items ── */
  const displayGoals = useMemo(() => {
    return goals.map((g) => ({
      id: g.id,
      name: g.title || g.name || 'Goal',
      target: Number(g.amount) || 0,
      progress: g.completed
        ? 100
        : g.amount > 0
          ? Math.min(100, Math.round(((Number(g.savedAmount) || 0) / Number(g.amount)) * 100))
          : 0,
    }));
  }, [goals]);

  if (loading) {
    return (
      <Layout>
        <div className="flex h-96 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <p className="text-sm font-medium text-neutral-muted">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  /* ── Donut segments ── */
  const donutSegments = stats.categories.length > 0
    ? stats.categories.map((c) => ({
        pct: stats.totalCategorySpent > 0 ? Math.round((c.value / stats.totalCategorySpent) * 100) : 0,
        color: c.color,
      }))
    : [];

  return (
    <Layout>
      <div className="space-y-6 pb-12 selection:bg-purple-100">

        {/* ── ROW 1: FOUR STAT CARDS ── */}
        <section aria-label="Overview Stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          {/* Card 1: Total balance */}
          <div className="relative rounded-[2rem] border border-border bg-surface p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Wallet size={18} />
              </span>
              <span className="text-[10px] font-medium text-neutral-muted">All wallets</span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold text-neutral-muted">Total Balance</p>
              <h2 className="mt-1 font-mono text-xl font-bold tracking-tight tabular-nums text-neutral-text">
                {fmt(stats.totalBalance)}
              </h2>
            </div>
          </div>

          {/* Card 2: Income */}
          <div className="relative rounded-[2rem] border border-border bg-surface p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <ArrowDownLeft size={18} />
              </span>
              <button
                type="button"
                onClick={() => setIsBudgetModalOpen(true)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-muted transition hover:bg-primary/10 hover:text-primary"
              >
                <Pencil size={14} />
              </button>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold text-neutral-muted">Monthly Income</p>
              <h2 className="mt-1 font-mono text-xl font-bold tracking-tight tabular-nums text-neutral-text">
                {stats.hasIncome ? fmt(stats.income) : <span className="text-neutral-muted text-base">No income recorded</span>}
              </h2>
            </div>
          </div>

          {/* Card 3: Expense */}
          <div className="relative rounded-[2rem] border border-border bg-surface p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500">
                <ArrowUpRight size={18} />
              </span>
              <span className="text-[10px] font-medium text-neutral-muted">Total outflow</span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold text-neutral-muted">Expenses</p>
              <h2 className="mt-1 font-mono text-xl font-bold tracking-tight tabular-nums text-neutral-text">
                {fmt(stats.expense)}
              </h2>
            </div>
          </div>

          {/* Card 4: Total savings */}
          <div className="relative rounded-[2rem] border border-border bg-surface p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600">
                <Target size={18} />
              </span>
              <button
                type="button"
                onClick={() => setIsAddGoalModalOpen(true)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-muted transition hover:bg-primary/10 hover:text-primary"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold text-neutral-muted">Total Savings</p>
              <h2 className="mt-1 font-mono text-xl font-bold tracking-tight tabular-nums text-neutral-text">
                {fmt(stats.totalSavings)}
              </h2>
            </div>
          </div>

        </section>

        {/* ── ROW 2: MONEY FLOW (BAR CHART) + BUDGET DONUT ── */}
        <section aria-label="Visual Analytics" className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

          {/* Money Flow Chart (~8 cols) */}
          <div className="lg:col-span-8 flex flex-col rounded-[2rem] border border-border bg-surface p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BarChart3 size={16} />
                </div>
                <h3 className="text-sm font-bold text-neutral-text">Money Flow</h3>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Legend */}
                <div className="flex items-center gap-3 text-xs font-medium text-neutral-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#7C3AED]" /> Income
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#C4B5FD]" /> Expense
                  </span>
                </div>

                {/* Wallet filter */}
                {wallets.length > 0 && (
                  <div className="relative">
                    <select
                      value={selectedWalletId}
                      onChange={(e) => setSelectedWalletId(e.target.value)}
                      className="h-8 appearance-none rounded-full border border-border bg-surface px-3 pr-7 text-xs font-medium text-neutral-text outline-none hover:border-primary/40 cursor-pointer"
                    >
                      <option value="all">All accounts</option>
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.cardName || w.bankName || w.cardType}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-muted" />
                  </div>
                )}
              </div>
            </div>

            {/* Bar Chart */}
            <div className="mt-6 flex-1 min-h-[220px]">
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barGap={4}>
                    <CartesianGrid vertical={false} stroke="#EBE8F3" strokeDasharray="4 6" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9E97B3', fontSize: 11, fontWeight: 500 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={48}
                      tick={{ fill: '#9E97B3', fontSize: 10 }}
                      tickFormatter={(v) =>
                        Math.abs(v) >= 100000
                          ? `${(v / 100000).toFixed(1)}L`
                          : Math.abs(v) >= 1000
                            ? `${(v / 1000).toFixed(0)}k`
                            : v.toString()
                      }
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(124,58,237,0.04)' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-lg text-xs">
                            <p className="font-bold text-neutral-text mb-1">{payload[0].payload.month}</p>
                            <p className="text-[#7C3AED] font-semibold">Income: {fmt(payload[0]?.value)}</p>
                            <p className="text-[#A78BFA] font-semibold">Expense: {fmt(payload[1]?.value)}</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="income" fill="#7C3AED" radius={[5, 5, 0, 0]} maxBarSize={22} />
                    <Bar dataKey="expense" fill="#C4B5FD" radius={[5, 5, 0, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 text-center">
                  <BarChart3 size={28} className="text-neutral-muted opacity-40" />
                  <p className="text-xs font-semibold text-neutral-muted">No transaction history yet</p>
                  <p className="text-[10px] text-neutral-muted">
                    Record transactions to see your money flow chart.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Budget Donut (~4 cols) */}
          <div className="lg:col-span-4 flex flex-col rounded-[2rem] border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Target size={16} />
                </div>
                <h3 className="text-sm font-bold text-neutral-text">Budget</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBudgetModalOpen(true)}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                Configure →
              </button>
            </div>

            {stats.hasBudget || stats.categories.length > 0 ? (
              <div className="my-auto flex flex-col items-center justify-center py-2">
                <div className="relative flex items-center justify-center">
                  <DonutRing
                    segments={donutSegments.length > 0 ? donutSegments : [{ pct: 100, color: '#EDE9FE' }]}
                    size={170}
                    strokeWidth={18}
                  />
                  <div className="absolute flex flex-col items-center text-center">
                    <span className="text-[10px] font-medium text-neutral-muted">Total for month</span>
                    <span className="font-mono text-lg font-extrabold tracking-tight text-neutral-text">
                      {fmt(stats.totalCategorySpent)}
                    </span>
                    {stats.hasBudget && (
                      <span className="text-[9px] text-neutral-muted">of {fmt(stats.budgetLimit)}</span>
                    )}
                  </div>
                </div>

                {/* Category legend */}
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 w-full px-2">
                  {stats.categories.slice(0, 6).map((c) => (
                    <div key={c.name} className="flex items-center gap-2 text-xs text-neutral-muted">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="truncate">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="my-auto flex flex-col items-center justify-center gap-3 py-8 text-center">
                <Target size={32} className="text-neutral-muted opacity-30" />
                <p className="text-xs font-semibold text-neutral-muted">No budget configured</p>
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(true)}
                  className="inline-flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
                >
                  <Plus size={13} /> Configure Budget
                </button>
              </div>
            )}
          </div>

        </section>

        {/* ── ROW 3: RECENT TRANSACTIONS + SAVING GOALS ── */}
        <section aria-label="Transactions and Goals" className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

          {/* Recent transactions (~8 cols) */}
          <div className="lg:col-span-8 flex flex-col rounded-[2rem] border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ReceiptText size={16} />
                </div>
                <h3 className="text-sm font-bold text-neutral-text">Recent Transactions</h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/transactions')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                See all <ArrowRight size={13} />
              </button>
            </div>

            {/* Table */}
            <div className="mt-4 overflow-x-auto flex-1">
              {recentTransactions.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 text-[10px] font-bold text-neutral-muted uppercase tracking-wider">
                      <th className="rounded-l-xl py-3 pl-4 pr-3">Date</th>
                      <th className="py-3 px-3">Amount</th>
                      <th className="py-3 px-3">Description</th>
                      <th className="py-3 px-3">Wallet</th>
                      <th className="rounded-r-xl py-3 pr-4 pl-3">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {recentTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/30 transition-colors">
                        <td className="py-3.5 pl-4 pr-3 font-mono text-[11px] font-medium text-neutral-muted">
                          {tx.date}
                        </td>
                        <td className={`py-3.5 px-3 font-mono font-bold tabular-nums ${tx.isExpense ? 'text-neutral-text' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {tx.amount}
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-neutral-text">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                              {(tx.paymentName || '?').charAt(0).toUpperCase()}
                            </span>
                            <span className="truncate max-w-[120px]">{tx.paymentName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-[11px] text-neutral-muted truncate max-w-[100px]">
                          {tx.method}
                        </td>
                        <td className="py-3.5 pr-4 pl-3 text-neutral-muted font-medium">
                          {tx.category}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <ReceiptText size={28} className="text-neutral-muted opacity-40" />
                  <p className="text-xs font-semibold text-neutral-muted">No transactions found</p>
                  <button
                    type="button"
                    onClick={() => navigate('/transactions')}
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    Add your first transaction →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Saving goals (~4 cols) */}
          <div className="lg:col-span-4 flex flex-col rounded-[2rem] border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Target size={16} />
                </div>
                <h3 className="text-sm font-bold text-neutral-text">Saving Goals</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddGoalModalOpen(true)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary transition hover:bg-primary/20"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Goals list */}
            {displayGoals.length > 0 ? (
              <div className="my-auto space-y-5 py-4">
                {displayGoals.map((g) => (
                  <div key={g.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-text truncate max-w-[150px]">{g.name}</span>
                      <span className="font-mono font-bold tabular-nums text-neutral-text shrink-0">{fmt(g.target)}</span>
                    </div>
                    <div className="relative h-6 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden p-0.5 flex items-center">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-700 flex items-center justify-end pr-2 text-white font-bold text-[10px]"
                        style={{ width: `${Math.max(g.progress, 15)}%` }}
                      >
                        {g.progress}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="my-auto flex flex-col items-center justify-center gap-3 py-8 text-center">
                <Target size={28} className="text-neutral-muted opacity-40" />
                <p className="text-xs font-semibold text-neutral-muted">No savings goals yet</p>
                <button
                  type="button"
                  onClick={() => setIsAddGoalModalOpen(true)}
                  className="inline-flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
                >
                  <Plus size={13} /> Add Goal
                </button>
              </div>
            )}
          </div>

        </section>

      </div>

      {/* ── Modals ── */}
      <EditBudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        currentBudgetLimit={budget?.budgetLimit || summary?.monthlyBudgetLimit}
        currentIncome={budget?.monthlyIncome || summary?.monthlyIncome}
        onSaveSuccess={fetchData}
        isGuest={isGuest}
      />

      <AddGoalModal
        isOpen={isAddGoalModalOpen}
        onClose={() => setIsAddGoalModalOpen(false)}
        onSaveSuccess={fetchData}
        isGuest={isGuest}
      />
    </Layout>
  );
};

export default BudgetPlannerPage;
