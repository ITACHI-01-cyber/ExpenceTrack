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
import SavingsCard3D from '../components/dashboard/SavingsCard3D';
import EditBudgetModal from '../components/ui/EditBudgetModal';
import AddGoalModal from '../components/ui/AddGoalModal';
import EditGoalModal from '../components/ui/EditGoalModal';
import AddBalanceModal from '../components/ui/AddBalanceModal';
import { formatCurrency } from '../utils/formatCurrency';
import { Settings2 } from 'lucide-react';
import api from '../services/api';
import walletService from '../services/walletService';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
  const [selectedGoalToEdit, setSelectedGoalToEdit] = useState(null);
  const [topUpWallet, setTopUpWallet] = useState(null);

  const [allTransactions, setAllTransactions] = useState([]);
  const [gridTransactions, setGridTransactions] = useState([]);
  const [gridFilterType, setGridFilterType] = useState('month'); // 'week' | 'month' | 'lastMonth' | 'year' | 'custom'
  const [gridCustomRange, setGridCustomRange] = useState({ startDate: '', endDate: '' });

  const getTransactionsQueryString = (type, range) => {
    const now = new Date();
    const formatDate = (date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    if (type === 'week') {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      const startDate = formatDate(startOfWeek);
      const endDate = formatDate(now);
      return `?startDate=${startDate}&endDate=${endDate}`;
    } else if (type === 'month') {
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      return `?month=${month}&year=${year}`;
    } else if (type === 'lastMonth') {
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const month = lastMonthDate.getMonth() + 1;
      const year = lastMonthDate.getFullYear();
      return `?month=${month}&year=${year}`;
    } else if (type === 'year') {
      const year = now.getFullYear();
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      return `?startDate=${startDate}&endDate=${endDate}`;
    } else if (type === 'custom' && range?.startDate && range?.endDate) {
      return `?startDate=${range.startDate}&endDate=${range.endDate}`;
    } else {
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      return `?month=${month}&year=${year}`;
    }
  };

  const fetchGridTransactions = async (type, range) => {
    try {
      const query = getTransactionsQueryString(type, range);
      const res = await api.get(`/transactions${query}`);
      if (res.data.success) {
        setGridTransactions(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch grid transactions", err);
    }
  };

  const handleGridFilterChange = async (type, range) => {
    setGridFilterType(type);
    if (range) {
      setGridCustomRange(range);
    }
    await fetchGridTransactions(type, range);
  };

  const fetchData = async () => {
    try {
      const w = await walletService.getAll();
      setWallets(w || []);
    } catch (err) {
      console.error('Failed to fetch wallets', err);
    }

    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const gridQuery = getTransactionsQueryString(gridFilterType, gridCustomRange);

      const [summaryRes, txRes, goalsRes, gridTxRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get(`/transactions?month=${month}&year=${year}`),
        api.get(`/goals?month=${month}&year=${year}`),
        api.get(`/transactions${gridQuery}`)
      ]);

      if (summaryRes.data.success) {
        setSummary(summaryRes.data.data);
      }
      if (txRes.data.success) {
        const sorted = txRes.data.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setAllTransactions(sorted);
        setTransactions(sorted.slice(0, 4));
      }
      if (goalsRes && goalsRes.data && goalsRes.data.success) {
        setGoals(goalsRes.data.data);
      }
      if (gridTxRes.data.success) {
        setGridTransactions(gridTxRes.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    return undefined;
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
    gridTransactions.forEach(tx => {
      if (tx.type === 'expense') {
        const catName = tx.category?.trim() || 'Uncategorized';
        const categoryKey = catName.toLocaleLowerCase();
        if (!categories[categoryKey]) {
          categories[categoryKey] = { name: catName, amount: 0 };
        }
        categories[categoryKey].amount += tx.amount;
      }
    });
    const mapped = Object.values(categories)
      .sort((a, b) => b.amount - a.amount);
    return mapped;
  }, [gridTransactions]);

  const handleGoalStatusChange = async (goal, completed) => {
    if (goal.completed === completed) return;

    const updatedGoal = { ...goal, completed };

    setGoals((currentGoals) =>
      currentGoals.map((item) => item.id === goal.id ? updatedGoal : item)
    );

    try {
      const res = await api.patch(`/goals/${goal.id}/status`, null, {
        params: { completed }
      });
      if (res.data.success) {
        setGoals((currentGoals) =>
          currentGoals.map((item) => item.id === goal.id ? res.data.data : item)
        );
      }
    } catch (err) {
      console.error('Failed to update goal status', err);
      setGoals((currentGoals) =>
        currentGoals.map((item) => item.id === goal.id ? goal : item)
      );
    }
  };

  const handleEditGoalClick = (goal) => {
    setSelectedGoalToEdit(goal);
    setIsEditGoalModalOpen(true);
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm("Are you sure you want to delete this target?")) return;
    try {
      const res = await api.delete(`/goals/${goalId}`);
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      console.error("Failed to delete goal", err);
    }
  };

  const handleAddBalance = (amount) => {
    (async () => {
      try {
        await walletService.addMoney(topUpWallet.id, amount);
        const w = await walletService.getAll();
        setWallets(w || []);
      } catch (err) {
        console.error('Failed to top up wallet', err);
      }
    })();
  };

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
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-4 flex flex-col w-full overflow-hidden">
          {/* Samsung Wallet Style Carousel */}
          <CardCarousel
            wallets={wallets}
            onAddCard={() => navigate('/wallet')}
            onAddMoney={setTopUpWallet}
          />
          
          <div className="mt-4 flex justify-between items-center rounded-xl border border-border bg-white p-4 shadow-sm group relative md:mt-6">
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
        <div className="lg:col-span-8 flex flex-col gap-6 w-full overflow-hidden lg:gap-8">
          
          <div className="h-[360px] sm:h-[380px]">
            <ExpenseStatsChart data={chartData} allTransactions={allTransactions} />
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-8">
            <div className="flex-1">
              <MonthlyExpenseGrid 
                categories={expenseCategories} 
                filterType={gridFilterType}
                customRange={gridCustomRange}
                onFilterChange={handleGridFilterChange}
              />
            </div>
            <div className="flex-1">
              <div className="mb-4 max-w-xs sm:max-w-sm">
                <SavingsCard3D goals={goals} />
              </div>
              <SavingsGoalsGrid
                goals={goals}
                onAddClick={() => setIsAddGoalModalOpen(true)}
                onStatusChange={handleGoalStatusChange}
                onEditClick={handleEditGoalClick}
                onDeleteClick={handleDeleteGoal}
              />
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

      <EditGoalModal
        isOpen={isEditGoalModalOpen}
        onClose={() => {
          setIsEditGoalModalOpen(false);
          setSelectedGoalToEdit(null);
        }}
        goal={selectedGoalToEdit}
        onSaveSuccess={fetchData}
      />

      <AddBalanceModal
        wallet={topUpWallet}
        isOpen={Boolean(topUpWallet)}
        onClose={() => setTopUpWallet(null)}
        onConfirm={handleAddBalance}
      />
    </Layout>
  );
};

export default DashboardPage;
