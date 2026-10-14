import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import Button from '../components/ui/Button';
import WalletCard from '../components/dashboard/WalletCard';
import AddCardModal from '../components/ui/AddCardModal';
import AddBalanceModal from '../components/ui/AddBalanceModal';
import PayCreditCardModal from '../components/ui/PayCreditCardModal';
import { Plus, CreditCard, Building2, User, Calendar, Banknote, ChevronRight, Sparkles, RotateCcw } from 'lucide-react';
import walletService from '../services/walletService';
import { formatCurrency } from '../utils/formatCurrency';
import { getCardBackground } from '../utils/cardDesigns';
import { calculateNextDueDate } from '../utils/dateHelpers';
import useAuthStore from '../store/authStore';
import guestStorage from '../services/guestStorage';

const MiniCardPreview = ({ wallet, isSelected, onClick, index = 0 }) => {
  const bg = getCardBackground(wallet);
  const isUpi = (wallet.cardType || '').toLowerCase() === 'upi';
  const isCash = (wallet.cardType || '').toLowerCase() === 'cash';
  const safeNumber = String(wallet.cardNumber || '');
  const lastFour = safeNumber.slice(-4);

  return (
    <button
      type="button"
      onClick={onClick}
      className="card-enter relative shrink-0 w-[200px] h-[120px] rounded-2xl overflow-hidden cursor-pointer group"
      style={{
        ...bg,
        animationDelay: `${index * 60}ms`,
        transition: 'transform 0.3s cubic-bezier(0.23,1,0.32,1), box-shadow 0.3s ease, outline 0.15s ease',
        transform: isSelected ? 'scale(1.05) translateY(-2px)' : 'scale(1)',
        boxShadow: isSelected
          ? '0 12px 32px rgba(0,0,0,0.28), 0 0 0 2.5px rgba(255,255,255,0.85)'
          : '0 4px 12px rgba(0,0,0,0.12)',
        outline: isSelected ? '2px solid var(--primary-main)' : '2px solid transparent',
        outlineOffset: '2px',
      }}
    >
      {/* Decorative orbs */}
      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full border-[10px] border-white/10 pointer-events-none" />
      <div className="absolute -bottom-4 -left-4 h-12 w-12 rounded-full bg-white/8 pointer-events-none" />

      {/* Shimmer on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300"
        style={{
          background: 'linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 70%)',
        }}
      />

      <div className="relative z-10 p-3.5 flex flex-col justify-between h-full text-white">
        <div className="flex items-start justify-between">
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] opacity-80">
            {wallet.cardName || wallet.bankName || wallet.cardType || 'Card'}
          </span>
          <span className="text-[10px] font-black italic tracking-tight opacity-90">
            {isUpi ? 'UPI' : (wallet.cardBrand || 'VISA').toUpperCase()}
          </span>
        </div>
        <div className="text-left">
          <p className="font-mono text-[10.5px] tracking-[0.1em] opacity-75 mb-0.5">
            {isCash ? '💵 Cash' : isUpi ? safeNumber : `•••• ${lastFour || '••••'}`}
          </p>
          <p className="text-sm font-bold tabular-nums">
            {wallet.cardType?.toLowerCase() === 'credit'
              ? wallet.creditTermsConfigured ? formatCurrency(wallet.outstandingBalance) : 'Terms not configured'
              : formatCurrency(wallet.balance || 0)}
          </p>
        </div>
      </div>

      {/* Selected shimmer gradient */}
      {isSelected && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-white/15 to-transparent pointer-events-none" />
      )}
    </button>
  );
};

const SettingRow = ({ icon: Icon, title, subtitle, action }) => (
  <div className="flex items-center justify-between py-3.5 group border-b border-border last:border-0">
    <div className="flex items-center gap-3.5">
      <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-200">
        <Icon size={17} />
      </div>
      <div className="text-left">
        <p className="text-sm font-semibold text-neutral-text">{title}</p>
        <p className="text-[11px] text-neutral-muted mt-0.5">{subtitle}</p>
      </div>
    </div>
    {action || (
      <ChevronRight size={16} className="text-neutral-muted/40 group-hover:text-primary transition-colors" />
    )}
  </div>
);

