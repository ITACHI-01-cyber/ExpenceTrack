import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import CardCarousel from '../components/dashboard/CardCarousel';
import EditBudgetModal from '../components/ui/EditBudgetModal';
import AddGoalModal from '../components/ui/AddGoalModal';
import EditGoalModal from '../components/ui/EditGoalModal';
import AddBalanceModal from '../components/ui/AddBalanceModal';
import PayCreditCardModal from '../components/ui/PayCreditCardModal';
import { formatCurrency } from '../utils/formatCurrency';
import { apiAssetUrl } from '../services/api';
import api from '../services/api';
import walletService from '../services/walletService';
import useAuthStore from '../store/authStore';
import guestStorage from '../services/guestStorage';
import {
  Search,
  Bell,
  Calendar,
  Wallet,
  MoreVertical,
  BarChart3,
  ArrowDownLeft,
  ArrowUpRight,
  ReceiptText,
  Target,
  ArrowRight,
  Utensils,
  Heart,
  MoreHorizontal,
  ShoppingBag,
  Plus,
  CreditCard,
  ChevronDown,
  Clock,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { isGuest, user } = useAuthStore();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [goals, setGoals] = useState([]);
  const [creditActivity, setCreditActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
  const [selectedGoalToEdit, setSelectedGoalToEdit] = useState(null);
  const [topUpWallet, setTopUpWallet] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedCardForPayment, setSelectedCardForPayment] = useState(null);

  const fetchData = async () => {
    try {
      if (isGuest) {
        setWallets(guestStorage.wallets.getAll());
      } else {
        const w = await walletService.getAll();
        setWallets(w || []);
      }
    } catch (err) {
      console.error('Failed to fetch wallets', err);
    }

    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      if (isGuest) {
        const summaryData = guestStorage.budget.getSummary();
        setSummary(summaryData);

        const allTx = guestStorage.transactions.getAll({ month, year });
        const sorted = allTx.sort((a, b) => new Date(b.date) - new Date(a.date));
        setAllTransactions(sorted);
        setTransactions(sorted.slice(0, 5));

        const allGoals = guestStorage.goals.getAll({ month, year });
        setGoals(allGoals);
      } else {
        const [summaryRes, txRes, goalsRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get(`/transactions?month=${month}&year=${year}`),
          api.get(`/goals?month=${month}&year=${year}`)
        ]);

        if (summaryRes.data.success) {
          setSummary(summaryRes.data.data);
        }
        if (txRes.data.success) {
          const sorted = txRes.data.data.sort((a, b) => new Date(b.date) - new Date(a.date));
          setAllTransactions(sorted);
          setTransactions(sorted.slice(0, 5));
        }
        if (goalsRes?.data?.success) {
          setGoals(goalsRes.data.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const cards = wallets.filter(
      (wallet) => wallet.cardType?.toLowerCase() === 'credit' && wallet.creditTermsConfigured
    );
    if (cards.length === 0) {
      setCreditActivity([]);
      return;
    }
    let cancelled = false;
    Promise.all(cards.map(async (card) => {
      const items = isGuest
        ? guestStorage.transactions.getCreditActivity(card.id)
        : await walletService.getCreditActivity(card.id);
      return items || [];
    }))
      .then((lists) => {
        if (!cancelled) {
          setCreditActivity(lists.flat());
        }
      })
      .catch((error) => {
        console.error('Credit repayment activity could not be loaded', error);
      });
    return () => {
      cancelled = true;
    };
  }, [wallets, isGuest]);

  // Derived financial totals
  const monthlyExpenseTotal = useMemo(() => {
    return allTransactions.reduce(
      (total, tx) => total + (tx.type === 'expense' ? Number(tx.amount) || 0 : 0),
      0
    );
  }, [allTransactions]);

  const monthlyIncomeTotal = useMemo(() => {
    return Number(summary?.monthlyIncome) || allTransactions.reduce(
      (total, tx) => total + (tx.type === 'income' ? Number(tx.amount) || 0 : 0),
      0
    );
  }, [summary, allTransactions]);

  const budgetLimit = Number(summary?.monthlyBudgetLimit) || 0;
  const budgetSpent = Number(summary?.monthlySpent) || monthlyExpenseTotal;
  const budgetLeft = budgetLimit - budgetSpent;

  // Expense summary percentage (safe division)
  const expensePercentage = useMemo(() => {
    if (budgetLimit > 0) {
      return Math.min(100, Math.round((monthlyExpenseTotal / budgetLimit) * 1000) / 10);
    }
    if (monthlyIncomeTotal > 0) {
      return Math.min(100, Math.round((monthlyExpenseTotal / monthlyIncomeTotal) * 1000) / 10);
    }
    return monthlyExpenseTotal > 0 ? 100 : 0;
  }, [monthlyExpenseTotal, budgetLimit, monthlyIncomeTotal]);

  // Savings goals calculation
  const savingsGoalTotal = useMemo(() => {
    return goals.reduce((total, goal) => total + (Number(goal.amount) || 0), 0);
  }, [goals]);

  const completedSavingsTotal = useMemo(() => {
    return goals.reduce(
      (total, goal) => total + (goal.completed ? Number(goal.amount) || 0 : 0),
      0
    );
  }, [goals]);

  const savingsProgress = savingsGoalTotal > 0
    ? Math.min(100, Math.round((completedSavingsTotal / savingsGoalTotal) * 100))
    : 0;

  // Selected card attributes
  const cardNumber = String(selectedWallet?.cardNumber || '');
  const maskedCardNumber = cardNumber
    ? (selectedWallet?.cardType?.toLowerCase() === 'upi' ? cardNumber : `•••• •••• •••• ${cardNumber.slice(-4)}`)
    : 'Not available';
  const cardStatus = selectedWallet?.status || (Number(selectedWallet?.balance) > 0 || selectedWallet?.creditTermsConfigured ? 'Active' : 'Empty');

  // Date formatting helper for header
  const currentDate = new Date();
  const dateLabel = currentDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Relative / friendly date formatting for recent transactions
  const formatTxDate = (dateStr) => {
    if (!dateStr) return 'Recent';
    const txDate = new Date(dateStr);
    const now = new Date();
    const isToday = txDate.toDateString() === now.toDateString();
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = txDate.toDateString() === yesterday.toDateString();

    const timeStr = txDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today, ${timeStr}`;
    if (isYesterday) return `Yesterday, ${timeStr}`;
    return txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getCategoryIconDetails = (category, type) => {
    const cat = (category || '').toLowerCase();
    if (type === 'income') {
      return { icon: ArrowDownLeft, bg: 'bg-[#E6F8F3]', text: 'text-[#00B074]' };
    }
    if (cat.includes('food') || cat.includes('grocer') || cat.includes('din')) {
      return { icon: Utensils, bg: 'bg-[#FEECEB]', text: 'text-[#FF5A5F]' };
    }
    if (cat.includes('health') || cat.includes('med') || cat.includes('fit')) {
      return { icon: Heart, bg: 'bg-[#FFE8EC]', text: 'text-[#FF3B69]' };
    }
    if (cat.includes('shop') || cat.includes('cloth') || cat.includes('buy')) {
      return { icon: ShoppingBag, bg: 'bg-[#EBF0FF]', text: 'text-[#4F6BFF]' };
    }
    return { icon: MoreHorizontal, bg: 'bg-[#F1EBFB]', text: 'text-[#704FE6]' };
  };

  // Credit card bills helper
  const configuredCreditCards = wallets.filter(
    (w) => w.cardType?.toLowerCase() === 'credit' && w.creditTermsConfigured
  );

  const handleAddBalance = async (amount) => {
    try {
      if (isGuest) {
        guestStorage.wallets.addMoney(topUpWallet.id, amount);
        setWallets(guestStorage.wallets.getAll());
      } else {
        await walletService.addMoney(topUpWallet.id, amount);
        const w = await walletService.getAll();
        setWallets(w || []);
      }
    } catch (err) {
      console.error('Failed to top up wallet', err);
    }
  };

  const handlePayCreditCardSubmit = async (cardId, request) => {
    if (isGuest) {
      const res = guestStorage.transactions.repay(cardId, request);
      await fetchData();
      return res;
    } else {
      const res = await walletService.repay(cardId, request);
      await fetchData();
      return res;
    }
  };

  const handleGoalStatusChange = async (goal, completed) => {
    if (goal.completed === completed) return;
    const updatedGoal = { ...goal, completed };
    setGoals((currentGoals) =>
      currentGoals.map((item) => (item.id === goal.id ? updatedGoal : item))
    );
    try {
      if (isGuest) {
        const result = guestStorage.goals.updateStatus(goal.id, completed);
        if (result) {
          setGoals((currentGoals) =>
            currentGoals.map((item) => (item.id === goal.id ? result : item))
          );
        }
      } else {
        const res = await api.patch(`/goals/${goal.id}/status`, null, {
          params: { completed },
        });
        if (res.data?.success) {
          setGoals((currentGoals) =>
            currentGoals.map((item) => (item.id === goal.id ? res.data.data : item))
          );
        }
      }
    } catch (err) {
      console.error('Failed to update goal status', err);
      fetchData();
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex h-96 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#6936F5]/20 border-t-[#6936F5]" />
            <p className="text-sm font-medium text-neutral-muted">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const username = user?.name ? user.name.split(' ')[0] : 'User';

  return (
    <Layout>
      {/* ── Top Header matching reference ── */}
      <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start md:mb-7">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#704FE6]">
            PERSONAL FINANCE
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#171329] sm:text-3xl">
            Welcome back, <span className="text-[#6936F5]">{username}</span>
          </h1>
          <p className="mt-1 text-xs text-[#77728A] sm:text-sm">
            A clearer view of your money, every day.
          </p>
        </div>

        {/* Right side controls: Search, Notification, Avatar, and Date pill */}
        <div className="flex flex-col items-start gap-2.5 sm:items-end">
          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E97B3]" />
              <input
                type="text"
                placeholder="Search transactions..."
                onClick={() => navigate('/transactions')}
                readOnly
                className="h-10 w-44 cursor-pointer rounded-full border border-[#EBE8F3] bg-white pl-9 pr-4 text-xs font-medium text-[#1F1B2D] placeholder:text-[#9E97B3] shadow-sm transition hover:border-[#6936F5]/40 sm:w-52"
              />
            </div>

            {/* Notification button */}
            <button
              type="button"
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#EBE8F3] bg-white text-[#1F1B2D] shadow-sm transition hover:bg-[#FAF8FD]"
            >
              <Bell size={17} />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-[#FF4757] ring-2 ring-white" />
            </button>

            {/* User Avatar */}
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#6936F5] text-sm font-bold text-white shadow-sm ring-2 ring-[#6936F5]/20">
              {user?.profilePicture ? (
                <img src={apiAssetUrl(user.profilePicture)} alt="User" className="h-full w-full object-cover" />
              ) : (
                username.charAt(0).toLowerCase()
              )}
            </div>
          </div>

          {/* Date pill */}
          <div className="flex items-center gap-1.5 rounded-full border border-[#EBE8F3] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1F1B2D] shadow-sm">
            <Calendar size={13} className="text-[#6936F5]" />
            <span>{dateLabel}</span>
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Grid ── */}
      <div className="flex flex-col gap-5">
        
        {/* ── Row 1: Wallet Carousel + Card Info + Expense Summary ── */}
        <section aria-label="Wallet and expense overview" className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
          
          {/* 1. Wallet card carousel panel */}
          <div className="lg:col-span-5 flex flex-col justify-center rounded-[1.75rem] border border-[#EBE8F3] bg-white p-4 shadow-[0_10px_30px_rgba(25,15,45,0.03)] sm:p-5">
            <CardCarousel
              wallets={wallets}
              onAddCard={() => navigate('/wallet')}
              onAddMoney={setTopUpWallet}
              onSelectionChange={setSelectedWallet}
            />
          </div>

          {/* 2. Card Information panel */}
          <div className="lg:col-span-3 flex flex-col justify-between rounded-[1.75rem] border border-[#EBE8F3] bg-white p-5 shadow-[0_10px_30px_rgba(25,15,45,0.03)]">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1EBFB] text-[#6936F5]">
                    <Wallet size={17} />
                  </div>
                  <span className="text-xs font-bold text-[#1F1B2D]">Card Information</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/wallet')}
                  aria-label="Card options"
                  className="text-neutral-400 hover:text-neutral-700"
                >
                  <MoreVertical size={16} />
                </button>
              </div>

              <h2 className="mt-4 text-xl font-extrabold capitalize tracking-tight text-[#171329]">
                {selectedWallet?.cardName || selectedWallet?.bankName || selectedWallet?.cardType || 'Payment Card'}
              </h2>

              <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4">
                <div>
                  <dt className="text-[10px] font-medium text-[#77728A]">Status</dt>
                  <dd className="mt-1">
                    <span className="inline-flex rounded-full bg-[#E6F8F3] px-2.5 py-0.5 text-[10px] font-bold text-[#00B074]">
                      {cardStatus}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-medium text-[#77728A]">Card type</dt>
                  <dd className="mt-1 truncate text-xs font-semibold capitalize text-[#1F1B2D]">
                    {selectedWallet?.cardType || 'UPI'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-medium text-[#77728A]">Card number</dt>
                  <dd className="mt-1 truncate font-mono text-[11px] font-semibold text-[#1F1B2D]">
                    {maskedCardNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-medium text-[#77728A]">Currency · expiry</dt>
                  <dd className="mt-1 truncate text-xs font-semibold text-[#1F1B2D]">
                    {user?.currency || 'INR'} · {selectedWallet?.expiryDate || '—'}
                  </dd>
                </div>
              </dl>
            </div>

            <button
              type="button"
              onClick={() => navigate('/wallet')}
              className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-[#6936F5] transition hover:text-[#5225cb]"
            >
              Manage wallet <ArrowRight size={13} />
            </button>
          </div>

          {/* 3. Expense summary panel */}
          <div className="lg:col-span-4 flex flex-col justify-between rounded-[1.75rem] border border-[#EBE8F3] bg-white p-5 shadow-[0_10px_30px_rgba(25,15,45,0.03)]">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1EBFB] text-[#6936F5]">
                  <BarChart3 size={17} />
                </div>
                <div className="flex items-center gap-1 rounded-full border border-[#EBE8F3] bg-[#FAF8FD] px-3 py-1 text-[11px] font-semibold text-[#1F1B2D]">
                  <span>This Month</span>
                  <ChevronDown size={12} className="text-[#77728A]" />
                </div>
              </div>

              <p className="mt-4 text-xs font-semibold text-[#77728A]">Expense summary</p>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <p className="text-2xl font-black tracking-tight tabular-nums text-[#171329]">
                  {formatCurrency(monthlyExpenseTotal)}
                </p>
                <div className="text-right">
                  <span className="text-xs font-bold tabular-nums text-[#171329]">
                    {allTransactions.filter((tx) => tx.type === 'expense').length}
                  </span>
                  <p className="text-[10px] text-[#77728A]">Transactions</p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center gap-3">
                <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-[#EAE6F5]">
                  <div
                    className="h-full rounded-full bg-[#6936F5] transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.max(0, expensePercentage))}%` }}
                  />
                </div>
                <span className="text-xs font-bold tabular-nums text-[#1F1B2D]">
                  {expensePercentage}%
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Row 2: 4 Financial Metric Cards ── */}
        <section aria-label="Monthly financial metrics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* 1. Monthly Income */}
          <div className="flex min-w-0 flex-col justify-between rounded-[1.5rem] border border-[#EBE8F3] bg-white p-4 shadow-[0_8px_24px_rgba(25,15,45,0.03)] sm:p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E6F8F3] text-[#00B074]">
              <ArrowDownLeft size={18} />
            </span>
            <div className="mt-3">
              <p className="truncate text-[11px] font-semibold text-[#77728A]">Monthly Income</p>
              <p className="mt-1 truncate text-lg font-black tracking-tight tabular-nums text-[#171329] sm:text-xl">
                {formatCurrency(monthlyIncomeTotal)}
              </p>
            </div>
          </div>

          {/* 2. Expenses */}
          <div className="flex min-w-0 flex-col justify-between rounded-[1.5rem] border border-[#EBE8F3] bg-white p-4 shadow-[0_8px_24px_rgba(25,15,45,0.03)] sm:p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FEECEB] text-[#FF5A5F]">
              <ArrowUpRight size={18} />
            </span>
            <div className="mt-3">
              <p className="truncate text-[11px] font-semibold text-[#77728A]">Expenses</p>
              <p className="mt-1 truncate text-lg font-black tracking-tight tabular-nums text-[#171329] sm:text-xl">
                {formatCurrency(monthlyExpenseTotal)}
              </p>
            </div>
          </div>

          {/* 3. Budget Limit */}
          <div className="flex min-w-0 flex-col justify-between rounded-[1.5rem] border border-[#EBE8F3] bg-white p-4 shadow-[0_8px_24px_rgba(25,15,45,0.03)] sm:p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EBF0FF] text-[#4F6BFF]">
              <ReceiptText size={18} />
            </span>
            <div className="mt-3">
              <p className="truncate text-[11px] font-semibold text-[#77728A]">Budget Limit</p>
              <p className="mt-1 truncate text-lg font-black tracking-tight tabular-nums text-[#171329] sm:text-xl">
                {formatCurrency(budgetLimit)}
              </p>
            </div>
          </div>

          {/* 4. Budget Left */}
          <div className="flex min-w-0 flex-col justify-between rounded-[1.5rem] border border-[#EBE8F3] bg-white p-4 shadow-[0_8px_24px_rgba(25,15,45,0.03)] sm:p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1EBFB] text-[#6936F5]">
              <Wallet size={18} />
            </span>
            <div className="mt-3">
              <p className="truncate text-[11px] font-semibold text-[#77728A]">Budget Left</p>
              <p className={`mt-1 truncate text-lg font-black tracking-tight tabular-nums sm:text-xl ${budgetLeft < 0 ? 'text-[#FF5A5F]' : 'text-[#171329]'}`}>
                {budgetLeft < 0 ? `-${formatCurrency(Math.abs(budgetLeft))}` : formatCurrency(budgetLeft)}
              </p>
            </div>
          </div>
        </section>

        {/* ── Row 3: Recent Transactions (~2/3) + Savings Goal (~1/3) ── */}
        <section aria-label="Transactions and savings" className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
          
          {/* Recent Transactions (~2/3 width) */}
          <div className="lg:col-span-8 flex flex-col rounded-[1.75rem] border border-[#EBE8F3] bg-white p-5 shadow-[0_10px_30px_rgba(25,15,45,0.03)]">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1EBFB] text-[#6936F5]">
                  <ReceiptText size={17} />
                </div>
                <h2 className="text-sm font-extrabold text-[#171329]">Recent Transactions</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/transactions')}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#6936F5] transition hover:text-[#5225cb]"
              >
                View All <ArrowRight size={13} />
              </button>
            </div>

            {/* Transactions List */}
            <div className="mt-2 divide-y divide-[#F2EEFA]">
              {transactions.length > 0 ? (
                transactions.map((tx) => {
                  const details = getCategoryIconDetails(tx.category, tx.type);
                  const Icon = details.icon;
                  const isExpense = tx.type === 'expense';
                  return (
                    <div key={tx.id || Math.random()} className="flex items-center justify-between py-3.5 group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${details.bg} ${details.text}`}>
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-[#1F1B2D]">
                            {tx.category || tx.description || 'Transaction'}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#77728A]">
                            {formatTxDate(tx.date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <p className={`font-mono text-xs font-bold tabular-nums ${isExpense ? 'text-[#1F1B2D]' : 'text-[#00B074]'}`}>
                          {isExpense ? `-${formatCurrency(tx.amount)}` : `+${formatCurrency(tx.amount)}`}
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate('/transactions')}
                          aria-label="Transaction options"
                          className="text-neutral-400 opacity-60 hover:opacity-100"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-neutral-muted">
                  No recent transactions recorded.
                </div>
              )}
            </div>
          </div>

          {/* Savings Goal (~1/3 width) */}
          <div className="lg:col-span-4 flex flex-col justify-between rounded-[1.75rem] border border-[#EBE8F3] bg-white p-5 shadow-[0_10px_30px_rgba(25,15,45,0.03)]">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1EBFB] text-[#6936F5]">
                    <Target size={17} />
                  </div>
                  <h2 className="text-sm font-extrabold text-[#171329]">Savings goal</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddGoalModalOpen(true)}
                  aria-label="Open savings goal"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF8FD] text-[#6936F5] hover:bg-[#F1EBFB]"
                >
                  <ArrowRight size={15} />
                </button>
              </div>

              {/* Completion percentage */}
              <div className="mt-4">
                <p className="text-3xl font-black tracking-tight text-[#171329]">
                  {savingsProgress}%
                </p>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#EAE6F5]">
                  <div
                    className="h-full rounded-full bg-[#6936F5] transition-all duration-700"
                    style={{ width: `${savingsProgress}%` }}
                  />
                </div>
              </div>

              {/* Goal stats */}
              <div className="mt-3 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[10px] text-[#77728A]">Goal target</p>
                  <p className="font-bold tabular-nums text-[#171329]">
                    {formatCurrency(savingsGoalTotal)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#77728A]">Completed</p>
                  <p className="font-bold tabular-nums text-[#171329]">
                    {formatCurrency(completedSavingsTotal)}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Add Savings Goal button */}
            <button
              type="button"
              onClick={() => setIsAddGoalModalOpen(true)}
              className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-full bg-[#EFEAFF] py-2.5 text-xs font-bold text-[#6936F5] transition hover:bg-[#E4DDFF]"
            >
              <Plus size={15} /> Add savings goal
            </button>
          </div>
        </section>

        {/* Optional Credit Due Alerts banner if bills are due */}
        {configuredCreditCards.length > 0 && (
          <div className="rounded-2xl border border-[#EBE8F3] bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <CreditCard size={17} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1F1B2D]">Credit Card Management</p>
                <p className="text-[11px] text-[#77728A]">
                  Manage statements, payments, and balances for your {configuredCreditCards.length} configured card{configuredCreditCards.length > 1 ? 's' : ''}.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/wallet')}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#6936F5] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#5b2ee0]"
            >
              View Credit Wallet <ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <EditBudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        currentBudgetLimit={summary?.monthlyBudgetLimit}
        currentIncome={summary?.monthlyIncome}
        onSaveSuccess={fetchData}
        isGuest={isGuest}
      />

      <AddGoalModal
        isOpen={isAddGoalModalOpen}
        onClose={() => setIsAddGoalModalOpen(false)}
        onSaveSuccess={fetchData}
        isGuest={isGuest}
      />

      <EditGoalModal
        isOpen={isEditGoalModalOpen}
        onClose={() => {
          setIsEditGoalModalOpen(false);
          setSelectedGoalToEdit(null);
        }}
        goal={selectedGoalToEdit}
        onSaveSuccess={fetchData}
        isGuest={isGuest}
      />

      <AddBalanceModal
        wallet={topUpWallet}
        isOpen={Boolean(topUpWallet)}
        onClose={() => setTopUpWallet(null)}
        onConfirm={handleAddBalance}
      />

      <PayCreditCardModal
        isOpen={isPayModalOpen}
        onClose={() => {
          setIsPayModalOpen(false);
          setSelectedCardForPayment(null);
        }}
        card={selectedCardForPayment}
        allWallets={wallets}
        onPay={handlePayCreditCardSubmit}
        isGuest={isGuest}
      />
    </Layout>
  );
};

export default DashboardPage;
