import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import TransactionStatsCard3D from '../components/ui/TransactionStatsCard3D';
import CategoryStatsCard3D from '../components/ui/CategoryStatsCard3D';
import api from '../services/api';
import walletService from '../services/walletService';
import { formatDate } from '../utils/dateHelpers';
import { formatCurrency } from '../utils/formatCurrency';
import { ArrowDownLeft, ArrowUpRight, Trash2, Plus, CreditCard, RotateCcw } from 'lucide-react';
import useAuthStore from '../store/authStore';
import guestStorage from '../services/guestStorage';

const toDateInputValue = (date) => date.toISOString().slice(0, 10);

const toDateTimeLocalValue = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const getWeekRange = (date) => {
  const current = new Date(date);
  const day = current.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(current);
  start.setDate(current.getDate() + diffToMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end)
  };
};

const getMonthWeekLabel = (dateValue) => {
  const date = new Date(dateValue);
  const weekNumber = Math.ceil(date.getDate() / 7);
  const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  return `${monthLabel} - Week ${String(weekNumber).padStart(2, '0')}`;
};

const getEmptyTransactionForm = () => ({
  type: 'expense',
  amount: '',
  category: '',
  description: '',
  date: toDateTimeLocalValue(new Date()),
  isRecurring: false,
  walletId: ''
});

