import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import CardCarousel from '../components/dashboard/CardCarousel';
import BudgetProgress from '../components/dashboard/BudgetProgress';
import ExpenseStatsChart from '../components/dashboard/ExpenseStatsChart';
import MonthlyExpenseGrid from '../components/dashboard/MonthlyExpenseGrid';
import SavingsGoalsGrid from '../components/dashboard/SavingsGoalsGrid';
import EditBudgetModal from '../components/ui/EditBudgetModal';
import AddGoalModal from '../components/ui/AddGoalModal';
import EditGoalModal from '../components/ui/EditGoalModal';
import AddBalanceModal from '../components/ui/AddBalanceModal';
import PayCreditCardModal from '../components/ui/PayCreditCardModal';
import { formatCurrency } from '../utils/formatCurrency';
import { calculateNextDueDate } from '../utils/dateHelpers';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle,
  Clock,
  CreditCard,
  Percent,
  Plus,
  ReceiptText,
  Settings2,
  Target,
  Wallet,
} from 'lucide-react';
import api from '../services/api';
import walletService from '../services/walletService';
import useAuthStore from '../store/authStore';
import guestStorage from '../services/guestStorage';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { isGuest, user } = useAuthStore();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [creditActivity, setCreditActivity] = useState([]);
  const [creditActivityError, setCreditActivityError] = useState('');
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
  const [selectedGoalToEdit, setSelectedGoalToEdit] = useState(null);
  const [topUpWallet, setTopUpWallet] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedCardForPayment, setSelectedCardForPayment] = useState(null);

  const [allTransactions, setAllTransactions] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
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
      if (isGuest) {
        const params = Object.fromEntries(new URLSearchParams(query.replace('?', '')));
        setGridTransactions(guestStorage.transactions.getAll(params));
      } else {
        const res = await api.get(`/transactions${query}`);
        if (res.data.success) {
          setGridTransactions(res.data.data);
        }
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
    // ── Wallets ──
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
        // Guest: read directly from localStorage
        const summaryData = guestStorage.budget.getSummary();
        setSummary(summaryData);

        const allTx = guestStorage.transactions.getAll({ month, year });
        const sorted = allTx.sort((a, b) => new Date(b.date) - new Date(a.date));
        setAllTransactions(sorted);
        setTransactions(sorted.slice(0, 4));

        const allGoals = guestStorage.goals.getAll({ month, year });
        setGoals(allGoals);

        // Grid transactions for the current filter
        const gridQuery = getTransactionsQueryString(gridFilterType, gridCustomRange);
        const gridParams = Object.fromEntries(new URLSearchParams(gridQuery.replace('?', '')));
        const gridTx = guestStorage.transactions.getAll(gridParams);
        setGridTransactions(gridTx);
      } else {
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

  useEffect(() => {
    const cards = wallets.filter(
      (wallet) => wallet.cardType?.toLowerCase() === 'credit' && wallet.creditTermsConfigured
    );
    if (cards.length === 0) {
      setCreditActivity([]);
      setCreditActivityError('');
      return undefined;
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
          setCreditActivityError('');
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setCreditActivityError(error.message || 'Credit repayment activity could not be loaded.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [wallets, isGuest]);

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

  const monthlyExpenseTotal = allTransactions.reduce(
    (total, transaction) => total + (transaction.type === 'expense' ? Number(transaction.amount) || 0 : 0),
    0
  );
  const monthlyIncomeTotal = Number(summary?.monthlyIncome) || allTransactions.reduce(
    (total, transaction) => total + (transaction.type === 'income' ? Number(transaction.amount) || 0 : 0),
    0
  );
  const configuredCreditCards = wallets.filter(
    (wallet) => wallet.cardType?.toLowerCase() === 'credit' && wallet.creditTermsConfigured
  );
  const outstandingCreditTotal = configuredCreditCards.reduce(
    (total, wallet) => total + (Number(wallet.outstandingBalance) || 0),
    0
  );
  const totalCreditLimit = configuredCreditCards.reduce(
    (total, wallet) => total + (Number(wallet.creditLimit) || 0),
    0
  );
  const availableCreditTotal = configuredCreditCards.reduce(
    (total, wallet) => total + Math.max(0, (Number(wallet.creditLimit) || 0) - (Number(wallet.outstandingBalance) || 0)),
    0
  );
  const overallUtilization = totalCreditLimit > 0
    ? Math.min(100, Math.round((outstandingCreditTotal / totalCreditLimit) * 100))
    : 0;
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const paymentsThisMonth = creditActivity
    .filter((item) => item.transactionKind === 'repayment' && String(item.paymentDate || item.date || '').startsWith(currentMonthPrefix))
    .reduce((total, item) => total + (Number(item.amount) || 0), 0);
  const totalCreditRepayments = creditActivity
    .filter((item) => item.transactionKind === 'repayment')
    .reduce((total, item) => total + (Number(item.amount) || 0), 0);

  const creditCardBills = configuredCreditCards.map((card) => {
    const due = calculateNextDueDate(card);
    const balance = Number(card.outstandingBalance || 0);
    return {
      ...card,
      due,
      hasBalance: balance > 0,
    };
  });
  const overdueCount = creditCardBills.filter((b) => b.hasBalance && b.due?.status === 'overdue').length;
  const upcomingCount = creditCardBills.filter((b) => b.hasBalance && (b.due?.status === 'upcoming' || b.due?.status === 'due_today')).length;

  const handleOpenPayModal = (card) => {
    setSelectedCardForPayment(card);
    setIsPayModalOpen(true);
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
  const savingsGoalTotal = goals.reduce((total, goal) => total + (Number(goal.amount) || 0), 0);
  const completedSavingsTotal = goals.reduce(
    (total, goal) => total + (goal.completed ? Number(goal.amount) || 0 : 0),
    0
  );
  const savingsProgress = savingsGoalTotal > 0
    ? Math.min((completedSavingsTotal / savingsGoalTotal) * 100, 100)
    : 0;
  const cardNumber = String(selectedWallet?.cardNumber || '');
  const maskedCardNumber = cardNumber
    ? `•••• •••• •••• ${cardNumber.slice(-4)}`
    : 'Not available';
  const cardStatus = selectedWallet?.status || (Number(selectedWallet?.balance) > 0 ? 'Active' : 'Empty');

  const handleGoalStatusChange = async (goal, completed) => {
    if (goal.completed === completed) return;

    const updatedGoal = { ...goal, completed };

    setGoals((currentGoals) =>
      currentGoals.map((item) => item.id === goal.id ? updatedGoal : item)
    );

    try {
      if (isGuest) {
        const result = guestStorage.goals.updateStatus(goal.id, completed);
        if (result) {
          setGoals((currentGoals) =>
            currentGoals.map((item) => item.id === goal.id ? result : item)
          );
        }
      } else {
        const res = await api.patch(`/goals/${goal.id}/status`, null, {
          params: { completed }
        });
        if (res.data.success) {
          setGoals((currentGoals) =>
            currentGoals.map((item) => item.id === goal.id ? res.data.data : item)
          );
        }
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
      if (isGuest) {
        guestStorage.goals.remove(goalId);
        fetchData();
      } else {
        const res = await api.delete(`/goals/${goalId}`);
        if (res.data.success) {
          fetchData();
        }
      }
    } catch (err) {
      console.error("Failed to delete goal", err);
    }
  };

  const handleAddBalance = (amount) => {
    (async () => {
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
      
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="grid min-w-0 grid-cols-1 items-center gap-3 overflow-hidden rounded-card border border-border bg-surface p-3 shadow-card sm:p-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(220px,0.75fr)]">
            <CardCarousel
              wallets={wallets}
              onAddCard={() => navigate('/wallet')}
              onAddMoney={setTopUpWallet}
              onSelectionChange={setSelectedWallet}
            />

            <div className="rounded-2xl border border-border bg-background/70 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-muted">Card information</p>
                  <h2 className="mt-1 truncate text-base font-bold text-neutral-text">
                    {selectedWallet?.bankName || selectedWallet?.cardType || 'Your card'}
                  </h2>
                </div>
                <CreditCard size={19} className="shrink-0 text-primary" />
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-4">
                <div>
                  <dt className="text-[10px] font-medium text-neutral-muted">Status</dt>
                  <dd className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${cardStatus.toLowerCase() === 'active' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                    {cardStatus}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-medium text-neutral-muted">Card type</dt>
                  <dd className="mt-1 truncate text-xs font-semibold capitalize text-neutral-text">
                    {selectedWallet?.cardType || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-medium text-neutral-muted">Card number</dt>
                  <dd className="mt-1 truncate font-mono text-[11px] font-semibold text-neutral-text">{maskedCardNumber}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-medium text-neutral-muted">Currency · expiry</dt>
                  <dd className="mt-1 truncate text-xs font-semibold text-neutral-text">
                    {user?.currency || 'INR'} · {selectedWallet?.expiryDate || '—'}
                  </dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => navigate('/wallet')}
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary-light"
              >
                Manage wallet <ArrowUpRight size={14} />
              </button>
            </div>
          </section>

          <section aria-label="Quick actions" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'Add transaction', icon: Plus, action: () => navigate('/transactions', { state: { openAddTransaction: true } }) },
              { label: 'Wallet', icon: Wallet, action: () => navigate('/wallet') },
              { label: 'Savings goal', icon: Target, action: () => setIsAddGoalModalOpen(true) },
              { label: 'Edit budget', icon: Settings2, action: () => setIsBudgetModalOpen(true) },
            ].map(({ label, icon: Icon, action }) => (
              <button
                key={label}
                type="button"
                onClick={action}
                className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-border bg-surface px-3 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card sm:px-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-glow text-primary">
                  <Icon size={17} />
                </span>
                <span className="text-[11px] font-semibold leading-tight text-neutral-text sm:text-xs">{label}</span>
              </button>
            ))}
          </section>

          <section aria-label="Monthly financial summary" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Monthly income', value: monthlyIncomeTotal, icon: ArrowDownLeft, tone: 'text-success bg-success/10' },
              { label: 'Expenses', value: Number(summary?.monthlySpent) || monthlyExpenseTotal, icon: ArrowUpRight, tone: 'text-danger bg-danger/10' },
              { label: 'Budget limit', value: Number(summary?.monthlyBudgetLimit) || 0, icon: ReceiptText, tone: 'text-primary bg-primary/10' },
              { label: 'Budget left', value: (Number(summary?.monthlyBudgetLimit) || 0) - (Number(summary?.monthlySpent) || monthlyExpenseTotal), icon: Wallet, tone: 'text-primary bg-primary/10' },
            ].map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="min-w-0 rounded-2xl border border-border bg-surface p-3.5 shadow-sm sm:p-4">
                <span className={`mb-3 flex h-8 w-8 items-center justify-center rounded-xl ${tone}`}><Icon size={16} /></span>
                <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-neutral-muted">{label}</p>
                <p className="mt-1 truncate text-sm font-bold tabular-nums text-neutral-text sm:text-base">{formatCurrency(value)}</p>
              </div>
            ))}
          </section>

          {configuredCreditCards.length > 0 && (
            <section aria-label="Credit liabilities and repayments" className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-muted">Credit Liabilities & Payments</h2>
                  <p className="mt-0.5 text-xs text-neutral-muted">
                    Credit limits represent debt liabilities, not bank cash. Repayments settle balances without duplicating expenses.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {overdueCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-1 text-[11px] font-bold text-danger">
                      <AlertTriangle size={12} /> {overdueCount} Overdue Bill{overdueCount > 1 ? 's' : ''}
                    </span>
                  )}
                  {upcomingCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                      <Clock size={12} /> {upcomingCount} Due Soon
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="min-w-0 rounded-2xl border border-border bg-background/70 p-3.5">
                  <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-danger/10 text-danger">
                    <CreditCard size={16} />
                  </span>
                  <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-neutral-muted">Total Debt Liability</p>
                  <p className="mt-1 truncate text-sm font-bold tabular-nums text-danger">{formatCurrency(outstandingCreditTotal)}</p>
                </div>

                <div className="min-w-0 rounded-2xl border border-border bg-background/70 p-3.5">
                  <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CreditCard size={16} />
                  </span>
                  <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-neutral-muted">Available Credit</p>
                  <p className="mt-1 truncate text-sm font-bold tabular-nums text-primary">{formatCurrency(availableCreditTotal)}</p>
                </div>

                <div className="min-w-0 rounded-2xl border border-border bg-background/70 p-3.5">
                  <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Percent size={16} />
                  </span>
                  <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-neutral-muted">Credit Utilization</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <p className={`text-sm font-bold tabular-nums ${overallUtilization > 70 ? 'text-danger' : overallUtilization > 30 ? 'text-amber-500' : 'text-neutral-text'}`}>
                      {overallUtilization}%
                    </p>
                    <span className="text-[10px] text-neutral-muted">of {formatCurrency(totalCreditLimit)}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        overallUtilization > 70 ? 'bg-danger' : overallUtilization > 30 ? 'bg-amber-500' : 'bg-primary'
                      }`}
                      style={{ width: `${overallUtilization}%` }}
                    />
                  </div>
                </div>

                <div className="min-w-0 rounded-2xl border border-border bg-background/70 p-3.5">
                  <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-success/10 text-success">
                    <ArrowUpRight size={16} />
                  </span>
                  <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-neutral-muted">Paid This Month</p>
                  <p className="mt-1 truncate text-sm font-bold tabular-nums text-success">{formatCurrency(paymentsThisMonth)}</p>
                </div>
              </div>

              {/* Individual Card Due Dates and Quick Pay Action */}
              <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-background/50">
                {creditCardBills.map((item) => {
                  const cardLimit = Number(item.creditLimit || 0);
                  const cardBalance = Number(item.outstandingBalance || 0);
                  const cardAvail = Math.max(0, cardLimit - cardBalance);
                  const cardUtil = cardLimit > 0 ? Math.min(100, Math.round((cardBalance / cardLimit) * 100)) : 0;
                  const isOverdue = item.due?.status === 'overdue';
                  const isDueToday = item.due?.status === 'due_today';

                  return (
                    <div key={item.id} className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-text text-xs sm:text-sm">
                            {item.cardName || item.bankName || 'Credit Card'}
                          </span>
                          {item.cardNumber && (
                            <span className="font-mono text-[11px] text-neutral-muted">
                              •••• {String(item.cardNumber).slice(-4)}
                            </span>
                          )}
                          {item.hasBalance ? (
                            isOverdue ? (
                              <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold text-danger">
                                Overdue by {Math.abs(item.due?.diffDays)}d
                              </span>
                            ) : isDueToday ? (
                              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                                Due Today
                              </span>
                            ) : (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                Due in {item.due?.diffDays}d ({item.due?.dateStr})
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                              <CheckCircle size={10} /> Fully Paid
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-neutral-muted">
                          <span>Balance: <strong className="text-neutral-text font-semibold">{formatCurrency(cardBalance)}</strong></span>
                          <span>Available: <strong className="text-primary font-semibold">{formatCurrency(cardAvail)}</strong></span>
                          <span>Limit: <strong>{formatCurrency(cardLimit)}</strong></span>
                          <span>Util: <strong className={cardUtil > 70 ? 'text-danger' : cardUtil > 30 ? 'text-amber-500' : 'text-neutral-text'}>{cardUtil}%</strong></span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {item.hasBalance ? (
                          <button
                            type="button"
                            onClick={() => handleOpenPayModal(item)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-light active:scale-95"
                          >
                            <CreditCard size={13} /> Pay Bill
                          </button>
                        ) : (
                          <span className="text-[11px] font-medium text-neutral-muted italic">No payment due</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {creditActivityError && <p role="alert" className="mt-2 text-xs text-danger">{creditActivityError}</p>}
            </section>
          )}

          <div className="grid min-w-0 grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1.5fr)_minmax(240px,0.8fr)]">
            <div className="h-[300px] min-w-0 sm:h-[320px]">
              <ExpenseStatsChart data={chartData} allTransactions={allTransactions} />
            </div>
            <div className="min-w-0 rounded-card border border-border bg-surface p-4 shadow-card sm:p-5">
              <MonthlyExpenseGrid
                categories={expenseCategories}
                filterType={gridFilterType}
                customRange={gridCustomRange}
                onFilterChange={handleGridFilterChange}
              />
            </div>
          </div>

          <section className="rounded-card border border-border bg-surface p-4 shadow-card sm:p-5">
            <SavingsGoalsGrid
              goals={goals}
              onAddClick={() => setIsAddGoalModalOpen(true)}
              onStatusChange={handleGoalStatusChange}
              onEditClick={handleEditGoalClick}
              onDeleteClick={handleDeleteGoal}
            />
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <section className="rounded-card border border-border bg-surface p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-muted">This month</p>
                <h2 className="mt-1 text-sm font-bold text-neutral-text">Expense summary</h2>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-glow text-primary"><ReceiptText size={17} /></span>
            </div>
            <p className="text-2xl font-extrabold tracking-tight text-neutral-text tabular-nums">{formatCurrency(monthlyExpenseTotal)}</p>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
              <span className="text-neutral-muted">Expense transactions</span>
              <span className="font-bold tabular-nums text-neutral-text">
                {allTransactions.filter((transaction) => transaction.type === 'expense').length}
              </span>
            </div>
          </section>

          <section className="rounded-card border border-border bg-surface p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-muted">Savings</p>
                <h2 className="mt-1 text-sm font-bold text-neutral-text">Completed goals</h2>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10 text-success"><Target size={17} /></span>
            </div>
            <p className="text-2xl font-extrabold tracking-tight text-neutral-text tabular-nums">{formatCurrency(completedSavingsTotal)}</p>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-neutral-muted">Goal target</span>
              <span className="font-semibold tabular-nums text-neutral-text">{formatCurrency(savingsGoalTotal)}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary/10" role="progressbar" aria-label="Completed savings goals" aria-valuenow={Math.round(savingsProgress)} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-success transition-all duration-700" style={{ width: `${savingsProgress}%` }} />
            </div>
            <button type="button" onClick={() => setIsAddGoalModalOpen(true)} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-light">
              Add savings goal <Plus size={14} />
            </button>
          </section>

          <div className="relative">
            <div className="absolute right-4 top-4 z-10">
              <button
                type="button"
                onClick={() => setIsBudgetModalOpen(true)}
                className="rounded-full bg-background p-2 text-neutral-muted transition-colors hover:text-primary"
                aria-label="Edit monthly budget"
              >
                <Settings2 size={15} />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-muted">Budget</p>
              <p className="mt-1 text-sm font-bold text-neutral-text">Monthly progress</p>
            </div>
            <BudgetProgress
              limit={summary?.monthlyBudgetLimit || 0}
              spent={summary?.monthlySpent || monthlyExpenseTotal}
              remaining={(Number(summary?.monthlyBudgetLimit) || 0) - (Number(summary?.monthlySpent) || monthlyExpenseTotal)}
            />
          </div>
        </aside>
      </div>

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
