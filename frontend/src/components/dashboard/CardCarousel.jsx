import React, { useEffect, useState } from 'react';
import { Plus, ChevronRight } from 'lucide-react';
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

  const selectWallet = (index) => {
    setSelectedIndex(index);
  };

  // Get color for the active card's chevron button gradient
  const activePreset = hasWallets ? getCardDesign(wallets[selectedIndex]) : null;
  const primaryColor = activePreset?.primaryColor || '#4F2A8A';
  const secondaryColor = activePreset?.secondaryColor || '#6D4BC3';

  return (
    <div className="relative mb-2 w-full select-none">
      {/* Semicircular Carousel Wrapper */}
      <div className="relative mx-auto flex h-[270px] w-full items-center justify-between overflow-hidden px-1 sm:h-[285px]">
        
        {/* Left side: Card Fan Stack along a vertical arc */}
        <div className="relative w-[82%] h-full flex items-center justify-center">
          {hasWallets ? (
            wallets.map((wallet, idx) => {
              // Calculate offset relative to selected card (with wrap-around index calculation)
              let diff = idx - selectedIndex;
              // Make sure diff is within the closest distance
              if (diff < -totalCards / 2) diff += totalCards;
              if (diff > totalCards / 2) diff -= totalCards;

              const isSelected = idx === selectedIndex;
              const absDiff = Math.abs(diff);

              // Don't render cards that are too far out of view
              if (absDiff > 2 && totalCards > 3) return null;

              // Calculate 3D transforms for the semicircular arc
              const translateY = diff * 132; // Increased spacing
              const translateX = -absDiff * 48; // Pushed further left to separate wider cards
              const rotate = diff * 8; // Curved rotation
              const scale = isSelected ? 1 : 0.82 - absDiff * 0.05; // Scaled down background cards
              const opacity = isSelected ? 1 : 0.35; // Lowered background opacity

              return (
                <div
                  key={wallet.id || `${wallet.cardNumber}-${idx}`}
                  onClick={() => selectWallet(idx)}
                  className={`absolute w-full transition-all duration-500 ease-out origin-right-center`}
                  style={{
                    transform: `translateY(${translateY}px) translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`,
                    zIndex: 50 - absDiff,
                    opacity: opacity,
                    cursor: isSelected ? 'default' : 'pointer',
                  }}
                >
                  <div className={`relative w-full rounded-2xl ${isSelected ? 'shadow-[0_16px_32px_rgba(0,0,0,0.15)]' : 'hover:scale-[1.01] transition-transform'}`}>
                    {isSelected && (
                      <div className="absolute right-4 top-4 z-10 rounded-full bg-primary/95 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-white shadow-sm">
                        Active
                      </div>
                    )}
                    <WalletCard
                      wallet={wallet}
                      interactive={isSelected}
                      onAddMoney={isSelected ? onAddMoney : undefined}
                      compact={!isSelected}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex h-[180px] w-full items-center justify-center rounded-2xl border-2 border-dashed border-border bg-white/60">
              <p className="text-neutral-muted">No cards found.</p>
            </div>
          )}
        </div>

        {/* Right side: Interactive Colored Dot Arc */}
        <div className="relative w-[18%] h-full flex flex-col justify-center items-center">
          {hasWallets && totalCards > 0 && (
            <div className="relative flex h-[220px] w-full flex-col items-center justify-center">
              {/* SVG Arc track background */}
              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 220">
                <path
                  d="M 10 5 Q 55 110 10 215"
                  fill="none"
                  stroke="rgba(0, 0, 0, 0.03)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              </svg>

              {/* Dots placed along the arc */}
              {wallets.map((wallet, idx) => {
                let diff = idx - selectedIndex;
                if (diff < -totalCards / 2) diff += totalCards;
                if (diff > totalCards / 2) diff -= totalCards;

                const isSelected = idx === selectedIndex;
                const absDiff = Math.abs(diff);

                // Math for layout placement along the Q 55 130 arc
                // Normalized t value between 0 (top) and 1 (bottom)
                const t = 0.5 + (diff / Math.max(totalCards, 3)) * 0.7;
                // Bezier quadratic formula: B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
                const y = (1 - t) * (1 - t) * 5 + 2 * (1 - t) * t * 110 + t * t * 215;
                const x = (1 - t) * (1 - t) * 10 + 2 * (1 - t) * t * 48 + t * t * 10;

                const preset = getCardDesign(wallet);

                if (isSelected) {
                  return (
                    <button
                      key={`dot-${idx}`}
                      type="button"
                      onClick={handleNext}
                      className="absolute z-30 flex h-9 w-9 scale-110 cursor-pointer items-center justify-center rounded-full text-white shadow-lg transition-all duration-500 hover:scale-115 focus:outline-none"
                      style={{
                        left: `${x - 18}px`,
                        top: `${y - 18}px`,
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                        boxShadow: `0 8px 16px ${primaryColor}40`
                      }}
                      title="Next Card"
                    >
                      <ChevronRight size={20} className="animate-pulse" />
                    </button>
                  );
                }

                // Standard colored indicator dot
                return (
                  <button
                    key={`dot-${idx}`}
                    type="button"
                    onClick={() => selectWallet(idx)}
                    className="absolute z-20 h-3 w-3 cursor-pointer rounded-full border border-white shadow-sm transition-all duration-300 hover:scale-125 focus:outline-none"
                    style={{
                      left: `${x - 6}px`,
                      top: `${y - 6}px`,
                      backgroundColor: preset.primaryColor || '#CCC',
                      opacity: absDiff > 2 ? 0.25 : 0.65
                    }}
                    title={wallet.bankName || 'Wallet'}
                  />
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Bottom controls */}
      <div className="flex flex-col items-center gap-4 mt-2">
        {hasWallets && totalCards > 1 && (
          <p className="text-center text-[10px] text-neutral-muted">
            Tap a card or click the arrow button to spin the card wheel.
          </p>
        )}
      </div>
    </div>
  );
};

export default CardCarousel;