const dateInTimeZone = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
};

const daysBetween = (from, to) => Math.round(
  (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000
);

const creditCycleStart = (closingDay, todayKey) => {
  const [year, month] = todayKey.split('-').map(Number);
  const closeForMonth = (yearValue, monthValue) => {
    const lastDay = new Date(Date.UTC(yearValue, monthValue, 0)).getUTCDate();
    return `${yearValue}-${String(monthValue).padStart(2, '0')}-${String(Math.min(closingDay, lastDay)).padStart(2, '0')}`;
  };
  let closeDate = closeForMonth(year, month);
  if (todayKey <= closeDate) {
    const previousMonth = new Date(Date.UTC(year, month - 2, 1));
    closeDate = closeForMonth(previousMonth.getUTCFullYear(), previousMonth.getUTCMonth() + 1);
  }
  const nextDay = new Date(Date.parse(`${closeDate}T00:00:00Z`) + 86400000);
  return nextDay.toISOString().slice(0, 10);
};

const WalletPage = () => {
  const { isGuest } = useAuthStore();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletError, setWalletError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [topUpWallet, setTopUpWallet] = useState(null);
  const [deletingWalletId, setDeletingWalletId] = useState(null);
  const [selectedWalletId, setSelectedWalletId] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payStatementId, setPayStatementId] = useState('');
  const [creditActivity, setCreditActivity] = useState([]);
  const [creditStatements, setCreditStatements] = useState([]);
  const [purchaseForm, setPurchaseForm] = useState({ amount: '', category: '', description: '' });
  const [repaymentForm, setRepaymentForm] = useState({ amount: '', sourceWalletId: '', statementId: '' });
  const [repaymentIdempotencyKey, setRepaymentIdempotencyKey] = useState('');
  const [refundAmounts, setRefundAmounts] = useState({});
  const [refundIdempotencyKeys, setRefundIdempotencyKeys] = useState({});
  const [creditError, setCreditError] = useState('');
  const [creditMessage, setCreditMessage] = useState('');
  const [creditBusy, setCreditBusy] = useState(false);

  const fetchWallets = async () => {
    setLoading(true);
    setWalletError('');
    try {
      if (isGuest) {
        setWallets(guestStorage.wallets.getAll());
      } else {
        const data = await walletService.getAll();
        setWallets(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch wallets', err);
      setWalletError(err.message || 'Failed to load cards. Check your connection and retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
    return undefined;
  }, []);

  useEffect(() => {
    if (!selectedWalletId && wallets.length > 0) setSelectedWalletId(wallets[0].id);
  }, [wallets, selectedWalletId]);

  const selected = wallets.find((w) => w.id === selectedWalletId) || wallets[0] || null;
  const isCredit = selected && (selected.cardType || '').toLowerCase() === 'credit';
  const todayInCardZone = isCredit
    ? dateInTimeZone(new Date(), selected.timezone || 'UTC')
    : null;
  const currentCycleStart = isCredit && selected.creditTermsConfigured
    ? creditCycleStart(Number(selected.statementClosingDay), todayInCardZone)
    : null;
  const currentCyclePurchases = currentCycleStart
    ? creditActivity
      .filter((item) => ['purchase', 'refund'].includes(item.transactionKind) && String(item.date || '').slice(0, 10) >= currentCycleStart)
      .reduce((total, item) => total + (item.transactionKind === 'refund' ? -1 : 1) * (Number(item.amount) || 0), 0)
    : 0;

  const refreshCreditData = async (wallet = selected) => {
    setCreditError('');
    if (!wallet || wallet.cardType?.toLowerCase() !== 'credit') {
      setCreditActivity([]);
      setCreditStatements([]);
      return;
    }
    try {
      if (isGuest) {
        setCreditActivity(guestStorage.transactions.getCreditActivity(wallet.id));
        setCreditStatements(guestStorage.transactions.getStatements(wallet.id));
      } else {
        const [activity, statements] = await Promise.all([
          walletService.getCreditActivity(wallet.id),
          walletService.getStatements(wallet.id),
        ]);
        setCreditActivity(activity || []);
        setCreditStatements(statements || []);
      }
    } catch (err) {
      setCreditError(err.message || 'Unable to load credit card activity.');
    }
  };

  useEffect(() => {
    if (selected) refreshCreditData(selected);
  }, [selected?.id, isGuest]);

  const handleSaveCard = async (cardData) => {
    try {
      if (isGuest) {
        guestStorage.wallets.save(cardData, editingWallet?.id);
      } else {
        await walletService.save(cardData, editingWallet?.id);
      }
      await fetchWallets();
      setEditingWallet(null);
    } catch (err) {
      console.error('Failed to save card:', err);
      throw err;
    }
  };

  const openAddCardModal = () => {
    setEditingWallet(null);
    setIsModalOpen(true);
  };

  const openEditCardModal = (wallet) => {
    setEditingWallet(wallet);
    setIsModalOpen(true);
  };

  const closeCardModal = () => {
    setIsModalOpen(false);
    setEditingWallet(null);
  };

  const openTopUpModal = (wallet) => {
    setTopUpWallet(wallet);
  };

  const closeTopUpModal = () => {
    setTopUpWallet(null);
  };

  const handleAddMoney = async (amount) => {
    try {
      if (isGuest) {
        guestStorage.wallets.addMoney(topUpWallet.id, amount);
      } else {
        await walletService.addMoney(topUpWallet.id, amount);
      }
      await fetchWallets();
    } catch (err) {
      console.error('Failed to add money:', err);
    }
  };

  const handleDeleteWallet = async (wallet) => {
    const label = wallet.bankName || wallet.cardType || 'this card';
    const confirmed = window.confirm(`Remove ${label} from your wallet?`);
    if (!confirmed) return;

    try {
      setDeletingWalletId(wallet.id);
      if (isGuest) {
        guestStorage.wallets.remove(wallet.id);
      } else {
        await walletService.remove(wallet.id);
      }
      if (selectedWalletId === wallet.id) setSelectedWalletId(null);
      await fetchWallets();
    } catch (err) {
      console.error('Failed to remove card:', err);
      window.alert(err.message || 'Failed to remove card.');
    } finally {
      setDeletingWalletId(null);
    }
  };

  const runCreditAction = async (action, successMessage) => {
    setCreditBusy(true);
    setCreditError('');
    setCreditMessage('');
    try {
      await action();
      setCreditMessage(successMessage);
      await fetchWallets();
      await refreshCreditData({ ...selected });
    } catch (err) {
      setCreditError(err.response?.data?.message || err.message || 'Credit card action failed.');
    } finally {
      setCreditBusy(false);
    }
  };

  const handlePurchase = (event) => {
    event.preventDefault();
    if (!selected) return;
    runCreditAction(async () => {
      const purchase = {
        walletId: selected.id,
        type: 'expense',
        amount: Number(purchaseForm.amount),
        category: purchaseForm.category || 'Shopping',
        description: purchaseForm.description || 'Credit card purchase',
      };
      if (isGuest) guestStorage.transactions.recordPurchase(purchase);
      else await walletService.recordPurchase(purchase);
      setPurchaseForm({ amount: '', category: '', description: '' });
    }, 'Purchase recorded as an expense.');
  };

  const handleRepayment = (event) => {
    event.preventDefault();
    if (!selected) return;
    const idempotencyKey = repaymentIdempotencyKey ||
      globalThis.crypto?.randomUUID?.() ||
      `repay-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setRepaymentIdempotencyKey(idempotencyKey);
    runCreditAction(async () => {
      const request = {
        sourceWalletId: repaymentForm.sourceWalletId,
        amount: Number(repaymentForm.amount),
        statementId: repaymentForm.statementId || null,
        idempotencyKey,
      };
      if (isGuest) guestStorage.transactions.repay(selected.id, request);
      else await walletService.repay(selected.id, request);
      setRepaymentForm({ amount: '', sourceWalletId: '', statementId: '' });
      setRepaymentIdempotencyKey('');
    }, 'Internal repayment recorded. No issuer or bank payment was sent.');
  };

  const handlePayCreditCardModalSubmit = async (cardId, request) => {
    if (isGuest) {
      const res = guestStorage.transactions.repay(cardId, request);
      await fetchWallets();
      await refreshCreditData();
      return res;
    } else {
      const res = await walletService.repay(cardId, request);
      await fetchWallets();
      await refreshCreditData();
      return res;
    }
  };

  const handleReverseRepayment = async (repaymentId) => {
    const confirmed = window.confirm(
      'Are you sure you want to reverse this repayment? This will restore the credit card liability and refund the amount back to the funding account.'
    );
    if (!confirmed) return;

    runCreditAction(async () => {
      if (isGuest) {
        guestStorage.transactions.reverseRepayment(selected.id, repaymentId);
      } else {
        await walletService.reverseRepayment(selected.id, repaymentId);
      }
    }, 'Repayment successfully reversed. Balances restored.');
  };

  const updateRepaymentForm = (field, value) => {
    setRepaymentForm((current) => ({ ...current, [field]: value }));
    setRepaymentIdempotencyKey('');
  };

  const handleRefund = (event, purchase) => {
    event.preventDefault();
    if (!selected) return;
    const amount = Number(refundAmounts[purchase.id]);
    const idempotencyKey = refundIdempotencyKeys[purchase.id] ||
      globalThis.crypto?.randomUUID?.() ||
      `refund-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setRefundIdempotencyKeys((current) => ({ ...current, [purchase.id]: idempotencyKey }));
    runCreditAction(async () => {
      const request = { amount, idempotencyKey };
      if (isGuest) guestStorage.transactions.recordRefund(purchase.id, request);
      else await walletService.recordRefund(purchase.id, request);
      setRefundAmounts((current) => ({ ...current, [purchase.id]: '' }));
      setRefundIdempotencyKeys((current) => ({ ...current, [purchase.id]: '' }));
    }, 'Refund recorded and linked to the original purchase.');
  };

  const handleGenerateStatement = () => {
    if (!selected) return;
    runCreditAction(async () => {
      if (isGuest) guestStorage.transactions.generateStatement(selected.id);
      else await walletService.generateStatement(selected.id);
    }, 'Statement snapshot generated.');
  };

  const isUpi = selected && (selected.cardType || '').toLowerCase() === 'upi';
  const isCash = selected && (selected.cardType || '').toLowerCase() === 'cash';

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:mb-8">
        <TopBar title="Wallet" />
        <Button onClick={openAddCardModal} className="w-full gap-2 sm:w-auto">
          <Plus size={18} /> Add Card
        </Button>
      </div>

      <p className="-mt-4 mb-6 text-xs text-neutral-muted">
        {isGuest
          ? 'Preview mode — cards are saved locally in your browser.'
          : 'Cards are stored in your account and synchronized to the server.'}
      </p>
      {walletError && <p role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">{walletError}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-neutral-muted">Loading your cards...</p>
          </div>
        </div>
      ) : wallets.length > 0 ? (
        <>
          {/* Main Content: Card + Settings */}
          <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-8 mb-8">

            {/* Left Column — Selected Card Display */}
            <div className="w-full lg:w-[55%] xl:w-[52%] flex flex-col">
              {/* Glow + Card stack */}
              <div className="relative flex flex-col items-center pt-4 pb-2">
                {/* Ambient glow — purely decorative, behind everything */}
                <div
                  className="absolute top-4 left-1/2 -translate-x-1/2 w-[75%] h-[200px] sm:h-[220px] rounded-3xl blur-3xl pointer-events-none"
                  style={{
                    background: selected
                      ? `linear-gradient(135deg, ${selected.primaryColor || '#4F2A8A'}, ${selected.secondaryColor || '#6D4BC3'})`
                      : 'transparent',
                    opacity: 0.18,
                    transition: 'background 0.6s ease',
                    zIndex: 0,
                  }}
                />
                <div className="relative w-full" style={{ zIndex: 1 }}>
                  <WalletCard
                    wallet={selected}
                    interactive={true}
                    onAddMoney={(w) => openTopUpModal(w)}
                    onEdit={(w) => openEditCardModal(w)}
                    onRemove={(w) => handleDeleteWallet(w)}
                    onPayCreditCard={() => setIsPayModalOpen(true)}
                    removing={deletingWalletId === selected?.id}
                  />
                </div>
              </div>
            </div>

            {/* Right Column — Card Details & Settings */}
            <div className="w-full lg:w-[45%] xl:w-[48%]">
              <div className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <Sparkles size={16} className="text-primary" />
                  <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Card Details</h2>
                </div>

                {/* Primary Pay Credit Card Button */}
                {isCredit && selected.creditTermsConfigured && (
                  <div className="mb-5">
                    <Button
                      onClick={() => setIsPayModalOpen(true)}
                      className="w-full gap-2 bg-gradient-to-r from-primary to-primary-light shadow-md hover:shadow-lg transition-all"
                    >
                      <CreditCard size={17} />
                      Pay Credit Card
                    </Button>
                  </div>
                )}

                {selected && (
                  <div className="divide-y divide-border">
                    {selected.cardName && (
                      <SettingRow
                        icon={CreditCard}
                        title={selected.cardName}
                        subtitle="Card name"
                      />
                    )}
                    <SettingRow
                      icon={Building2}
                      title={selected.bankName || 'Unknown Bank'}
                      subtitle="Issuing bank"
                    />
                    <SettingRow
                      icon={CreditCard}
                      title={`${(selected.cardType || 'Card').charAt(0).toUpperCase()}${(selected.cardType || 'Card').slice(1)} ${!isUpi && !isCash ? `· ${(selected.cardBrand || 'Visa').toUpperCase()}` : ''}`}
                      subtitle="Account type & network"
                    />
                    <SettingRow
                      icon={User}
                      title={selected.cardHolderName || 'Cardholder'}
                      subtitle="Card holder name"
                    />
                    {!isUpi && !isCash && (
                      <SettingRow
                        icon={Calendar}
                        title={selected.expiryDate || 'N/A'}
                        subtitle="Valid thru"
                      />
                    )}
                    <SettingRow
                      icon={Banknote}
                      title={isCredit
                        ? (selected.creditTermsConfigured
                          ? Number(selected.outstandingBalance) < 0
                            ? `Card credit ${formatCurrency(Math.abs(Number(selected.outstandingBalance)))}`
                            : formatCurrency(selected.outstandingBalance)
                          : 'Not configured')
                        : formatCurrency(selected.balance || 0)}
                      subtitle={isCredit ? 'Outstanding balance' : 'Current balance'}
                      action={
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${(isCredit ? selected.creditTermsConfigured : (selected.balance || 0) > 0) ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {isCredit ? (selected.creditTermsConfigured ? 'Configured' : 'Unconfigured') : ((selected.balance || 0) > 0 ? 'Active' : 'Empty')}
                        </span>
                      }
                    />
                    {isCredit && selected.creditTermsConfigured && (() => {
                      const limit = Number(selected.creditLimit) || 0;
                      const debt = Number(selected.outstandingBalance) || 0;
                      const avail = Math.max(0, limit - debt);
                      const util = limit > 0 ? (debt / limit) * 100 : 0;
                      const dueInfo = calculateNextDueDate(selected);

                      return (
                        <>
                          <div className="py-3">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="font-semibold text-neutral-muted">Credit Utilization</span>
                              <span className={`font-bold tabular-nums ${util > 80 ? 'text-danger' : util > 50 ? 'text-amber-500' : 'text-primary'}`}>
                                {util.toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  util > 80 ? 'bg-danger' : util > 50 ? 'bg-amber-500' : 'bg-primary'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, util))}%` }}
                              />
                            </div>
                          </div>

                          <SettingRow icon={Banknote} title={formatCurrency(limit)} subtitle="Configured credit limit" />
                          <SettingRow
                            icon={Banknote}
                            title={formatCurrency(avail)}
                            subtitle="Available credit (Limit − Debt)"
                            action={
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
                                Available
                              </span>
                            }
                          />
                          {dueInfo && (
                            <SettingRow
                              icon={Calendar}
                              title={dueInfo.dateStr}
                              subtitle={dueInfo.diffDays >= 0 ? `Due in ${dueInfo.diffDays} day(s)` : `${Math.abs(dueInfo.diffDays)} day(s) overdue`}
                              action={
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                  dueInfo.status === 'overdue' 
                                    ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                                    : dueInfo.status === 'due_today'
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                      : 'bg-primary/10 text-primary'
                                }`}>
                                  {dueInfo.status === 'overdue' ? 'Overdue' : dueInfo.status === 'due_today' ? 'Due Today' : 'Upcoming'}
                                </span>
                              }
                            />
                          )}
                          <SettingRow
                            icon={Calendar}
                            title={`Closing: Day ${selected.statementClosingDay} · Due: Day ${selected.paymentDueDay}`}
                            subtitle="Billing cycle days (following month)"
                          />
                          <SettingRow icon={Calendar} title={selected.timezone || 'N/A'} subtitle="Cycle timezone" />
                          {selected.minimumPaymentAmount != null && (
                            <SettingRow
                              icon={Banknote}
                              title={formatCurrency(selected.minimumPaymentAmount)}
                              subtitle="Issuer minimum payment"
                            />
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

              {isCredit && (
                    <section className="mt-8 grid gap-6 xl:grid-cols-2">
                      <div className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
                        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Credit card activity</h2>
                        {selected.creditTermsConfigured && (
                          <p className="mt-3 text-sm text-neutral-muted">
                            Current-cycle net purchases since {currentCycleStart}: {formatCurrency(currentCyclePurchases)}
                          </p>
                        )}
                        {!selected.creditTermsConfigured ? (
                          <p className="mt-3 text-sm text-neutral-muted">Set a positive limit, outstanding balance, cycle days and timezone by editing this card to enable credit activity.</p>
                        ) : (
                          <>
                            <form onSubmit={handlePurchase} className="mt-4 grid gap-3 sm:grid-cols-2">
                              <input aria-label="Purchase amount" required type="number" min="0.01" step="0.01" value={purchaseForm.amount} onChange={(e) => setPurchaseForm({ ...purchaseForm, amount: e.target.value })} className="rounded-lg border border-border bg-white px-3 py-2 text-sm" placeholder="Purchase amount" />
                              <input aria-label="Purchase category" value={purchaseForm.category} onChange={(e) => setPurchaseForm({ ...purchaseForm, category: e.target.value })} className="rounded-lg border border-border bg-white px-3 py-2 text-sm" placeholder="Category" />
                              <input aria-label="Purchase description" value={purchaseForm.description} onChange={(e) => setPurchaseForm({ ...purchaseForm, description: e.target.value })} className="rounded-lg border border-border bg-white px-3 py-2 text-sm sm:col-span-2" placeholder="Description" />
                              <Button type="submit" disabled={creditBusy} className="sm:col-span-2">Record purchase</Button>
                            </form>
                            <form onSubmit={handleRepayment} className="mt-6 grid gap-3 border-t border-border pt-5 sm:grid-cols-2">
                              <input aria-label="Repayment amount" required type="number" min="0.01" step="0.01" value={repaymentForm.amount} onChange={(e) => updateRepaymentForm('amount', e.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm" placeholder="Repayment amount" />
                              <select aria-label="Source wallet" required value={repaymentForm.sourceWalletId} onChange={(e) => updateRepaymentForm('sourceWalletId', e.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
                                <option value="">Source wallet</option>
                                {wallets.filter((w) => w.id !== selected.id && w.cardType?.toLowerCase() !== 'credit').map((w) => (
                                  <option key={w.id} value={w.id}>{w.cardName || w.bankName || w.cardType} · {formatCurrency(w.balance || 0)}</option>
                                ))}
                              </select>
                              <select aria-label="Statement association" value={repaymentForm.statementId} onChange={(e) => updateRepaymentForm('statementId', e.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm sm:col-span-2">
                                <option value="">No statement association</option>
                                {creditStatements.map((statement) => <option key={statement.id} value={statement.id}>{statement.periodEnd} · {formatCurrency(statement.statementBalance)}</option>)}
                              </select>
                              <Button type="submit" disabled={creditBusy} className="sm:col-span-2">Record internal repayment</Button>
                            </form>
                            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                              <span className="text-xs text-neutral-muted">Statements are local snapshots; no interest or fees are estimated.</span>
                              <Button type="button" variant="outline" onClick={handleGenerateStatement} disabled={creditBusy}>Generate statement</Button>
                            </div>
                          </>
                        )}
                        {creditError && <p role="alert" className="mt-3 text-sm text-danger">{creditError}</p>}
                        {creditMessage && <p role="status" className="mt-3 text-sm text-emerald-700">{creditMessage}</p>}
                        <p className="mt-3 text-xs text-neutral-muted">Repayments are recorded internal transfers only and are not sent to your bank or issuer.</p>
                      </div>

                      <div className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
                        <div className="flex items-center justify-between gap-3">
                          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Statements & activity</h2>
                          {creditStatements.length > 0 && <span className="text-xs text-neutral-muted">{creditStatements.length} statements</span>}
                        </div>
                        <div className="mt-4 space-y-3">
                          {creditStatements.map((statement) => (
                            (() => {
                              const paid = creditActivity
                                .filter((item) => item.transactionKind === 'repayment' && item.statementId === statement.id)
                                .reduce((total, item) => total + Number(item.amount || 0), 0);
                              const remaining = Math.max(0, Number(statement.statementBalance) - paid);
                              const today = dateInTimeZone(new Date(), selected.timezone || 'UTC');
                              const dueInDays = daysBetween(today, statement.dueDate);
                              const status = remaining <= 0.01
                                ? 'Paid'
                                : paid > 0
                                  ? 'Partially paid'
                                  : dueInDays < 0
                                    ? 'Overdue'
                                    : dueInDays > 0
                                      ? 'Upcoming'
                                      : 'Unpaid';
                              return (
                                <div key={statement.id} className="rounded-xl border border-border bg-white p-3">
                                  <div className="flex justify-between gap-3 text-sm font-semibold">
                                    <span>{statement.periodStart} – {statement.periodEnd}</span>
                                    <span>{formatCurrency(statement.statementBalance)}</span>
                                  </div>
                                  <p className="mt-1 text-xs text-neutral-muted">
                                    Due {statement.dueDate} · {status} · Remaining {formatCurrency(remaining)}
                                  </p>
                                  <p className="mt-1 text-xs text-neutral-muted">
                                    {remaining <= 0.01
                                      ? 'Settled'
                                      : dueInDays >= 0
                                        ? `${dueInDays} day(s) until due`
                                        : `${Math.abs(dueInDays)} day(s) overdue`}
                                    {' · '}Minimum {statement.minimumPaymentAmount == null ? 'unavailable' : formatCurrency(statement.minimumPaymentAmount)}
                                  </p>
                                </div>
                              );
                            })()
                          ))}
                          {creditStatements.length === 0 && <p className="text-sm text-neutral-muted">No statement snapshots yet.</p>}
                          <div className="border-t border-border pt-3">
                            {creditActivity.map((item) => {
                              const alreadyRefunded = item.transactionKind === 'purchase'
                                ? creditActivity
                                  .filter((refund) => refund.transactionKind === 'refund' && refund.relatedTransactionId === item.id)
                                  .reduce((total, refund) => total + Number(refund.amount || 0), 0)
                                : 0;
                              const refundable = Math.max(0, Number(item.amount) - alreadyRefunded);
                              return (
                                <div key={`${item.transactionKind}-${item.id}`} className="border-b border-border py-2 text-sm last:border-0">
                                  <div className="flex justify-between gap-3">
                                    <div>
                                      <p className="font-medium">{item.description || item.category || item.transactionKind}</p>
                                      <p className="text-xs capitalize text-neutral-muted">{item.transactionKind} · {String(item.date || '').slice(0, 10)}</p>
                                    </div>
                                    <span className={`font-semibold ${item.transactionKind === 'refund' || item.transactionKind === 'repayment' ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>
                                      {item.transactionKind === 'refund' ? '+' : item.transactionKind === 'repayment' ? '−' : ''}
                                      {formatCurrency(item.amount)}
                                    </span>
                                  </div>
                                  {item.transactionKind === 'repayment' && (
                                    <div className="mt-1 flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleReverseRepayment(item.id)}
                                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[10px] font-medium text-neutral-muted hover:border-danger/30 hover:bg-danger/10 hover:text-danger transition-colors"
                                        title="Reverse this repayment and restore source funds"
                                      >
                                        <RotateCcw size={10} /> Reverse repayment
                                      </button>
                                    </div>
                                  )}
                                  {item.transactionKind === 'purchase' && refundable > 0 && (
                                    <form onSubmit={(event) => handleRefund(event, item)} className="mt-2 flex flex-wrap gap-2">
                                      <input
                                        aria-label={`Refund amount for ${item.description || 'purchase'}`}
                                        required
                                        type="number"
                                        min="0.01"
                                        max={refundable}
                                        step="0.01"
                                        value={refundAmounts[item.id] || ''}
                                        onChange={(event) => {
                                          setRefundAmounts((current) => ({ ...current, [item.id]: event.target.value }));
                                          setRefundIdempotencyKeys((current) => ({ ...current, [item.id]: '' }));
                                        }}
                                        className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs"
                                        placeholder={`Refund up to ${formatCurrency(refundable)}`}
                                      />
                                      <Button type="submit" variant="outline" disabled={creditBusy}>
                                        Record refund
                                      </Button>
                                    </form>
                                  )}
                                </div>
                              );
                            })}
                            {creditActivity.length === 0 && <p className="text-sm text-neutral-muted">No credit activity recorded.</p>}
                          </div>
                        </div>
                      </div>
                    </section>
              )}

          {/* Bottom — Mini Card Selector Strip */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-muted">
                Your Cards
              </h3>
              <span className="text-[10px] text-neutral-muted">
                {wallets.length} card{wallets.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-4 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-hide">
              {wallets.map((w, i) => (
                <MiniCardPreview
                  key={w.id}
                  wallet={w}
                  index={i}
                  isSelected={w.id === selected?.id}
                  onClick={() => setSelectedWalletId(w.id)}
                />
              ))}

              {/* Add new card ghost button */}
              <button
                type="button"
                onClick={openAddCardModal}
                className="shrink-0 w-[200px] h-[120px] rounded-2xl border-2 border-dashed border-border bg-white hover:border-primary/40 flex flex-col items-center justify-center gap-2 text-neutral-muted hover:text-primary transition-all duration-200 group cursor-pointer shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-background group-hover:bg-primary-glow flex items-center justify-center transition-colors">
                  <Plus size={20} />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider">Add Card</span>
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="w-full text-center text-neutral-muted py-12 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center bg-white shadow-sm">
          <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center mb-4">
            <CreditCard size={28} className="text-neutral-muted" />
          </div>
          <p className="mb-4">No cards found in your wallet.</p>
          <Button variant="outline" onClick={openAddCardModal}>Add your first card</Button>
        </div>
      )}

      <AddCardModal 
        isOpen={isModalOpen} 
        onClose={closeCardModal} 
        onSave={handleSaveCard} 
        initialData={editingWallet}
        isGuest={isGuest}
      />

      <AddBalanceModal
        wallet={topUpWallet}
        isOpen={Boolean(topUpWallet)}
        onClose={closeTopUpModal}
        onConfirm={handleAddMoney}
      />

      <PayCreditCardModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        card={selected}
        allWallets={wallets}
        statements={creditStatements}
        onPay={handlePayCreditCardModalSubmit}
        isGuest={isGuest}
      />
    </Layout>
  );
};

export default WalletPage;
