import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import CardCarousel from '../components/dashboard/CardCarousel';
import FinancialStatsChart from '../components/dashboard/FinancialStatsChart';
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
  Pencil,
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

        {/* Right side controls: Date pill */}
        <div className="flex flex-col items-start gap-2.5 sm:items-end">
          {/* Date pill */}
          <div className="flex items-center gap-1.5 rounded-full border border-[#EBE8F3] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1F1B2D] shadow-sm">
            <Calendar size={13} className="text-[#6936F5]" />
            <span>{dateLabel}</span>
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Grid ── */}
      <div className="flex flex-col gap-6">
        
        {/* ── Row 1: Top Section (3 Equal-Height Columns: Wallet, Card Info, Financial Statistics) ── */}
        <section aria-label="Wallet and financial overview" className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
          
          {/* 1. Wallet card carousel panel */}
          <div className="lg:col-span-4 flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-sm min-h-[340px]">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CreditCard size={16} />
                </div>
                <span className="text-xs font-bold text-neutral-text">My Wallet</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/wallet')}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                + Add Card
              </button>
            </div>

            <div className="my-auto flex w-full items-center justify-center py-2">
              <CardCarousel
                wallets={wallets}
                onAddCard={() => navigate('/wallet')}
                onAddMoney={setTopUpWallet}
                onSelectionChange={setSelectedWallet}
              />
            </div>
            
            <div className="pt-2 text-center text-[10px] text-neutral-muted font-mono">
              Slide to view other cards
            </div>
          </div>

          {/* 2. Card Information panel */}
          <div className="lg:col-span-3 flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-sm min-h-[340px]">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Wallet size={16} />
                  </div>
                  <span className="text-xs font-bold text-neutral-text">Card Information</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/wallet')}
                  aria-label="Card options"
                  className="text-neutral-muted hover:text-neutral-text transition-colors"
                >
                  <MoreVertical size={16} />
                </button>
              </div>

              <h2 className="mt-4 truncate text-xl font-extrabold capitalize tracking-tight text-neutral-text">
                {selectedWallet?.cardName || selectedWallet?.bankName || selectedWallet?.cardType || 'Payment Card'}
              </h2>

              <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4">
                <div>
                  <dt className="text-[10px] font-medium text-neutral-muted">Status</dt>
                  <dd className="mt-1">
                    <span className="inline-flex rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {cardStatus}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-medium text-neutral-muted">Card type</dt>
                  <dd className="mt-1 truncate text-xs font-semibold capitalize text-neutral-text">
                    {selectedWallet?.cardType || 'Debit'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-medium text-neutral-muted">Card number</dt>
                  <dd className="mt-1 truncate font-mono text-[11px] font-semibold text-neutral-text">
                    {maskedCardNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-medium text-neutral-muted">Currency · expiry</dt>
                  <dd className="mt-1 truncate text-xs font-semibold text-neutral-text">
                    {user?.currency || 'INR'} · {selectedWallet?.expiryDate || '12/28'}
                  </dd>
                </div>
              </dl>
            </div>

            <button
              type="button"
              onClick={() => navigate('/wallet')}
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-primary transition hover:opacity-85"
            >
              Manage wallet <ArrowRight size={13} />
            </button>
          </div>

          {/* 3. Financial Statistics chart */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-sm min-h-[340px]">
            <FinancialStatsChart allTransactions={allTransactions} />
          </div>
        </section>

        {/* ── Row 2: Summary Cards (4 Equal Width, Equal Height, Uniform Alignment) ── */}
        <section aria-label="Monthly financial metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* 1. Monthly Income */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <ArrowDownLeft size={18} />
              </span>
              <button
                type="button"
                onClick={() => setIsBudgetModalOpen(true)}
                title="Edit budget and income"
                aria-label="Edit budget and income"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-muted transition-all hover:bg-primary/10 hover:text-primary"
              >
                <Pencil size={14} />
              </button>
            </div>
            <div className="mt-4">
              <p className="truncate text-xs font-semibold text-neutral-muted">Monthly Income</p>
              <p className="mt-1 truncate font-mono text-xl font-bold tracking-tight tabular-nums text-neutral-text">
                {formatCurrency(monthlyIncomeTotal)}
              </p>
            </div>
          </div>

          {/* 2. Expenses */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500">
                <ArrowUpRight size={18} />
              </span>
              <span className="text-[10px] font-medium text-neutral-muted">Total outflow</span>
            </div>
            <div className="mt-4">
              <p className="truncate text-xs font-semibold text-neutral-muted">Expenses</p>
              <p className="mt-1 truncate font-mono text-xl font-bold tracking-tight tabular-nums text-neutral-text">
                {formatCurrency(monthlyExpenseTotal)}
              </p>
            </div>
          </div>

          {/* 3. Budget Limit */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500">
                <ReceiptText size={18} />
              </span>
              <button
                type="button"
                onClick={() => setIsBudgetModalOpen(true)}
                title="Edit budget and income"
                aria-label="Edit budget and income"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-muted transition-all hover:bg-primary/10 hover:text-primary"
              >
                <Pencil size={14} />
              </button>
            </div>
            <div className="mt-4">
              <p className="truncate text-xs font-semibold text-neutral-muted">Budget Limit</p>
              <p className="mt-1 truncate font-mono text-xl font-bold tracking-tight tabular-nums text-neutral-text">
                {formatCurrency(budgetLimit)}
              </p>
            </div>
          </div>

          {/* 4. Budget Left */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Wallet size={18} />
              </span>
              <span className="text-[10px] font-medium text-neutral-muted">Safe balance</span>
            </div>
            <div className="mt-4">
              <p className="truncate text-xs font-semibold text-neutral-muted">Budget Left</p>
              <p className={`mt-1 truncate font-mono text-xl font-bold tracking-tight tabular-nums ${budgetLeft < 0 ? 'text-rose-500' : 'text-neutral-text'}`}>
                {budgetLeft < 0 ? `-${formatCurrency(Math.abs(budgetLeft))}` : formatCurrency(budgetLeft)}
              </p>
            </div>
          </div>
        </section>

        {/* ── Row 3: Bottom Section (2:1 Ratio on Desktop, Aligned Tops and Heights) ── */}
        <section aria-label="Transactions and savings" className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
          
          {/* Recent Transactions (~2/3 width -> lg:col-span-8) */}
          <div className="lg:col-span-8 flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-sm min-h-[320px]">
            <div>
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ReceiptText size={16} />
                  </div>
                  <h2 className="text-sm font-bold text-neutral-text">Recent Transactions</h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/transactions')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:underline"
                >
                  View All <ArrowRight size={13} />
                </button>
              </div>

              {/* Transactions List */}
              <div className="mt-2 divide-y divide-border/40">
                {transactions.length > 0 ? (
                  transactions.slice(0, 5).map((tx) => {
                    const details = getCategoryIconDetails(tx.category, tx.type);
                    const Icon = details.icon;
                    const isExpense = tx.type === 'expense';
                    return (
                      <div key={tx.id || Math.random()} className="flex items-center justify-between py-3 group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${details.bg} ${details.text}`}>
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-neutral-text">
                              {tx.category || tx.description || 'Transaction'}
                            </p>
                            <p className="mt-0.5 text-[10px] text-neutral-muted font-mono">
                              {formatTxDate(tx.date)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <p className={`font-mono text-xs font-bold tabular-nums ${isExpense ? 'text-neutral-text' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {isExpense ? `-${formatCurrency(tx.amount)}` : `+${formatCurrency(tx.amount)}`}
                          </p>
                          <button
                            type="button"
                            onClick={() => navigate('/transactions')}
                            aria-label="Transaction options"
                            className="text-neutral-muted hover:text-neutral-text"
                          >
                            <MoreVertical size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-xs text-neutral-muted font-mono">
                    No recent transactions recorded.
                  </div>
                )}
              </div>
            </div>
            
            <div className="pt-3 text-right">
              <span className="text-[10px] text-neutral-muted font-mono">Showing latest activity</span>
            </div>
          </div>

          {/* Savings Goal (~1/3 width -> lg:col-span-4) */}
          <div className="lg:col-span-4 flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-sm min-h-[320px]">
            <div>
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Target size={16} />
                  </div>
                  <h2 className="text-sm font-bold text-neutral-text">Savings goal</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddGoalModalOpen(true)}
                  aria-label="Open savings goal"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-muted hover:text-neutral-text"
                >
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Completion percentage */}
              <div className="mt-4">
                <p className="font-mono text-3xl font-black tracking-tight text-neutral-text">
                  {savingsProgress}%
                </p>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${savingsProgress}%` }}
                  />
                </div>
              </div>

              {/* Goal stats */}
              <div className="mt-4 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[10px] text-neutral-muted uppercase tracking-wider">Goal target</p>
                  <p className="font-mono font-bold tabular-nums text-neutral-text">
                    {formatCurrency(savingsGoalTotal)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-neutral-muted uppercase tracking-wider">Completed</p>
                  <p className="font-mono font-bold tabular-nums text-neutral-text">
                    {formatCurrency(savingsGoalTotal * (savingsProgress / 100))}
                  </p>
                </div>
              </div>
            </div>

            {/* Add goal action aligned at bottom */}
            <button
              type="button"
              onClick={() => setIsAddGoalModalOpen(true)}
              className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-xs font-semibold text-primary transition hover:border-primary/50 hover:bg-primary/5"
            >
              <Plus size={14} /> Add savings goal
            </button>
          </div>
        </section>
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
