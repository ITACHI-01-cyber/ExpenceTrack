import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { Wallet, TrendingUp, Receipt } from 'lucide-react';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import api from '../services/api';

const COLORS = ['#A78BFA', '#7C5CBF', '#4C1D95', '#C4B5FD', '#1F2937', '#6B7280'];

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
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

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

        <div className="md:col-span-6 bg-white rounded-xl shadow-sm border border-border p-4">
          <h3 className="font-bold text-center text-sm mb-1">Allocation Summary</h3>
          <p className="text-center text-xs text-neutral-muted mb-4">Actual Allocation Of The Income</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={allocationData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-3 bg-white rounded-xl shadow-sm border border-border p-4 flex flex-col items-center justify-center text-center">
          <p className="font-bold text-sm">Available Balance</p>
          <p className="text-xs text-neutral-muted mb-4">Total Across Wallets</p>
          <h2 className="text-4xl font-bold text-neutral-text tabular-nums"><AnimatedNumber value={summary?.availableBalance || 0} /></h2>
        </div>

        {/* ROW 2 */}
        <div className="md:col-span-3 bg-white rounded-xl shadow-sm border border-border p-4">
          <h3 className="font-bold text-sm mb-1">Bill Summary</h3>
          <p className="text-xs text-neutral-muted mb-4">Actual Bill Payments</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={billSummaryData}>
                <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} />
                <YAxis tick={{fontSize: 10}} />
                <Tooltip />
                <Bar dataKey="value" fill="#4C1D95" barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-4 bg-[#4C1D95] rounded-xl shadow-sm p-4 text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-sm mb-1 flex items-center gap-2"><span className="w-2 h-2 bg-white rounded-full"></span> Cashflow Summary</h3>
              <p className="text-xs text-white/70">Actual Vs Budget</p>
            </div>
            <div className="text-[10px] flex flex-col gap-1">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-white"></span> Actual</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#A78BFA]"></span> Budget</span>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowData} layout="vertical" margin={{top:0, right:0, left: 10, bottom:0}}>
                <XAxis type="number" tick={{fontSize: 10, fill: '#fff'}} />
                <YAxis dataKey="name" type="category" tick={{fontSize: 10, fill: '#fff'}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{color: '#000'}} />
                <Bar dataKey="actual" fill="#FFFFFF" barSize={8} />
                <Bar dataKey="budget" fill="#A78BFA" barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-3 bg-white rounded-xl shadow-sm border border-border p-4">
          <h3 className="font-bold text-sm mb-1 flex items-center gap-2"><span className="w-2 h-2 bg-neutral-muted rounded-full"></span> Expense Summary</h3>
          <p className="text-xs text-neutral-muted mb-4">Actual Expenses by Category</p>
          <div className="flex items-center h-48">
            <div className="w-1/2 text-[10px] space-y-1">
               {expenseData.map((d, i) => (
                 <div key={i} className="flex items-center gap-1 truncate" title={d.name}>
                   <span className="w-2 h-2 shrink-0" style={{backgroundColor: COLORS[i%COLORS.length]}}></span>
                   <span className="truncate">{d.name}</span>
                 </div>
               ))}
            </div>
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseData} innerRadius={30} outerRadius={50} dataKey="value" stroke="none">
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
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
        <div className="md:col-span-3 bg-white rounded-xl shadow-sm border border-border p-4">
          <h3 className="font-bold text-sm mb-1 flex items-center gap-2"><span className="w-2 h-2 bg-neutral-muted rounded-full"></span> Income Source</h3>
          <p className="text-xs text-neutral-muted mb-4">Actual Income Streams</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeSourceData}>
                <XAxis dataKey="name" tick={{fontSize: 10}} />
                <YAxis tick={{fontSize: 10}} />
                <Tooltip />
                <Bar dataKey="actual" fill="#1F2937" barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-7 bg-white rounded-xl shadow-sm border border-border p-4">
          <h3 className="font-bold text-sm mb-1 flex items-center gap-2"><span className="w-2 h-2 bg-neutral-muted rounded-full"></span> Actual Vs Budget</h3>
          <p className="text-xs text-neutral-muted mb-4">Expenses by Category</p>
          <div className="h-48 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={actualVsBudgetData}>
                <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={{stroke: '#e5e7eb'}} tickLine={false} />
                <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="actual" stroke="#1F2937" strokeWidth={2} dot={true} />
                <Line type="monotone" dataKey="budget" stroke="#9CA3AF" strokeWidth={1} dot={false} strokeDasharray="3 3" />
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
