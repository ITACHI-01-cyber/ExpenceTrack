import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import Button from '../components/ui/Button';
import WalletCard from '../components/dashboard/WalletCard';
import AddCardModal from '../components/ui/AddCardModal';
import { Plus } from 'lucide-react';
import api from '../services/api';

const WalletPage = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      // Setup default balance or specific formatting if needed
      const payload = { ...cardData, balance: 0.0 };
      const res = await api.post('/wallet', payload);
      if (res.data.success) {
        fetchWallets();
      }
    } catch (err) {
      console.error('Failed to add card:', err);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <TopBar title="Wallet" />
        <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Add Card
        </Button>
      </div>

      <div className="flex flex-wrap gap-6 items-start">
        {loading ? (
          <div className="w-full text-center text-neutral-muted py-12">Loading cards...</div>
        ) : wallets.length > 0 ? (
          wallets.map((w, i) => (
            <div key={w.id || i} className="animate-[fade-in_0.5s_ease-out_both]" style={{animationDelay: `${i*150}ms`}}>
               <WalletCard wallet={w} />
            </div>
          ))
        ) : (
          <div className="w-full text-center text-neutral-muted py-12 border-2 border-dashed border-border rounded-xl">
            <p className="mb-4">No cards found in your wallet.</p>
            <Button variant="outline" onClick={() => setIsModalOpen(true)}>Add your first card</Button>
          </div>
        )}
      </div>

      <AddCardModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveCard} 
      />
    </Layout>
  );
};

export default WalletPage;
