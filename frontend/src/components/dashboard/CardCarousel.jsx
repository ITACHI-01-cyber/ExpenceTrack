import React from 'react';
import WalletCard from './WalletCard';

const CardCarousel = ({ wallets, onAddCard }) => {
  return (
    <div className="w-full mb-8 relative">
      {/* Scrollable Container */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 px-2 hide-scrollbar">
        {wallets && wallets.length > 0 ? (
          wallets.map((wallet, idx) => (
            <div key={wallet.id || idx} className="snap-center shrink-0">
              <WalletCard wallet={wallet} />
            </div>
          ))
        ) : (
          <div className="w-full flex justify-center py-8">
            <p className="text-neutral-muted">No cards found.</p>
          </div>
        )}
        
        {/* Add Card Button inside carousel */}
        {onAddCard && (
          <div 
            onClick={onAddCard}
            className="w-[340px] shrink-0 h-[210px] rounded-2xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center text-primary/70 hover:bg-primary/5 hover:border-primary/50 transition-colors cursor-pointer snap-center"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </div>
            <span className="font-medium">Add New Card</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default CardCarousel;
