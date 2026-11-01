import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import WalletCard from './WalletCard';

const CardCarousel = ({ wallets, onAddCard, onAddMoney, onPayCreditCard, onSelectionChange }) => {
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
  const primaryColor = '#C5F542';

  if (!hasWallets) {
    return (
      <div className="flex h-[220px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#3A3F2B] bg-[#10120C] p-6 text-center">
        <p className="text-sm font-medium text-[#929684]">No payment cards yet.</p>
        <button
          type="button"
          onClick={onAddCard}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#C5F542] px-4 py-2 text-xs font-semibold text-[#0B0D09] transition hover:bg-[#D5FF59]"
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
            onPayCreditCard={onPayCreditCard}
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
              className="absolute left-0 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#292D20] bg-[#10120C]/95 text-[#F4F5ED] transition-all hover:scale-110 hover:border-[#C5F542]/50 hover:text-[#C5F542] focus:outline-none"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next card"
              className="absolute right-0 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#292D20] bg-[#10120C]/95 text-[#F4F5ED] transition-all hover:scale-110 hover:border-[#C5F542]/50 hover:text-[#C5F542] focus:outline-none"
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
                    : 'w-2 bg-[#3A3F2B] hover:bg-[#929684]'
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
