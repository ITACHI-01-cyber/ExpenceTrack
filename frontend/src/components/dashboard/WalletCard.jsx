import React, { useState } from 'react';
import AnimatedNumber from '../ui/AnimatedNumber';
import { formatCurrency } from '../../utils/formatCurrency';

const WalletCard = ({ wallet, onSwipe }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Extract variables
  const { 
    balance = 0, 
    cardNumber = '', 
    cardType = 'debit', 
    cardHolderName = 'CARDHOLDER',
    expiryDate = 'MM/YY',
    bankName = ''
  } = wallet;

  // Determine card design based on type
  let bgClass = 'bg-gradient-to-tr from-neutral-800 to-black'; // Default dark
  let logo = null;
  let typeLabel = cardType.toUpperCase();

  if (cardType.toLowerCase() === 'credit') {
    bgClass = 'bg-gradient-to-tr from-indigo-700 to-purple-900';
    logo = <div className="text-white/80 font-bold italic text-lg tracking-widest">CREDIT</div>;
  } else if (cardType.toLowerCase() === 'debit') {
    bgClass = 'bg-gradient-to-tr from-emerald-600 to-teal-900';
    logo = <div className="text-white/80 font-bold italic text-lg tracking-widest">DEBIT</div>;
  } else if (cardType.toLowerCase() === 'upi') {
    bgClass = 'bg-gradient-to-tr from-blue-600 to-cyan-800';
    logo = <div className="text-white/90 font-black italic text-xl tracking-tighter">UPI</div>;
  } else if (cardType.toLowerCase() === 'personal') {
    bgClass = 'bg-gradient-to-tr from-rose-600 to-pink-900';
    logo = <div className="text-white/80 font-bold text-lg tracking-widest">INFO</div>;
  } else {
    // mastercard / visa fallback
    if (cardType.toLowerCase().includes('master')) {
      logo = (
        <div className="flex -space-x-2">
          <div className="w-6 h-6 rounded-full bg-red-500 opacity-80 mix-blend-screen"></div>
          <div className="w-6 h-6 rounded-full bg-yellow-500 opacity-80 mix-blend-screen"></div>
        </div>
      );
    } else if (cardType.toLowerCase().includes('visa')) {
      logo = <div className="text-white font-bold italic text-xl">VISA</div>;
    }
  }

  // Format card number securely for display
  const isUpi = cardType.toLowerCase() === 'upi';
  const displayId = isUpi 
    ? cardNumber 
    : (showDetails ? cardNumber : `**** **** **** ${cardNumber.slice(-4)}`);

  return (
    <div 
      className={`relative w-full max-w-[340px] min-w-[300px] sm:min-w-[340px] h-[210px] rounded-2xl p-6 text-white overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-2 snap-center cursor-pointer ${bgClass}`}
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* Abstract background shapes */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3"></div>
      
      {/* Top row */}
      <div className="relative z-10 flex justify-between items-start mb-6">
        <div>
          <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">{bankName || typeLabel}</p>
          <div className="flex items-center gap-2">
            {!isUpi && (
              <div className="w-8 h-6 bg-yellow-200/80 rounded flex items-center justify-center opacity-80">
                <div className="w-6 h-4 border border-yellow-600/30 rounded-sm"></div>
              </div>
            )}
            {isUpi && <div className="text-xs bg-white/20 px-2 py-0.5 rounded">UPI ID</div>}
          </div>
        </div>
        {logo}
      </div>

      {/* Balance */}
      <div className="relative z-10 mb-4">
        <p className="text-white/60 text-xs font-medium mb-1">Available balance</p>
        <h2 className="text-2xl font-bold tracking-tight tabular-nums">
          <AnimatedNumber value={balance} formatter={formatCurrency} />
        </h2>
      </div>

      {/* Bottom info */}
      <div className="relative z-10 flex justify-between items-end mt-auto">
        <div>
          <p className="font-mono text-lg tracking-widest text-white/90 drop-shadow-sm mb-2">{displayId || '**** **** **** ****'}</p>
          <div className="flex justify-between items-center w-full max-w-[200px] text-xs text-white/70">
            <div className="uppercase tracking-wider font-medium truncate max-w-[120px]">{cardHolderName}</div>
            {!isUpi && <div className="font-medium">{expiryDate}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletCard;
