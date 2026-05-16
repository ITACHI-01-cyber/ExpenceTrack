import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import WalletCard from './WalletCard';

const CardCarousel = ({ wallets, onAddCard }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const hasWallets = wallets && wallets.length > 0;
  const stackItems = hasWallets ? wallets : [];
  const visibleItems = stackItems.slice(0, 4);
  const layerOffset = 42;
  const stackHeight = hasWallets
    ? 210 + (Math.min(stackItems.length, 4) - 1) * layerOffset + 16
    : 230;

  useEffect(() => {
    if (!hasWallets) {
      setSelectedIndex(0);
      return;
    }

    if (selectedIndex >= wallets.length) {
      setSelectedIndex(0);
    }
  }, [hasWallets, selectedIndex, wallets]);

  const orderedWallets = hasWallets
    ? [...wallets.slice(selectedIndex), ...wallets.slice(0, selectedIndex)]
    : [];

  const selectWallet = (relativeIndex) => {
    if (!hasWallets || relativeIndex === 0) return;
    setSelectedIndex((selectedIndex + relativeIndex) % wallets.length);
  };

  return (
    <div className="w-full mb-10 relative">
      <div
        className="relative mx-auto w-full max-w-[340px] sm:max-w-[360px]"
        style={{ height: `${stackHeight}px` }}
      >
        {hasWallets ? (
          orderedWallets.slice(0, 4).map((wallet, idx) => {
            const isFront = idx === 0;
            const hiddenCount = Math.max(0, stackItems.length - visibleItems.length);

            return (
              <div
                key={wallet.id || `${wallet.cardNumber}-${idx}`}
                className="absolute left-0 right-0 mx-auto w-full max-w-[340px] transition-all duration-300 ease-out"
                style={{
                  top: `${idx * layerOffset}px`,
                  zIndex: 20 - idx,
                  transform: `scale(${1 - idx * 0.035})`,
                  transformOrigin: 'top center',
                  opacity: 1 - idx * 0.08,
                }}
              >
                <button
                  type="button"
                  onClick={() => selectWallet(idx)}
                  className={`block w-full text-left rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 ${
                    isFront ? 'cursor-default' : 'cursor-pointer'
                  }`}
                  aria-label={`Select ${wallet.bankName || wallet.cardType || 'wallet'} card`}
                >
                  <WalletCard wallet={wallet} />
                </button>

                {idx === 3 && hiddenCount > 0 && (
                  <div className="pointer-events-none absolute inset-x-8 -bottom-5 rounded-full bg-neutral-900/10 px-3 py-1 text-center text-xs font-medium text-neutral-muted backdrop-blur">
                    +{hiddenCount} more
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-2xl border-2 border-dashed border-border bg-white/60">
            <p className="text-neutral-muted">No cards found.</p>
          </div>
        )}

        {onAddCard && (
          <button
            type="button"
            onClick={onAddCard}
            className={`absolute left-0 right-0 mx-auto flex h-[210px] w-full max-w-[340px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-white/70 text-primary/70 transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 ${
              hasWallets ? 'scale-[0.86]' : ''
            }`}
            style={{
              top: hasWallets ? `${Math.min(stackItems.length, 4) * layerOffset}px` : '0px',
              zIndex: 1,
              transformOrigin: 'top center',
            }}
            aria-label="Add new card"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Plus size={24} />
            </div>
            <span className="font-medium">Add New Card</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default CardCarousel;
