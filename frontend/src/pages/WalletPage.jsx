import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import Button from '../components/ui/Button';
import WalletCard from '../components/dashboard/WalletCard';
import AddCardModal from '../components/ui/AddCardModal';
import AddBalanceModal from '../components/ui/AddBalanceModal';
import { Plus, CreditCard, Building2, User, Calendar, Banknote, ChevronRight, Sparkles } from 'lucide-react';
import walletService from '../services/walletService';
import { formatCurrency } from '../utils/formatCurrency';
import { getCardBackground } from '../utils/cardDesigns';

const MiniCardPreview = ({ wallet, isSelected, onClick }) => {
  const bg = getCardBackground(wallet);
  const isUpi = (wallet.cardType || '').toLowerCase() === 'upi';
  const isCash = (wallet.cardType || '').toLowerCase() === 'cash';
  const safeNumber = String(wallet.cardNumber || '');
  const lastFour = safeNumber.slice(-4);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative shrink-0 w-[200px] h-[120px] rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer group
        ${isSelected
          ? 'ring-2 ring-primary shadow-lg scale-[1.04]'
          : 'ring-1 ring-white/10 hover:ring-white/35 hover:shadow-lg hover:scale-[1.02]'
        }
      `}
      style={bg}
    >
      {/* Decorative circles */}
      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full border-[10px] border-white/10" />
      <div className="absolute -bottom-4 -left-4 h-12 w-12 rounded-full bg-white/8" />

      <div className="relative z-10 p-3.5 flex flex-col justify-between h-full text-white">
        <div className="flex items-start justify-between">
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] opacity-80">
            {wallet.bankName || wallet.cardType || 'Card'}
          </span>
          <span className="text-[10px] font-black italic tracking-tight opacity-90">
            {isUpi ? 'UPI' : (wallet.cardBrand || 'VISA').toUpperCase()}
          </span>
        </div>
        <div className="text-left">
          <p className="font-mono text-[11px] tracking-[0.1em] opacity-80 mb-1">
            {isCash ? '💵 Cash' : isUpi ? safeNumber : `•••• •••• •••• ${lastFour || '••••'}`}
          </p>
          <p className="text-sm font-bold tabular-nums">
            {formatCurrency(wallet.balance || 0)}
          </p>
        </div>
      </div>

      {/* Selection glow pulse */}
      {isSelected && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
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

  const selected = wallets.find((w) => w.id === selectedWalletId) || wallets[0] || null;

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
      if (selectedWalletId === wallet.id) setSelectedWalletId(null);
      await fetchWallets();
    } catch (err) {
      console.error('Failed to remove card:', err);
      window.alert(err.message || 'Failed to remove card.');
    } finally {
      setDeletingWalletId(null);
    }
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
        Cards are stored in your account and synchronized to the server.
      </p>

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
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mb-8">

            {/* Left Column — Selected Card Display */}
            <div className="w-full lg:w-[55%] xl:w-[52%]">
              <div className="relative">
                {/* Ambient glow behind card */}
                <div
                  className="absolute top-8 left-1/2 -translate-x-1/2 w-[80%] h-[70%] rounded-3xl blur-3xl opacity-15 pointer-events-none"
                  style={{
                    background: selected
                      ? `linear-gradient(135deg, ${selected.primaryColor || '#7C3AED'}, ${selected.secondaryColor || '#EC4899'})`
                      : 'transparent'
                  }}
                />

                {/* Card with 3D wrapper */}
                <div className="relative z-10">
                  <WalletCard
                    wallet={selected}
                    interactive={true}
                    onAddMoney={(w) => openTopUpModal(w)}
                    onEdit={(w) => openEditCardModal(w)}
                    onRemove={(w) => handleDeleteWallet(w)}
                    removing={deletingWalletId === selected?.id}
                  />
                </div>
              </div>
            </div>

            {/* Right Column — Card Details & Settings */}
            <div className="w-full lg:w-[45%] xl:w-[48%]">
              <div className="rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-sm">
                <div className="flex items-center gap-2.5 mb-5">
                  <Sparkles size={16} className="text-primary" />
                  <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Card Details</h2>
                </div>

                {selected && (
                  <div className="divide-y divide-border">
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
                      title={formatCurrency(selected.balance || 0)}
                      subtitle="Current balance"
                      action={
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${(selected.balance || 0) > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {(selected.balance || 0) > 0 ? 'Active' : 'Empty'}
                        </span>
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

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
              {wallets.map((w) => (
                <MiniCardPreview
                  key={w.id}
                  wallet={w}
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
