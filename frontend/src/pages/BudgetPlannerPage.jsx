import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Wallet, TrendingUp, Receipt } from 'lucide-react';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import FintechChartTooltip from '../components/ui/FintechChartTooltip';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import guestStorage from '../services/guestStorage';
import useReducedMotion from '../utils/useReducedMotion';
import { formatCurrency } from '../utils/formatCurrency';

const COLORS = ['#6D4BC3', '#4F2A8A', '#8A73D1', '#B3A4E8', '#C7B7F2'];

const KPICard = ({ title, sub, value, icon, delay }) => (
  <div 
    className="bg-white rounded-xl shadow-sm border border-border p-4 flex items-center gap-4 animate-[fade-in_0.5s_ease-out_both]"
    style={{ animationDelay: delay }}
  >
    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
      {icon}
    </div>
    <div>
      <p className="font-bold text-neutral-text text-sm flex items-center gap-1">{title}</p>
      <p className="text-xs text-neutral-muted">{sub}</p>
      <h3 className="text-2xl font-bold mt-1 text-neutral-text tabular-nums"><AnimatedNumber value={value} /></h3>
    </div>
  </div>
);

const BudgetPlannerPage = () => {
  const { isGuest } = useAuthStore();
  const prefersReducedMotion = useReducedMotion();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date();
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

          if (txRes.data.success) {
            setTransactions(txRes.data.data);
          }
          if (sumRes.data.success) {
            setSummary(sumRes.data.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch budget data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute Real Data
  const {
    totalIncome,
    totalExpense,
    totalBills,
    expenseData,
    billSummaryData,
    incomeSourceData,
    allocationData,
    cashflowData,
    actualVsBudgetData,
    highestExpenses
  } = useMemo(() => {
    let tIncome = 0;
    let tExpense = 0;
    let tBills = 0;
    
    const catExp = {};
    const catBills = {};
    const catInc = {};

    transactions.forEach(tx => {
      const amt = tx.amount || 0;
      const cat = tx.category || 'Other';
      
      if (tx.type === 'income') {
        tIncome += amt;
        catInc[cat] = (catInc[cat] || 0) + amt;
      } else if (tx.type === 'expense') {
        tExpense += amt;
        catExp[cat] = (catExp[cat] || 0) + amt;
        // Treat recurring expenses as Bills
        if (tx.isRecurring) {
          tBills += amt;
          catBills[cat] = (catBills[cat] || 0) + amt;
        }
      }
    });

    const expData = Object.entries(catExp)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const billData = Object.entries(catBills)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const incData = Object.entries(catInc)
      .map(([name, actual]) => ({ name, actual, budget: actual })) // Mock budget for income source
      .sort((a, b) => b.actual - a.actual);

    const savings = Math.max(tIncome - tExpense, 0);
    const regularExpense = Math.max(tExpense - tBills, 0);

    const allocData = [
      { name: 'Savings', value: savings },
      { name: 'Bills', value: tBills },
      { name: 'Expenses', value: regularExpense },
    ].filter(d => d.value > 0);

    // Default mock alloc if no data
    if (allocData.length === 0) allocData.push({ name: 'No Data', value: 1 });

    const budgetLimit = summary?.monthlyBudgetLimit || 0;
    const expectedIncome = summary?.monthlyIncome || 0;
    
    const cFlowData = [
      { name: 'Savings', actual: savings, budget: Math.max(expectedIncome - budgetLimit, 0) },
      { name: 'Bills', actual: tBills, budget: budgetLimit * 0.4 }, // arbitrary budget split
      { name: 'Expenses', actual: regularExpense, budget: budgetLimit * 0.6 },
      { name: 'Income', actual: tIncome, budget: expectedIncome },
    ];

    const avbData = expData.map(e => ({
      name: e.name.substring(0, 8),
      actual: e.value,
      budget: Math.max(e.value, budgetLimit / (expData.length || 1)) // roughly estimate budget per category
    }));

    return {
      totalIncome: tIncome,
      totalExpense: tExpense,
      totalBills: tBills,
      expenseData: expData.length ? expData : [{ name: 'No Expenses', value: 1 }],
      billSummaryData: billData.length ? billData : [{ name: 'No Bills', value: 0 }],
      incomeSourceData: incData.length ? incData : [{ name: 'No Income', actual: 0, budget: 0 }],
      allocationData: allocData,
      cashflowData: cFlowData,
      actualVsBudgetData: avbData,
      highestExpenses: expData.slice(0, 2)
    };
  }, [transactions, summary]);

  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  if (loading) {
    return (
      <Layout>
        <TopBar />
        <div className="flex items-center justify-center h-64 text-primary">Loading Budget Data...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-text uppercase tracking-wide">Budget Planner Dashboard</h1>
          <p className="text-sm text-neutral-muted">Monthly Personal Budget Dashboard</p>
        </div>
        <div className="bg-primary text-white px-6 py-2 rounded-xl text-center shadow-md">
          <p className="text-xs opacity-80">Month</p>
          <p className="font-bold text-lg">{currentMonthName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[minmax(180px,auto)]">
        
        {/* ROW 1: KPIs + Donut + Balance */}
        <div className="md:col-span-3 flex flex-col gap-4">
          <KPICard title="Expenses" sub="The Actual Expense" value={totalExpense} icon={<Wallet />} delay="0ms" />
          <KPICard title="Income" sub="The Actual Income" value={totalIncome} icon={<TrendingUp />} delay="100ms" />
          <KPICard title="Bills" sub="Recurring Bills" value={totalBills} icon={<Receipt />} delay="200ms" />
        </div>

        <div className="md:col-span-6 min-w-0 rounded-card border border-border bg-surface p-4 shadow-card sm:p-5">
          <h3 className="text-sm font-bold text-neutral-text">Allocation summary</h3>
          <p className="mt-1 text-xs text-neutral-muted">Actual allocation of income</p>
          <div className="grid h-48 min-w-0 grid-cols-[minmax(0,1fr)_minmax(115px,0.8fr)] items-center gap-2">
            <div className="relative h-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 200, height: 200 }}>
              <PieChart>
                <Tooltip content={<FintechChartTooltip />} />
                <Pie
                  data={allocationData}
                  innerRadius="58%"
                  outerRadius="82%"
                  paddingAngle={4}
                  cornerRadius={6}
                  dataKey="value"
                  stroke="var(--surface-color)"
                  strokeWidth={3}
                  animationDuration={prefersReducedMotion ? 0 : 700}
                  isAnimationActive={!prefersReducedMotion}
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[9px] font-semibold uppercase tracking-wide text-neutral-muted">Allocated</span>
                <span className="max-w-[90%] truncate text-xs font-bold tabular-nums text-neutral-text">
                  {formatCurrency(allocationData.reduce((sum, item) => sum + item.value, 0))}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {allocationData.map((item, index) => (
                <div key={item.name} className="flex min-w-0 items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="truncate text-[10px] font-medium text-neutral-muted">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-3 bg-white rounded-xl shadow-sm border border-border p-4 flex flex-col items-center justify-center text-center">
          <p className="font-bold text-sm">Available Balance</p>
          <p className="text-xs text-neutral-muted mb-4">Total Across Wallets</p>
          <h2 className="text-4xl font-bold text-neutral-text tabular-nums"><AnimatedNumber value={summary?.availableBalance || 0} /></h2>
        </div>

        {/* ROW 2 */}
        <div className="md:col-span-3 min-w-0 rounded-card border border-border bg-surface p-4 shadow-card">
          <h3 className="text-sm font-bold text-neutral-text">Bill summary</h3>
          <p className="mb-4 mt-1 text-xs text-neutral-muted">Actual bill payments</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 220 }}>
              <BarChart data={billSummaryData} margin={{ top: 12, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="billBars" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a98af1" />
                    <stop offset="100%" stopColor="#563290" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis hide domain={[0, 'dataMax + 10%']} />
                <Tooltip content={<FintechChartTooltip seriesLabels={{ value: 'Bills' }} />} cursor={{ fill: 'rgba(109,75,195,0.08)' }} />
                <Bar dataKey="value" fill="url(#billBars)" background={{ fill: 'var(--chart-grid)', radius: [7, 7, 0, 0] }} radius={[7, 7, 0, 0]} maxBarSize={28} animationDuration={prefersReducedMotion ? 0 : 700} isAnimationActive={!prefersReducedMotion} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-4 min-w-0 rounded-card bg-gradient-to-br from-[#211433] via-[#352052] to-[#4F2A8A] p-4 text-white shadow-card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-sm mb-1 flex items-center gap-2"><span className="w-2 h-2 bg-white rounded-full"></span> Cashflow Summary</h3>
              <p className="text-xs text-white/70">Actual Vs Budget</p>
            </div>
            <div className="text-[10px] flex flex-col gap-1">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-white"></span> Actual</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#B3A4E8]"></span> Budget</span>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 220 }}>
              <BarChart data={cashflowData} layout="vertical" margin={{ top: 2, right: 8, left: 8, bottom: 0 }} barGap={3}>
                <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.12)" strokeDasharray="3 6" />
                <XAxis type="number" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.62)' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={58} tick={{ fontSize: 9, fill: '#fff' }} axisLine={false} tickLine={false} />
                <Tooltip content={<FintechChartTooltip seriesLabels={{ actual: 'Actual', budget: 'Budget' }} />} cursor={{ fill: 'rgba(255,255,255,0.08)' }} />
                <Bar dataKey="actual" fill="#FFFFFF" barSize={8} radius={[0, 5, 5, 0]} animationDuration={prefersReducedMotion ? 0 : 700} isAnimationActive={!prefersReducedMotion} />
                <Bar dataKey="budget" fill="#B3A4E8" barSize={8} radius={[0, 5, 5, 0]} animationDuration={prefersReducedMotion ? 0 : 700} isAnimationActive={!prefersReducedMotion} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-3 min-w-0 rounded-card border border-border bg-surface p-4 shadow-card">
          <h3 className="text-sm font-bold text-neutral-text">Expense summary</h3>
          <p className="mb-3 mt-1 text-xs text-neutral-muted">Actual expenses by category</p>
          <div className="flex h-48 min-w-0 items-center">
            <div className="relative h-full w-1/2 min-w-0">
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 160, height: 180 }}>
                <PieChart>
                  <Tooltip content={<FintechChartTooltip />} />
                  <Pie
                    data={expenseData}
                    innerRadius="56%"
                    outerRadius="82%"
                    paddingAngle={3}
                    cornerRadius={5}
                    dataKey="value"
                    stroke="var(--surface-color)"
                    strokeWidth={2}
                    animationDuration={prefersReducedMotion ? 0 : 700}
                    isAnimationActive={!prefersReducedMotion}
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[8px] font-semibold uppercase tracking-wide text-neutral-muted">Expenses</span>
                <span className="max-w-[90%] truncate text-[10px] font-bold tabular-nums text-neutral-text">{formatCurrency(totalExpense)}</span>
              </div>
            </div>
            <div className="max-h-full min-w-0 flex-1 space-y-2 overflow-y-auto pl-2">
              {expenseData.filter((item) => item.value > 0).map((item, index) => (
                <div key={item.name} className="flex min-w-0 items-center gap-1.5" title={item.name}>
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="truncate text-[9px] font-medium text-neutral-muted">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-border p-4 flex flex-col justify-between">
          <div>
             <h3 className="font-bold text-sm mb-1 flex items-center gap-2"><span className="w-2 h-2 bg-neutral-muted rounded-full"></span> Budget vs. Actual</h3>
             <p className="text-xs text-neutral-muted mb-4">Performance Metrics</p>
          </div>
          <div className="space-y-4 text-sm font-medium">
             <div>
               <p className="mb-2">Saving Rate</p>
               <div className="flex justify-between items-center bg-primary/10 px-3 py-1.5 rounded-md mb-2">
                 <span>Budget</span> <span className="bg-primary/20 text-primary px-2 rounded font-bold">20%</span>
               </div>
               <div className="flex justify-between items-center bg-primary/10 px-3 py-1.5 rounded-md">
                 <span>Actual</span> <span className="bg-primary/20 text-primary px-2 rounded font-bold">
                   {totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0}%
                 </span>
               </div>
             </div>
             <div>
               <p className="mb-2">Recurring Bills</p>
               <div className="flex justify-between items-center bg-primary/10 px-3 py-1.5 rounded-md mb-2">
                 <span>Count</span> <span className="bg-primary/20 text-primary px-2 rounded font-bold">
                   {transactions.filter(t => t.isRecurring).length}
                 </span>
               </div>
             </div>
          </div>
        </div>

        {/* ROW 3 */}
        <div className="md:col-span-3 min-w-0 rounded-card border border-border bg-surface p-4 shadow-card">
          <h3 className="text-sm font-bold text-neutral-text">Income source</h3>
          <p className="mb-4 mt-1 text-xs text-neutral-muted">Actual income streams</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 220 }}>
              <BarChart data={incomeSourceData} margin={{ top: 12, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeBars" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b9a3ff" />
                    <stop offset="100%" stopColor="#6D4BC3" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis hide domain={[0, 'dataMax + 10%']} />
                <Tooltip content={<FintechChartTooltip seriesLabels={{ actual: 'Income' }} />} cursor={{ fill: 'rgba(109,75,195,0.08)' }} />
                <Bar dataKey="actual" fill="url(#incomeBars)" background={{ fill: 'var(--chart-grid)', radius: [7, 7, 0, 0] }} radius={[7, 7, 0, 0]} maxBarSize={28} animationDuration={prefersReducedMotion ? 0 : 700} isAnimationActive={!prefersReducedMotion} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-7 min-w-0 rounded-card border border-border bg-surface p-4 shadow-card">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-neutral-text">Actual vs budget</h3>
              <p className="mt-1 text-xs text-neutral-muted">Expenses by category</p>
            </div>
            <div className="flex shrink-0 items-center gap-3 pt-1 text-[10px] font-medium text-neutral-muted">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary-light" />Actual</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#B3A4E8]" />Budget</span>
            </div>
          </div>
          <div className="h-48 mt-2">
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 220 }}>
              <LineChart data={actualVsBudgetData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 6" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis hide />
                <Tooltip content={<FintechChartTooltip seriesLabels={{ actual: 'Actual', budget: 'Budget' }} />} />
                <Line type="monotone" dataKey="actual" stroke="#6D4BC3" strokeWidth={3} dot={{ r: 3, fill: '#6D4BC3', stroke: 'var(--surface-color)', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#fff', stroke: '#6D4BC3', strokeWidth: 3 }} animationDuration={prefersReducedMotion ? 0 : 800} isAnimationActive={!prefersReducedMotion} />
                <Line type="monotone" dataKey="budget" stroke="#A78BFA" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: '#fff', stroke: '#A78BFA', strokeWidth: 3 }} strokeDasharray="5 5" animationDuration={prefersReducedMotion ? 0 : 800} isAnimationActive={!prefersReducedMotion} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-border p-4 flex flex-col">
          <div>
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><span className="w-2 h-2 bg-neutral-muted rounded-full"></span> Highest Expenses</h3>
          </div>
          <div className="flex-1 flex flex-col justify-start gap-4 text-sm font-medium pt-4">
            {highestExpenses.length > 0 ? highestExpenses.map((exp, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="truncate max-w-[80px]" title={exp.name}>{exp.name}</span> 
                <span className="bg-primary/20 text-primary px-2 py-1 rounded font-bold tabular-nums">
                  {Math.round(exp.value)}
                </span>
              </div>
            )) : (
              <div className="text-neutral-muted text-xs">No expenses yet</div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default BudgetPlannerPage;
