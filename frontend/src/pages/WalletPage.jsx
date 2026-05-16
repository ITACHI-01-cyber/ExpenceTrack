import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import Button from '../components/ui/Button';
import WalletCard from '../components/dashboard/WalletCard';
import AddCardModal from '../components/ui/AddCardModal';
import { Edit3, Plus, PlusCircle, Trash2, X } from 'lucide-react';
import api from '../services/api';

const WalletPage = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [topUpWallet, setTopUpWallet] = useState(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpError, setTopUpError] = useState('');
  const [deletingWalletId, setDeletingWalletId] = useState(null);

  const fetchWallets = async () => {
    try {
      const res = await api.get('/wallet');
      if (res.data.success) {
        setWallets(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const handleSaveCard = async (cardData) => {
    try {
      const payload = { ...cardData, balance: Number(cardData.balance || 0) };
      const res = editingWallet
        ? await api.put(`/wallet/${editingWallet.id}`, payload)
        : await api.post('/wallet', payload);
      if (res.data.success) {
        fetchWallets();
        setEditingWallet(null);
      }
    } catch (err) {
      console.error('Failed to save card:', err);
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
    setTopUpAmount('');
    setTopUpError('');
  };

  const closeTopUpModal = () => {
    setTopUpWallet(null);
    setTopUpAmount('');
    setTopUpError('');
  };

  const handleAddMoney = async (e) => {
    e.preventDefault();
    const amount = Number(topUpAmount);

    if (!amount || amount <= 0) {
      setTopUpError('Enter an amount greater than 0.');
      return;
    }

    try {
      const res = await api.patch(`/wallet/${topUpWallet.id}/add-money`, null, {
        params: { amount }
      });
      if (res.data.success) {
        fetchWallets();
        closeTopUpModal();
      }
    } catch (err) {
      console.error('Failed to add money:', err);
      setTopUpError(err.response?.data?.message || 'Failed to add money.');
    }
  };

  const handleDeleteWallet = async (wallet) => {
    const label = wallet.bankName || wallet.cardType || 'this card';
    const confirmed = window.confirm(`Remove ${label} from your wallet?`);
    if (!confirmed) return;

    try {
      setDeletingWalletId(wallet.id);
      const res = await api.delete(`/wallet/${wallet.id}`);
      if (res.data.success) {
        fetchWallets();
      }
    } catch (err) {
      console.error('Failed to remove card:', err);
      window.alert(err.response?.data?.message || 'Failed to remove card.');
    } finally {
      setDeletingWalletId(null);
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:mb-8">
        <TopBar title="Wallet" />
        <Button className="w-full gap-2 sm:w-auto" onClick={openAddCardModal}>
          <Plus size={18} /> Add Card
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="w-full text-center text-neutral-muted py-12">Loading cards...</div>
        ) : wallets.length > 0 ? (
          wallets.map((w, i) => (
            <div key={w.id || i} className="mx-auto w-full max-w-[340px] animate-[fade-in_0.5s_ease-out_both] space-y-3 sm:mx-0" style={{animationDelay: `${i*150}ms`}}>
              <WalletCard wallet={w} />
              <div className="grid w-full max-w-[340px] grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className="gap-1 bg-white px-2 text-xs sm:gap-2 sm:text-sm"
                  onClick={() => openTopUpModal(w)}
                >
                  <PlusCircle size={16} />
                  Add Money
                </Button>
                <Button
                  variant="outline"
                  className="gap-1 bg-white px-2 text-xs sm:gap-2 sm:text-sm"
                  onClick={() => openEditCardModal(w)}
                >
                  <Edit3 size={16} />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  className="gap-1 px-2 text-xs text-danger hover:bg-danger/10 hover:text-danger sm:gap-2 sm:text-sm"
                  onClick={() => handleDeleteWallet(w)}
                  disabled={deletingWalletId === w.id}
                >
                  <Trash2 size={16} />
                  {deletingWalletId === w.id ? 'Removing...' : 'Remove'}
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="w-full text-center text-neutral-muted py-12 border-2 border-dashed border-border rounded-xl sm:col-span-2 xl:col-span-3">
            <p className="mb-4">No cards found in your wallet.</p>
            <Button variant="outline" onClick={openAddCardModal}>Add your first card</Button>
          </div>
        )}
      </div>

      <AddCardModal 
        isOpen={isModalOpen} 
        onClose={closeCardModal} 
        onSave={handleSaveCard} 
        initialData={editingWallet}
      />

      {topUpWallet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-sm rounded-t-2xl bg-background p-5 shadow-2xl sm:rounded-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-primary">Add Money</h2>
                <p className="mt-1 text-sm text-neutral-muted">
                  {topUpWallet.bankName || topUpWallet.cardType} ending {topUpWallet.cardNumber?.slice(-4)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeTopUpModal}
                className="rounded-full p-1 text-neutral-muted hover:bg-white hover:text-primary"
                aria-label="Close add money modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddMoney} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-text">Amount to Add</label>
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  autoFocus
                  className="w-full rounded-lg border border-border bg-white px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="0.00"
                />
                {topUpError && <p className="mt-2 text-xs font-medium text-danger">{topUpError}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeTopUpModal}>Cancel</Button>
                <Button type="submit">Add Money</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default WalletPage;