const toTitleCase = (value) => value
  .trim()
  .replace(/\s+/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const TransactionsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isGuest } = useAuthStore();
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [categoryHistory, setCategoryHistory] = useState([]);
  const now = new Date();
  const currentWeek = getWeekRange(now);
  const [filterMode, setFilterMode] = useState('month');
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [customStartDate, setCustomStartDate] = useState(currentWeek.startDate);
  const [customEndDate, setCustomEndDate] = useState(currentWeek.endDate);
  
  // Modal Form State
  const [formData, setFormData] = useState(getEmptyTransactionForm);

  const savedCategories = React.useMemo(() => {
    const uniqueCategories = new Map();
    categoryHistory.forEach((category) => {
      uniqueCategories.set(category.toLocaleLowerCase(), category);
    });
    transactions.forEach((transaction) => {
      const category = transaction.category?.trim();
      if (category && !uniqueCategories.has(category.toLocaleLowerCase())) {
        uniqueCategories.set(category.toLocaleLowerCase(), category);
      }
    });
    return [...uniqueCategories.values()].sort((a, b) => a.localeCompare(b));
  }, [categoryHistory, transactions]);

  const rememberMany = (categories) => {
    const unique = new Map(
      categoryHistory.map((c) => [String(c).toLocaleLowerCase(), c])
    );

    categories.forEach((value) => {
      const category = String(value || '').trim().replace(/\s+/g, ' ');
      if (category && !unique.has(category.toLocaleLowerCase())) {
        unique.set(category.toLocaleLowerCase(), category);
      }
    });

    const saved = [...unique.values()].sort((a, b) => a.localeCompare(b));
    return saved;
  };

  const normalizeCategory = (value) => {
    const trimmedValue = value.trim().replace(/\s+/g, ' ');
    if (!trimmedValue) return '';

    const exactMatch = savedCategories.find(
      (category) => category.toLocaleLowerCase() === trimmedValue.toLocaleLowerCase()
    );
    if (exactMatch) return exactMatch;

    const prefixMatches = savedCategories.filter(
      (category) => category.toLocaleLowerCase().startsWith(trimmedValue.toLocaleLowerCase())
    );
    if (prefixMatches.length === 1) return prefixMatches[0];

    return toTitleCase(trimmedValue);
  };

  const buildTransactionParams = () => {
    if (filterMode === 'week') {
      return getWeekRange(new Date());
    }

    if (filterMode === 'year') {
      return {
        startDate: `${filterYear}-01-01`,
        endDate: `${filterYear}-12-31`
      };
    }

    if (filterMode === 'custom') {
      return {
        startDate: customStartDate,
        endDate: customEndDate
      };
    }

    return {
      month: filterMonth,
      year: filterYear
    };
  };

  const fetchData = async () => {
    let loadedWallets = [];
    try {
      if (isGuest) {
        loadedWallets = guestStorage.wallets.getAll();
        setWallets(loadedWallets);
      } else {
        const w = await walletService.getAll();
        loadedWallets = w || [];
        setWallets(loadedWallets);
      }
    } catch (err) {
      console.error('Failed to fetch wallets', err);
    }

    try {
      const params = buildTransactionParams();
      let txList = [];
      let repayments = [];

      if (isGuest) {
        txList = guestStorage.transactions.getAll(params);
        repayments = guestStorage.transactions.getAllRepayments(params);
      } else {
        const txRes = await api.get('/transactions', { params });
        if (txRes.data.success) {
          txList = txRes.data.data;
        }
        try {
          repayments = await walletService.getAllRepayments(params);
        } catch (e) {
          console.warn('Could not load repayments', e);
        }
      }

      // Convert repayments into displayable transaction items (type: 'transfer')
      const repaymentTxs = (repayments || []).map((r) => {
        const targetCard = loadedWallets.find((w) => w.id === r.walletId);
        const sourceWallet = loadedWallets.find((w) => w.id === r.sourceWalletId);
        return {
          id: r.id,
          type: 'transfer',
          transactionKind: 'repayment',
          amount: Number(r.amount),
          category: 'Debt Repayment',
          description: `Credit Card Repayment: ${sourceWallet?.bankName || sourceWallet?.cardType || 'Funding Account'} → ${targetCard?.cardName || targetCard?.bankName || 'Credit Card'}`,
          date: r.date,
          walletId: r.walletId,
          sourceWalletId: r.sourceWalletId,
          isRepayment: true
        };
      });

      const combined = [...txList, ...repaymentTxs].sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(combined);
      setCategoryHistory(rememberMany(txList.map((transaction) => transaction.category)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterMode, filterMonth, filterYear, customStartDate, customEndDate]);

  useEffect(() => {
    // wallets are fetched in fetchData; no local storage sync needed
    return undefined;
  }, []);

  const handleDelete = async (id) => {
    try {
      if (isGuest) {
        guestStorage.transactions.remove(id);
      } else {
        await api.delete(`/transactions/${id}`);
      }
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    setEditingTransaction(null);
    setFormData(getEmptyTransactionForm());
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (location.state?.openAddTransaction) {
      setEditingTransaction(null);
      setFormData(getEmptyTransactionForm());
      setIsModalOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.key, location.pathname, location.state, navigate]);

  const openEditModal = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type || 'expense',
      amount: transaction.amount ?? '',
      category: transaction.category || '',
      description: transaction.description || '',
      date: transaction.date ? transaction.date.slice(0, 16) : toDateTimeLocalValue(new Date()),
      isRecurring: Boolean(transaction.isRecurring),
      walletId: transaction.walletId || ''
    });
    setIsModalOpen(true);
  };

  const closeTransactionModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    setFormData(getEmptyTransactionForm());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        category: normalizeCategory(formData.category)
      };
      if (!payload.walletId) delete payload.walletId;

      const targetWallet = wallets.find(w => w.id === payload.walletId);
      if (targetWallet && targetWallet.cardType?.toLowerCase() === 'credit') {
        const avail = Math.max(0, Number(targetWallet.creditLimit || 0) - Number(targetWallet.outstandingBalance || 0));
        if (payload.type === 'expense' && payload.amount > avail) {
          alert(`Purchase amount (${formatCurrency(payload.amount)}) exceeds available credit (${formatCurrency(avail)}).`);
          return;
        }
        if (payload.type === 'income') {
          alert('Credit cards only record expenses / purchases. To record repayments, use the Pay Credit Card feature in your Wallet.');
          return;
        }
      }

      if (isGuest) {
        if (editingTransaction) {
          guestStorage.transactions.update(editingTransaction.id, payload);
        } else {
          guestStorage.transactions.create(payload);
        }
      } else {
        if (editingTransaction) {
          await api.put(`/transactions/${editingTransaction.id}`, payload);
        } else {
          await api.post('/transactions', payload);
        }
      }

      setCategoryHistory((prev) => rememberMany([...prev, payload.category]));
      closeTransactionModal();
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || 'Failed to save transaction');
    }
  };

  const renderTransactionRows = () => {
    let lastWeekLabel = '';

    return transactions.flatMap((tx, idx) => {
      const weekLabel = getMonthWeekLabel(tx.date);
      const shouldShowDivider = weekLabel !== lastWeekLabel;
      lastWeekLabel = weekLabel;

      const rows = [];
      if (shouldShowDivider) {
        rows.push(
          <tr key={`week-${weekLabel}`} className="bg-background/25">
            <td colSpan="3" className="px-5 py-2">
              <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-neutral-muted/70">
                <span className="h-px flex-1 bg-border/70"></span>
                <span>{weekLabel}</span>
                <span className="h-px flex-1 bg-border/70"></span>
              </div>
            </td>
          </tr>
        );
      }

      rows.push(
        <tr
          key={tx.id || idx}
          onClick={() => {
            if (!tx.isRepayment) openEditModal(tx);
          }}
          className={`border-b border-border last:border-0 hover:bg-background/30 transition-colors animate-[fade-in_0.3s_ease-out_both] ${tx.isRepayment ? 'cursor-default bg-primary/[0.02]' : 'cursor-pointer'}`}
          style={{animationDelay: `${idx * 50}ms`}}
        >
          <td className="px-5 py-3.5">
            <div className="flex items-center gap-3">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                tx.type === 'transfer'
                  ? 'bg-primary/10 text-primary'
                  : tx.type === 'income' || tx.transactionKind === 'refund'
                    ? 'bg-success/10 text-success'
                    : 'bg-danger/10 text-danger'
              }`}>
                {tx.type === 'transfer' ? (
                  <RotateCcw size={16} />
                ) : tx.type === 'income' || tx.transactionKind === 'refund' ? (
                  <ArrowDownLeft size={17} />
                ) : (
                  <ArrowUpRight size={17} />
                )}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-neutral-text">{tx.description || tx.category}</p>
                  {tx.transactionKind === 'purchase' && (
                    <span className="rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                      Credit
                    </span>
                  )}
                  {tx.transactionKind === 'repayment' && (
                    <span className="rounded-md bg-primary/15 text-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                      Settlement
                    </span>
                  )}
                  {tx.transactionKind === 'refund' && (
                    <span className="rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                      Refund
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-neutral-muted">{tx.category} · {formatDate(tx.date)}</p>
              </div>
            </div>
          </td>
          <td className={`px-5 py-3.5 text-right text-sm font-bold tabular-nums ${
            tx.type === 'transfer'
              ? 'text-primary'
              : tx.type === 'income' || tx.transactionKind === 'refund'
                ? 'text-success'
                : 'text-danger'
          }`}>
            {tx.type === 'transfer' ? '↔ ' : tx.type === 'income' || tx.transactionKind === 'refund' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
          </td>
          <td className="px-5 py-3.5 text-right">
            {!tx.isRepayment ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(tx.id);
                }}
                className="p-2 text-neutral-muted hover:text-danger hover:bg-danger/10 rounded-full transition-colors"
                title="Delete transaction"
                aria-label="Delete transaction"
              >
                <Trash2 size={18} />
              </button>
            ) : (
              <span className="text-[11px] text-neutral-muted/60 italic">Wallet repayment</span>
            )}
          </td>
        </tr>
      );

      return rows;
    });
  };

  const renderTransactionCards = () => {
    let lastWeekLabel = '';

    return transactions.flatMap((tx, idx) => {
      const weekLabel = getMonthWeekLabel(tx.date);
      const shouldShowDivider = weekLabel !== lastWeekLabel;
      lastWeekLabel = weekLabel;

      const items = [];
      if (shouldShowDivider) {
        items.push(
          <div key={`mobile-week-${weekLabel}`} className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-border/70"></span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-muted/70">{weekLabel}</span>
            <span className="h-px flex-1 bg-border/70"></span>
          </div>
        );
      }

      items.push(
        <button
          key={tx.id || idx}
          type="button"
          onClick={() => openEditModal(tx)}
          className="w-full rounded-xl border border-border bg-surface p-4 text-left shadow-sm transition-colors hover:bg-surface-hover"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-neutral-text">{tx.description || tx.category}</p>
              <p className="mt-1 text-xs text-neutral-muted">{formatDate(tx.date)}</p>
            </div>
            <p className={`shrink-0 text-sm font-bold tabular-nums ${tx.type === 'income' ? 'text-success' : 'text-danger'}`}>
              {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
            </p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Badge type={tx.type}>{tx.type}</Badge>
              <span className="truncate text-xs text-neutral-muted">{tx.category}</span>
            </div>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(tx.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete(tx.id);
                }
              }}
              className="rounded-full p-2 text-neutral-muted hover:bg-danger/10 hover:text-danger"
              aria-label="Delete transaction"
            >
              <Trash2 size={17} />
            </span>
          </div>
        </button>
      );

      return items;
    });
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <TopBar title="Transactions" className="mb-0 flex-1" />
        <Button onClick={openAddModal} className="w-full gap-2 shadow-md shadow-primary/20 sm:w-auto">
          <Plus size={18} /> Add Transaction
        </Button>
      </div>

      {/* 3D Stats Cards */}
      <div className="mb-5 grid w-full grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
        <div className="flex min-w-0">
          <TransactionStatsCard3D transactions={transactions} />
        </div>
        <div className="flex min-w-0">
          <CategoryStatsCard3D transactions={transactions} />
        </div>
      </div>

      <section className="mb-4 rounded-card border border-border bg-surface p-4 shadow-card sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-neutral-text">Transaction history</h2>
            <p className="mt-0.5 text-xs text-neutral-muted">Filter and review your activity</p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tabular-nums text-primary">
            {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}
          </span>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-wrap gap-2">
            {['week', 'month', 'year', 'custom'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterMode(mode)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold capitalize transition-colors sm:text-sm ${
                  filterMode === mode ? 'bg-primary text-white shadow-sm shadow-primary/20' : 'bg-background text-neutral-muted hover:bg-primary/5 hover:text-primary'
                }`}
              >
                {mode === 'week' ? 'This week' : mode}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
          {(filterMode === 'month' || filterMode === 'year') && (
            <input
              type="number"
              min="2000"
              max="2100"
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              aria-label="Filter year"
              className="w-28 rounded-input border border-border bg-input-bg px-3 py-2 text-sm text-neutral-text focus:border-primary focus:outline-none"
            />
          )}

          {filterMode === 'month' && (
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              aria-label="Filter month"
              className="rounded-input border border-border bg-input-bg px-3 py-2 text-sm text-neutral-text focus:border-primary focus:outline-none"
            >
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {new Date(2024, index, 1).toLocaleDateString('en-US', { month: 'long' })}
                </option>
              ))}
            </select>
          )}

          {filterMode === 'custom' && (
            <>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                aria-label="Start date"
                className="rounded-input border border-border bg-input-bg px-3 py-2 text-sm text-neutral-text focus:border-primary focus:outline-none"
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                aria-label="End date"
                className="rounded-input border border-border bg-input-bg px-3 py-2 text-sm text-neutral-text focus:border-primary focus:outline-none"
              />
            </>
          )}
          </div>
        </div>
      </section>

      <div className="rounded-card border border-border bg-surface p-3 shadow-card md:hidden">
        {loading ? (
          <div className="p-6 text-center text-neutral-muted">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="p-6 text-center text-neutral-muted">No transactions found for this filter.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {renderTransactionCards()}
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-card border border-border bg-surface shadow-card md:block">
        {loading ? (
          <div className="p-8 text-center text-neutral-muted">Loading transactions...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background/70 text-xs uppercase tracking-wide text-neutral-muted">
                  <th className="px-5 py-3 font-semibold">Transaction</th>
                  <th className="px-5 py-3 text-right font-semibold">Amount</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {renderTransactionRows()}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-neutral-muted">
                      No transactions found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeTransactionModal}
        title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={formData.type === 'expense'} onChange={() => setFormData({...formData, type: 'expense'})} />
              <span>Expense</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={formData.type === 'income'} onChange={() => setFormData({...formData, type: 'income'})} />
              <span>Income</span>
            </label>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-muted">Amount</label>
            <input type="number" step="0.01" required className="w-full rounded-input border border-border bg-input-bg p-2.5 text-neutral-text focus:border-primary focus:outline-none" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-muted">Transaction date</label>
            <input
              type="datetime-local"
              required
              className="w-full rounded-input border border-border bg-input-bg p-2.5 text-neutral-text focus:border-primary focus:outline-none"
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
            />
          </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-muted">Category</label>
            <input
              type="text"
              required
              list="saved-transaction-categories"
              autoComplete="off"
              className="w-full rounded-input border border-border bg-input-bg p-2.5 text-neutral-text focus:border-primary focus:outline-none"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
              onBlur={e => setFormData((current) => ({
                ...current,
                category: normalizeCategory(e.target.value)
              }))}
              placeholder="Start typing, e.g. Gro..."
            />
            <datalist id="saved-transaction-categories">
              {savedCategories.map((category) => (
                <option key={category.toLocaleLowerCase()} value={category} />
              ))}
            </datalist>
            <p className="mt-1 text-xs text-neutral-muted">
              Existing categories are matched without considering uppercase or lowercase.
            </p>
          </div>

          {/* Wallet Selector with Groups and Live Available Credit Check */}
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-muted">Wallet or payment method <span className="font-normal">(optional)</span></label>
            <select 
              className="w-full rounded-input border border-border bg-input-bg p-2.5 text-neutral-text focus:border-primary focus:outline-none"
              value={formData.walletId}
              onChange={e => setFormData({...formData, walletId: e.target.value})}
            >
              <option value="">No Card Selected (Cash / Untracked)</option>
              
              {wallets.some(w => w.cardType?.toLowerCase() === 'credit') && (
                <optgroup label="Credit Cards">
                  {wallets.filter(w => w.cardType?.toLowerCase() === 'credit').map(w => {
                    const avail = Math.max(0, Number(w.creditLimit || 0) - Number(w.outstandingBalance || 0));
                    return (
                      <option key={w.id} value={w.id}>
                        💳 {w.cardName || w.bankName} (•••• {String(w.cardNumber || '').slice(-4)}) — Available: {formatCurrency(avail)}
                      </option>
                    );
                  })}
                </optgroup>
              )}

              {wallets.some(w => ['debit', 'personal'].includes(w.cardType?.toLowerCase())) && (
                <optgroup label="Debit Cards & Bank Accounts">
                  {wallets.filter(w => ['debit', 'personal'].includes(w.cardType?.toLowerCase())).map(w => (
                    <option key={w.id} value={w.id}>
                      🏦 {w.cardName || w.bankName || 'Bank'} (•••• {String(w.cardNumber || '').slice(-4)}) — Balance: {formatCurrency(w.balance || 0)}
                    </option>
                  ))}
                </optgroup>
              )}

              {wallets.some(w => w.cardType?.toLowerCase() === 'upi') && (
                <optgroup label="UPI Accounts">
                  {wallets.filter(w => w.cardType?.toLowerCase() === 'upi').map(w => (
                    <option key={w.id} value={w.id}>
                      📱 {w.bankName || 'UPI'} ({w.cardNumber}) — Balance: {formatCurrency(w.balance || 0)}
                    </option>
                  ))}
                </optgroup>
              )}

              {wallets.some(w => w.cardType?.toLowerCase() === 'cash') && (
                <optgroup label="Cash">
                  {wallets.filter(w => w.cardType?.toLowerCase() === 'cash').map(w => (
                    <option key={w.id} value={w.id}>
                      💵 {w.cardName || 'Cash'} — Balance: {formatCurrency(w.balance || 0)}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Credit Card Selected Info Banner */}
          {(() => {
            const selectedWallet = wallets.find(w => w.id === formData.walletId);
            if (!selectedWallet || selectedWallet.cardType?.toLowerCase() !== 'credit') return null;
            const limit = Number(selectedWallet.creditLimit || 0);
            const debt = Number(selectedWallet.outstandingBalance || 0);
            const avail = Math.max(0, limit - debt);
            const requestedAmount = parseFloat(formData.amount) || 0;
            const exceedsCredit = formData.type === 'expense' && requestedAmount > avail;

            return (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-text flex items-center gap-1.5">
                    <CreditCard size={14} className="text-primary" />
                    {selectedWallet.cardName || selectedWallet.bankName || 'Credit Card'}
                  </span>
                  <span className={`font-bold tabular-nums ${exceedsCredit ? 'text-danger' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    Available Credit: {formatCurrency(avail)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-neutral-muted">
                  <span>Credit Limit: {formatCurrency(limit)}</span>
                  <span>Outstanding: {formatCurrency(debt)}</span>
                </div>
                {exceedsCredit && (
                  <p className="text-danger font-semibold text-[11px] pt-1 border-t border-danger/20">
                    ⚠️ Expense amount ({formatCurrency(requestedAmount)}) exceeds available credit ({formatCurrency(avail)})!
                  </p>
                )}
                {formData.type === 'income' && (
                  <p className="text-amber-600 dark:text-amber-400 font-semibold text-[11px] pt-1 border-t border-amber-300">
                    ℹ️ Credit cards only accept expenses. To record repayments or refunds, use the Wallet page.
                  </p>
                )}
              </div>
            );
          })()}

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-muted">Description</label>
            <input type="text" className="w-full rounded-input border border-border bg-input-bg p-2.5 text-neutral-text focus:border-primary focus:outline-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          {(() => {
            const selectedWallet = wallets.find(w => w.id === formData.walletId);
            const isCredit = selectedWallet?.cardType?.toLowerCase() === 'credit';
            const avail = isCredit ? Math.max(0, Number(selectedWallet.creditLimit || 0) - Number(selectedWallet.outstandingBalance || 0)) : Infinity;
            const requestedAmount = parseFloat(formData.amount) || 0;
            const isOverLimit = isCredit && formData.type === 'expense' && requestedAmount > avail;
            const isCreditIncome = isCredit && formData.type === 'income';

            return (
              <Button type="submit" disabled={isOverLimit || isCreditIncome} className="w-full mt-4">
                {editingTransaction ? 'Update Transaction' : 'Save Transaction'}
              </Button>
            );
          })()}
        </form>
      </Modal>
    </Layout>
  );
};

export default TransactionsPage;
