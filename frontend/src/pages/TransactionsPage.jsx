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

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Modal Form State
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().slice(0,16),
    isRecurring: false,
    walletId: ''
  });

  const fetchData = async () => {
    try {
      const now = new Date();
      const [txRes, walletRes] = await Promise.all([
        api.get(`/transactions?month=${now.getMonth() + 1}&year=${now.getFullYear()}`),
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
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions(prev => prev.filter(t => t.id !== id));
      // In a real app, implement a toast with undo here
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, amount: parseFloat(formData.amount) };
      if (!payload.walletId) delete payload.walletId; // Don't send empty string if unselected

      await api.post('/transactions', payload);
      setIsModalOpen(false);
      setFormData({ ...formData, amount: '', description: '', category: '' }); // Reset form
      fetchData(); // Refresh to get updated transactions and potentially wallets
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <TopBar title="Transactions" />
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus size={18} /> Add Transaction
        </Button>
      </div>

      <div className="bg-white rounded-card shadow-sm border border-border overflow-hidden">
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
                {transactions.map((tx, idx) => (
                  <tr 
                    key={tx.id || idx} 
                    className="border-b border-border last:border-0 hover:bg-background/30 transition-colors animate-[fade-in_0.3s_ease-out_both]"
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
                        onClick={() => handleDelete(tx.id)}
                        className="p-2 text-neutral-muted hover:text-danger hover:bg-danger/10 rounded-full transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-neutral-muted">
                      No transactions found for this month.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Transaction">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={formData.type === 'expense'} onChange={() => setFormData({...formData, type: 'expense'})} />
              <span>Expense</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={formData.type === 'income'} onChange={() => setFormData({...formData, type: 'income'})} />
              <span>Income</span>
            </label>
          </div>
          
          <div>
            <label className="block text-sm mb-1 text-neutral-muted">Amount</label>
            <input type="number" step="0.01" required className="w-full border rounded-input p-2" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
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

          <Button type="submit" className="w-full mt-4">Save Transaction</Button>
        </form>
      </Modal>
    </Layout>
  );
};

export default TransactionsPage;
