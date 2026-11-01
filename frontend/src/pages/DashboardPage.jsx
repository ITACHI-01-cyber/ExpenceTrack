import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';

// ── Existing reusable components ──
import CardCarousel from '../components/dashboard/CardCarousel';
import FinancialStatsChart from '../components/dashboard/FinancialStatsChart';
import EditBudgetModal from '../components/ui/EditBudgetModal';
import AddGoalModal from '../components/ui/AddGoalModal';
import EditGoalModal from '../components/ui/EditGoalModal';
import AddBalanceModal from '../components/ui/AddBalanceModal';
import PayCreditCardModal from '../components/ui/PayCreditCardModal';

// ── New dashboard components ──
import SummaryCards from '../components/dashboard/SummaryCards';
import BudgetDonut from '../components/dashboard/BudgetDonut';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import SavingsGoals from '../components/dashboard/SavingsGoals';

// ── Services & utilities ──
import useCurrency from '../utils/useCurrency';
import api from '../services/api';
import walletService from '../services/walletService';
import dashboardService from '../services/dashboardService';
import useAuthStore from '../store/authStore';
import guestStorage from '../services/guestStorage';
import { ArrowRight, CreditCard, Eye, EyeOff, RefreshCw, Wallet } from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { isGuest, user } = useAuthStore();
  const fmt = useCurrency();

  // ── Data state ──
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [chartTransactions, setChartTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [goals, setGoals] = useState([]);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [creditActivity, setCreditActivity] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Modal state ──
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
  const [selectedGoalToEdit, setSelectedGoalToEdit] = useState(null);
  const [topUpWallet, setTopUpWallet] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedCardForPayment, setSelectedCardForPayment] = useState(null);

  // ── Fetch all dashboard data ──
  const fetchData = useCallback(async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    try {
      const data = await dashboardService.fetchAll({ isGuest, month, year });
      const monthTransactions = Array.isArray(data.transactions) ? data.transactions : [];
      setSummary(data.summary);
      setAllTransactions(monthTransactions);
      setTransactions(monthTransactions.slice(0, 5));
      setChartTransactions(Array.isArray(data.chartTransactions) ? data.chartTransactions : monthTransactions);
      setGoals(Array.isArray(data.goals) ? data.goals : []);
      setBudget(data.budget);
      setWallets(Array.isArray(data.wallets) ? data.wallets : []);
      setFetchError(data.errors?.[0] ? (data.errors[0].response?.data?.message || data.errors[0].message || 'Unable to load dashboard data.') : '');
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
      setFetchError(err.response?.data?.message || err.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [isGuest]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Credit card activity ──
  useEffect(() => {
    const cards = wallets.filter(
      (w) => w.cardType?.toLowerCase() === 'credit' && w.creditTermsConfigured
    );
    if (cards.length === 0) {
      setCreditActivity([]);
      return;
    }
    let cancelled = false;
    Promise.all(
      cards.map(async (card) => {
        const items = isGuest
          ? guestStorage.transactions.getCreditActivity(card.id)
          : await walletService.getCreditActivity(card.id);
        return items || [];
      })
    ).then((lists) => {
      if (!cancelled) setCreditActivity(lists.flat());
    }).catch((err) => {
      console.error('Credit activity load error', err);
    });
    return () => { cancelled = true; };
  }, [wallets, isGuest]);

  // ── Financial derivations ──
  const monthlyExpenseTotal = useMemo(
    () => allTransactions.reduce((t, tx) => t + (tx.type === 'expense' ? Number(tx.amount) || 0 : 0), 0),
    [allTransactions]
  );

  const monthlyIncomeTotal = useMemo(() => {
    const summaryIncome = summary?.monthlyIncome;
    if (summaryIncome !== null && summaryIncome !== undefined && Number.isFinite(Number(summaryIncome))) {
      return Number(summaryIncome);
    }
    return allTransactions.reduce((t, tx) => t + (tx.type === 'income' ? Number(tx.amount) || 0 : 0), 0);
  }, [summary, allTransactions]);

  const walletBalanceTotal = useMemo(
    () => wallets.reduce((total, wallet) => total + (wallet.cardType?.toLowerCase() === 'credit' ? 0 : Number(wallet.balance) || 0), 0),
    [wallets]
  );

  const totalBalance = (() => {
    const summaryBalance = summary?.availableBalance;
    return summaryBalance !== null && summaryBalance !== undefined && Number.isFinite(Number(summaryBalance))
      ? Number(summaryBalance)
      : walletBalanceTotal;
  })();
  const configuredBudget = budget?.budgetLimit;
  const hasConfiguredBudget = configuredBudget !== null
    && configuredBudget !== undefined
    && Number.isFinite(Number(configuredBudget));
  const budgetLimit = hasConfiguredBudget ? Number(configuredBudget) : null;
  const budgetLeft = hasConfiguredBudget ? budgetLimit - monthlyExpenseTotal : null;

  // ── Handlers ──
  const handleAddBalance = async (amount) => {
    try {
      if (isGuest) {
        guestStorage.wallets.addMoney(topUpWallet.id, amount);
      } else {
        await walletService.addMoney(topUpWallet.id, amount);
      }
      await fetchData();
    } catch (err) {
      console.error('Failed to top up wallet', err);
      setFetchError(err.response?.data?.message || err.message || 'Unable to update wallet balance.');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  };

  const handlePayCreditCard = async (cardId, request) => {
    const res = isGuest
      ? guestStorage.transactions.repay(cardId, request)
      : await walletService.repay(cardId, request);
    await fetchData();
    return res;
  };

  const handleOpenCreditPayment = (card) => {
    setSelectedCardForPayment(card);
    setIsPayModalOpen(true);
  };

  const handleGoalStatusChange = async (goal, completed) => {
    if (goal.completed === completed) return;
    const optimistic = { ...goal, completed };
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? optimistic : g)));
    try {
      if (isGuest) {
        const result = guestStorage.goals.updateStatus(goal.id, completed);
        if (result) setGoals((prev) => prev.map((g) => (g.id === goal.id ? result : g)));
      } else {
        const res = await api.patch(`/goals/${goal.id}/status`, null, { params: { completed } });
        if (res.data?.success) setGoals((prev) => prev.map((g) => (g.id === goal.id ? res.data.data : g)));
      }
    } catch (err) {
      console.error('Goal status update failed', err);
      fetchData();
    }
  };

  const handleEditGoal = (goal) => {
    setSelectedGoalToEdit(goal);
    setIsEditGoalModalOpen(true);
  };

  // ── Card info derived values ──
  const cardNumber = String(selectedWallet?.cardNumber || '');
  const maskedCardNumber = cardNumber
    ? selectedWallet?.cardType?.toLowerCase() === 'upi'
      ? cardNumber
      : `•••• •••• •••• ${cardNumber.slice(-4)}`
    : 'Not available';
  const cardStatus = selectedWallet
    ? selectedWallet.status || (Number(selectedWallet.balance) > 0 || selectedWallet.creditTermsConfigured ? 'Active' : 'Empty')
    : 'No card selected';
  // ── Loading state ──
  if (loading) {
    return (
      <Layout>
        <div className="flex h-96 items-center justify-center text-[#929684]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#292D20] border-t-[#C5F542]" />
            <p className="text-sm font-medium">Loading wallet overview...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard-page mx-auto flex w-full max-w-[1560px] flex-col gap-5 text-[#F4F5ED]">
        <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C5F542]">
              Wallet overview
            </p>
            <h1 className="mt-2 max-w-2xl text-3xl font-extrabold leading-tight tracking-[-0.04em] text-[#F4F5ED] sm:text-4xl">
              A clearer view of your money,
              <br className="hidden sm:block" /> every day.
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-[#292D20] bg-[#15180F] p-1">
              {['week', 'month', 'year'].map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setSelectedPeriod(period)}
                  aria-pressed={selectedPeriod === period}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold capitalize transition ${
                    selectedPeriod === period
                      ? 'bg-[#C5F542] text-[#0B0D09]'
                      : 'text-[#929684] hover:text-[#F4F5ED]'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => navigate('/wallet')}
              className="inline-flex items-center gap-2 rounded-full border border-[#C5F542]/30 bg-[#C5F542] px-4 py-2.5 text-xs font-bold text-[#0B0D09] transition hover:bg-[#D5FF59]"
            >
              <CreditCard size={14} /> Add card
            </button>
          </div>
        </header>

        {fetchError && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#70483F] bg-[#211814] px-4 py-3 text-sm text-[#FFB3A9]">
            <span>{fetchError}</span>
            <button type="button" onClick={handleRefresh} className="font-semibold underline underline-offset-2">
              Retry
            </button>
          </div>
        )}

        <section aria-label="Wallet overview" className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          <div className="rounded-2xl border border-[#292D20] bg-[#15180F] p-5 sm:p-6 xl:col-span-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#929684]">My wallet · safe balance</p>
                <div className="mt-2 flex items-center gap-3">
                  <p className="font-mono text-3xl font-bold tracking-tight text-[#F4F5ED] sm:text-4xl" data-financial="true">
                    {balanceVisible ? fmt(totalBalance) : '••••••••'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setBalanceVisible((visible) => !visible)}
                    aria-label={balanceVisible ? 'Hide safe balance' : 'Show safe balance'}
                    className="rounded-full border border-[#292D20] p-2 text-[#929684] transition hover:border-[#C5F542]/50 hover:text-[#C5F542]"
                  >
                    {balanceVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-[#929684]">
                  {wallets.length ? `${wallets.length} ${wallets.length === 1 ? 'payment account' : 'payment accounts'}` : 'No payment accounts connected yet.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => selectedWallet && setTopUpWallet(selectedWallet)}
                  disabled={!selectedWallet}
                  className="inline-flex items-center gap-2 rounded-full bg-[#C5F542] px-4 py-2.5 text-xs font-bold text-[#0B0D09] transition hover:bg-[#D5FF59] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Wallet size={14} /> Add balance
                </button>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  aria-label="Refresh wallet data"
                  className="rounded-full border border-[#292D20] p-2.5 text-[#929684] transition hover:border-[#C5F542]/50 hover:text-[#C5F542] disabled:opacity-50"
                >
                  <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
            <div className="mt-5 border-t border-[#292D20] pt-5">
              <CardCarousel
                wallets={wallets}
                onAddCard={() => navigate('/wallet')}
                onAddMoney={setTopUpWallet}
                onPayCreditCard={handleOpenCreditPayment}
                onSelectionChange={setSelectedWallet}
              />
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border border-[#292D20] bg-[#15180F] p-5 sm:p-6 xl:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#929684]">Card information</p>
                <h2 className="mt-3 truncate text-2xl font-bold tracking-tight text-[#F4F5ED]">
                  {selectedWallet?.bankName || selectedWallet?.cardName || selectedWallet?.cardType || 'Select a wallet'}
                </h2>
              </div>
              {selectedWallet && (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#C5F542]/20 bg-[#C5F542]/10 px-2.5 py-1 text-[10px] font-semibold capitalize text-[#C5F542]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C5F542]" />
                  {cardStatus}
                </span>
              )}
            </div>
            <dl className="mt-5 divide-y divide-[#292D20] border-y border-[#292D20]">
              <div className="flex items-center justify-between gap-3 py-3 text-xs">
                <dt className="text-[#929684]">Card type</dt>
                <dd className="font-semibold capitalize text-[#F4F5ED]">{selectedWallet?.cardType || '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-3 text-xs">
                <dt className="text-[#929684]">{selectedWallet?.cardType?.toLowerCase() === 'upi' ? 'UPI ID' : 'Card number'}</dt>
                <dd className="max-w-[65%] truncate font-mono font-semibold text-[#F4F5ED]">{selectedWallet ? maskedCardNumber : '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-3 text-xs">
                <dt className="text-[#929684]">Currency · expiry</dt>
                <dd className="font-mono font-semibold text-[#F4F5ED]">
                  {user?.currency || '—'}{selectedWallet?.expiryDate ? ` · ${selectedWallet.expiryDate}` : ''}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => navigate('/wallet')}
              className="mt-auto flex items-center justify-between rounded-xl border border-[#292D20] px-4 py-3 text-xs font-semibold text-[#F4F5ED] transition hover:border-[#C5F542]/50 hover:text-[#C5F542]"
            >
              Manage wallet <ArrowRight size={14} />
            </button>
          </div>
        </section>

        <SummaryCards
          monthlyIncome={monthlyIncomeTotal}
          monthlyExpenses={monthlyExpenseTotal}
          budgetLimit={budgetLimit}
          budgetLeft={budgetLeft}
          hasBudget={hasConfiguredBudget}
          onEditBudget={() => setIsBudgetModalOpen(true)}
        />

        <section aria-label="Financial statistics and savings goals" className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-5">
          <div className="min-h-[350px] xl:col-span-3">
            <FinancialStatsChart
              allTransactions={chartTransactions}
              selectedPeriod={selectedPeriod}
            />
          </div>
          <div className="min-h-[350px] xl:col-span-2">
            <SavingsGoals
              goals={goals}
              loading={false}
              onAddGoal={() => setIsAddGoalModalOpen(true)}
              onEditGoal={handleEditGoal}
              onToggleGoal={handleGoalStatusChange}
            />
          </div>
        </section>

        <section aria-label="Budget and recent transactions" className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <BudgetDonut
              budget={budget}
              transactions={allTransactions}
              monthlySpent={monthlyExpenseTotal}
              monthlyBudgetLimit={budgetLimit}
            />
          </div>
          <div className="min-h-[350px] xl:col-span-3">
            <RecentTransactions transactions={transactions} wallets={wallets} loading={false} />
          </div>
        </section>
      </div>

      {/* ── Modals ── */}
      <EditBudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        currentBudgetLimit={budget?.budgetLimit ?? summary?.monthlyBudgetLimit}
        currentIncome={budget?.monthlyIncome ?? summary?.monthlyIncome}
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
        onPay={handlePayCreditCard}
        isGuest={isGuest}
      />
    </Layout>
  );
};

export default DashboardPage;
