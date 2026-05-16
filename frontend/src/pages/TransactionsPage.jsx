import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import api from '../services/api';
import { formatDate } from '../utils/dateHelpers';
import { formatCurrency } from '../utils/formatCurrency';
import { Trash2, Plus } from 'lucide-react';

const toDateInputValue = (date) => date.toISOString().slice(0, 10);

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
  date: new Date().toISOString().slice(0,16),
  isRecurring: false,
  walletId: ''
});

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const now = new Date();
  const currentWeek = getWeekRange(now);
  const [filterMode, setFilterMode] = useState('month');
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [customStartDate, setCustomStartDate] = useState(currentWeek.startDate);
  const [customEndDate, setCustomEndDate] = useState(currentWeek.endDate);
  
  // Modal Form State
  const [formData, setFormData] = useState(getEmptyTransactionForm);

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
    try {
      const [txRes, walletRes] = await Promise.all([
        api.get('/transactions', { params: buildTransactionParams() }),
        api.get('/wallet')
      ]);

      if (txRes.data.success) {
        setTransactions(txRes.data.data.sort((a,b) => new Date(b.date) - new Date(a.date)));
      }
      if (walletRes.data.success) {
        setWallets(walletRes.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterMode, filterMonth, filterYear, customStartDate, customEndDate]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions(prev => prev.filter(t => t.id !== id));
      // In a real app, implement a toast with undo here
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    setEditingTransaction(null);
    setFormData(getEmptyTransactionForm());
    setIsModalOpen(true);
  };

  const openEditModal = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type || 'expense',
      amount: transaction.amount ?? '',
      category: transaction.category || '',
      description: transaction.description || '',
      date: transaction.date ? transaction.date.slice(0, 16) : new Date().toISOString().slice(0,16),
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
      const payload = { ...formData, amount: parseFloat(formData.amount) };
      if (!payload.walletId) delete payload.walletId; // Don't send empty string if unselected

      if (editingTransaction) {
        await api.put(`/transactions/${editingTransaction.id}`, payload);
      } else {
        await api.post('/transactions', payload);
      }

      closeTransactionModal();
      fetchData(); // Refresh to get updated transactions and potentially wallets
    } catch (err) {
      console.error(err);
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
            <td colSpan="6" className="px-6 py-2">
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
          onClick={() => openEditModal(tx)}
          className="cursor-pointer border-b border-border last:border-0 hover:bg-background/30 transition-colors animate-[fade-in_0.3s_ease-out_both]"
          style={{animationDelay: `${idx * 50}ms`}}
        >
          <td className="px-6 py-4 text-sm text-neutral-muted">{formatDate(tx.date)}</td>
          <td className="px-6 py-4 text-sm font-medium text-neutral-text">{tx.description}</td>
          <td className="px-6 py-4 text-sm text-neutral-muted">{tx.category}</td>
          <td className="px-6 py-4 text-sm">
            <Badge type={tx.type}>{tx.type}</Badge>
          </td>
          <td className={`px-6 py-4 text-sm font-semibold ${tx.type === 'income' ? 'text-success' : 'text-danger'}`}>
            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
          </td>
          <td className="px-6 py-4 text-right">
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
          className="w-full rounded-xl border border-border bg-white p-4 text-left shadow-sm transition-colors hover:bg-background/40"
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
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <TopBar title="Transactions" />
        <Button onClick={openAddModal} className="w-full gap-2 sm:w-auto">
          <Plus size={18} /> Add Transaction
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-card border border-border bg-white p-4 shadow-sm md:flex-row md:items-end md:justify-between">
        <div className="flex flex-wrap gap-2">
          {['week', 'month', 'year', 'custom'].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilterMode(mode)}
              className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
                filterMode === mode ? 'bg-primary text-white shadow-sm' : 'bg-background text-neutral-muted hover:text-primary'
              }`}
            >
              {mode === 'week' ? 'This Week' : mode}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          {(filterMode === 'month' || filterMode === 'year') && (
            <input
              type="number"
              min="2000"
              max="2100"
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="w-28 rounded-input border border-border bg-white px-3 py-2 text-sm"
            />
          )}

          {filterMode === 'month' && (
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              className="rounded-input border border-border bg-white px-3 py-2 text-sm"
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
                className="rounded-input border border-border bg-white px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="rounded-input border border-border bg-white px-3 py-2 text-sm"
              />
            </>
          )}
        </div>
      </div>

      <div className="rounded-card border border-border bg-white p-3 shadow-sm md:hidden">
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

      <div className="hidden bg-white rounded-card shadow-sm border border-border overflow-hidden md:block">
        {loading ? (
          <div className="p-8 text-center text-neutral-muted">Loading transactions...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background/50 text-neutral-muted text-sm border-b border-border">
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Description</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {renderTransactionRows()}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-neutral-muted">
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
            <label className="block text-sm mb-1 text-neutral-muted">Amount</label>
            <input type="number" step="0.01" required className="w-full border rounded-input p-2" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
          </div>

          <div>
            <label className="block text-sm mb-1 text-neutral-muted">Transaction Date</label>
            <input
              type="datetime-local"
              required
              className="w-full border rounded-input p-2"
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
            />
          </div>
          </div>

          <div>
            <label className="block text-sm mb-1 text-neutral-muted">Category</label>
            <input type="text" required className="w-full border rounded-input p-2" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
          </div>

          <div>
            <label className="block text-sm mb-1 text-neutral-muted">Wallet/Card (Optional)</label>
            <select 
              className="w-full border rounded-input p-2 bg-white"
              value={formData.walletId}
              onChange={e => setFormData({...formData, walletId: e.target.value})}
            >
              <option value="">No Card Selected</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id}>
                  {w.bankName || w.cardType} (...{w.cardNumber ? w.cardNumber.slice(-4) : ''})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1 text-neutral-muted">Description</label>
            <input type="text" className="w-full border rounded-input p-2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          <Button type="submit" className="w-full mt-4">
            {editingTransaction ? 'Update Transaction' : 'Save Transaction'}
          </Button>
        </form>
      </Modal>
    </Layout>
  );
};

export default TransactionsPage;
