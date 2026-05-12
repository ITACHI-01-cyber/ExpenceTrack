import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import CardCarousel from '../components/dashboard/CardCarousel';
import BudgetProgress from '../components/dashboard/BudgetProgress';
import ExpenseStatsChart from '../components/dashboard/ExpenseStatsChart';
import RecentPayments from '../components/dashboard/RecentPayments';
import MonthlyExpenseGrid from '../components/dashboard/MonthlyExpenseGrid';
import SavingsGoalsGrid from '../components/dashboard/SavingsGoalsGrid';
import EditBudgetModal from '../components/ui/EditBudgetModal';
import AddGoalModal from '../components/ui/AddGoalModal';
import { formatCurrency } from '../utils/formatCurrency';
import { Settings2 } from 'lucide-react';
import api from '../services/api';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);

  const [allTransactions, setAllTransactions] = useState([]);

  const fetchData = async () => {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const [summaryRes, txRes, walletRes, goalsRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get(`/transactions?month=${month}&year=${year}`),
        api.get('/wallet'),
        api.get(`/goals?month=${month}&year=${year}`)
      ]);

      if (summaryRes.data.success) {
        setSummary(summaryRes.data.data);
      }
      if (txRes.data.success) {
        const sorted = txRes.data.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setAllTransactions(sorted);
        setTransactions(sorted.slice(0, 4));
      }
      if (walletRes.data.success) {
        setWallets(walletRes.data.data);
      }
      if (goalsRes && goalsRes.data && goalsRes.data.success) {
        setGoals(goalsRes.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const chartData = React.useMemo(() => {
    const expensesByDay = {};
    allTransactions.forEach(tx => {
      if (tx.type === 'expense') {
        const dateObj = new Date(tx.date);
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        expensesByDay[dateStr] = (expensesByDay[dateStr] || 0) + tx.amount;
      }
    });
    const grouped = Object.entries(expensesByDay).map(([date, value]) => ({ 
      date, 
      value, 
      timestamp: new Date(date + ` ${new Date().getFullYear()}`).getTime() 
    }));
    const sorted = grouped.sort((a, b) => a.timestamp - b.timestamp).map(({ date, value }) => ({ date, value }));
    return sorted.length > 0 ? sorted : [{ date: 'No Data', value: 0 }];
  }, [allTransactions]);

  const expenseCategories = React.useMemo(() => {
    const categories = {};
    allTransactions.forEach(tx => {
      if (tx.type === 'expense') {
        const catName = tx.category || 'Uncategorized';
        categories[catName] = (categories[catName] || 0) + tx.amount;
      }
    });
    const mapped = Object.entries(categories)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
    return mapped.length > 0 ? mapped : [{ name: 'No Expenses Yet', amount: 0 }];
  }, [allTransactions]);

  if (loading) {
    return (
      <Layout>
        <TopBar />
        <div className="flex items-center justify-center h-64 text-primary">Loading dashboard...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <TopBar />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-4 flex flex-col w-full overflow-hidden">
          {/* Samsung Wallet Style Carousel */}
          <CardCarousel wallets={wallets} onAddCard={() => navigate('/wallet')} />
          
          <div className="mt-4 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-border group relative">
            <span className="text-neutral-muted text-sm font-medium">Monthly Income</span>
            <span className="text-success font-semibold tabular-nums">{formatCurrency(summary?.monthlyIncome)}</span>
            <button 
              onClick={() => setIsBudgetModalOpen(true)}
              className="absolute right-2 top-2 p-1.5 bg-background rounded-full text-neutral-muted hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
              title="Edit Limits"
            >
              <Settings2 size={16} />
            </button>
          </div>

          <div className="relative group mt-4">
            <BudgetProgress 
              limit={summary?.monthlyBudgetLimit || 0} 
              spent={summary?.monthlySpent || 0} 
            />
            <button 
              onClick={() => setIsBudgetModalOpen(true)}
              className="absolute right-4 top-4 p-1.5 bg-background rounded-full text-neutral-muted hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              title="Edit Limits"
            >
              <Settings2 size={16} />
            </button>
          </div>

          <RecentPayments transactions={transactions} />
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-8 flex flex-col gap-8 w-full overflow-hidden">
          
          <div className="h-[300px]">
            <ExpenseStatsChart data={chartData} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            <div className="flex-1">
              <MonthlyExpenseGrid categories={expenseCategories} />
            </div>
            <div className="flex-1">
              <SavingsGoalsGrid goals={goals} onAddClick={() => setIsAddGoalModalOpen(true)} />
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
      />

      <AddGoalModal 
        isOpen={isAddGoalModalOpen}
        onClose={() => setIsAddGoalModalOpen(false)}
        onSaveSuccess={fetchData}
      />
    </Layout>
  );
};

export default DashboardPage;
