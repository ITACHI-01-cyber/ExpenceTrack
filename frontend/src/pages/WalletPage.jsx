import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import Button from '../components/ui/Button';
import WalletCard from '../components/dashboard/WalletCard';
import BigWallet from '../components/dashboard/BigWallet';
import AddCardModal from '../components/ui/AddCardModal';
import AddBalanceModal from '../components/ui/AddBalanceModal';
import { Plus } from 'lucide-react';
import walletService from '../services/walletService';

const WalletPage = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [topUpWallet, setTopUpWallet] = useState(null);
  const [deletingWalletId, setDeletingWalletId] = useState(null);
  const [selectedWalletId, setSelectedWalletId] = useState(null);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const data = await walletService.getAll();
      setWallets(data || []);
    } catch (err) {
      console.error('Failed to fetch wallets', err);
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

  const handleSaveCard = async (cardData) => {
    try {
      await walletService.save(cardData, editingWallet?.id);
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
      await walletService.addMoney(topUpWallet.id, amount);
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
      await walletService.remove(wallet.id);
      await fetchWallets();
    } catch (err) {
      console.error('Failed to remove card:', err);
      window.alert(err.message || 'Failed to remove card.');
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

      <p className="-mt-4 mb-6 text-xs text-neutral-muted">
        Cards are stored in your account and synchronized to the server.
      </p>

      {loading ? (
        <div className="w-full text-center text-neutral-muted py-12">Loading cards...</div>
      ) : wallets.length > 0 ? (
        <BigWallet
          wallets={wallets}
          selectedId={selectedWalletId}
          onSelect={(id) => setSelectedWalletId(id)}
          onAddMoney={(wallet) => openTopUpModal(wallet)}
          onEdit={(wallet) => openEditCardModal(wallet)}
          onRemove={(wallet) => handleDeleteWallet(wallet)}
        />
      ) : (
        <div className="w-full text-center text-neutral-muted py-12 border-2 border-dashed border-border rounded-xl sm:col-span-2 xl:col-span-3">
          <p className="mb-4">No cards found in your wallet.</p>
          <Button variant="outline" onClick={openAddCardModal}>Add your first card</Button>
        </div>
      )}

      <AddCardModal 
        isOpen={isModalOpen} 
        onClose={closeCardModal} 
        onSave={handleSaveCard} 
        initialData={editingWallet}
      />

      <AddBalanceModal
        wallet={topUpWallet}
        isOpen={Boolean(topUpWallet)}
        onClose={closeTopUpModal}
        onConfirm={handleAddMoney}
      />
    </Layout>
  );
};

export default WalletPage;
