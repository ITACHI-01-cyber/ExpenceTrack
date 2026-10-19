import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import WalletCard from './WalletCard';
import { getCardDesign } from '../../utils/cardDesigns';

const CardCarousel = ({ wallets, onAddCard, onAddMoney, onSelectionChange }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const hasWallets = Array.isArray(wallets) && wallets.length > 0;
  const totalCards = hasWallets ? wallets.length : 0;

  useEffect(() => {
    if (!hasWallets) {
      setSelectedIndex(0);
      return;
    }
    if (selectedIndex >= wallets.length) {
      setSelectedIndex(0);
    }
  }, [hasWallets, selectedIndex, wallets]);

  useEffect(() => {
    onSelectionChange?.(hasWallets ? wallets[selectedIndex] : null);
  }, [hasWallets, onSelectionChange, selectedIndex, wallets]);

  const handleNext = () => {
    if (totalCards > 1) {
      setSelectedIndex((prev) => (prev + 1) % totalCards);
    }
  };

  const handlePrev = () => {
    if (totalCards > 1) {
      setSelectedIndex((prev) => (prev - 1 + totalCards) % totalCards);
    }
  };

  const activeWallet = hasWallets ? wallets[selectedIndex] : null;
  const activePreset = activeWallet ? getCardDesign(activeWallet) : null;
  const primaryColor = activePreset?.primaryColor || '#6936F5';

  if (!hasWallets) {
    return (
      <div className="flex h-[220px] w-full flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[#DDD7EE] bg-white/70 p-6 text-center">
        <p className="text-sm font-medium text-neutral-muted">No payment cards yet.</p>
        <button
          type="button"
          onClick={onAddCard}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#6936F5] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#5b2ee0]"
        >
          <Plus size={15} /> Add Card
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex w-full flex-col items-center justify-center select-none">
      {/* Active Card Container - Natural floating card without outer borders or ghost boxes */}
      <div className="relative w-full flex items-center justify-center py-1">
        <div className="w-full flex justify-center transition-all duration-300 ease-out">
          <WalletCard
            wallet={activeWallet}
            interactive={true}
            onAddMoney={onAddMoney}
            compact={false}
          />
        </div>

        {/* Floating Prev/Next arrows if multiple cards exist */}
        {totalCards > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous card"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:bg-white focus:outline-none"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next card"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:bg-white focus:outline-none"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* Pagination dots if multiple cards exist */}
      {totalCards > 1 && (
        <div className="mt-2.5 flex items-center justify-center gap-1.5">
          {wallets.map((wallet, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={wallet.id || `dot-${idx}`}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                aria-label={`Select card ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isSelected
                    ? 'w-6 bg-[#6936F5]'
                    : 'w-2 bg-[#D4CEE8] hover:bg-[#B8AED8]'
                }`}
                style={isSelected ? { backgroundColor: primaryColor } : {}}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CardCarousel;
