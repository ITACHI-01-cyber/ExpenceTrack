import React, { useState } from 'react';
import { Eye, EyeOff, Pencil, Plus, QrCode, ScanLine, Trash2, Wifi } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCardBackground } from '../../utils/cardDesigns';

const CardBrand = ({ brand, cardType }) => {
  const normalizedBrand = (brand || cardType).toLowerCase();

  if (normalizedBrand.includes('master')) {
    return (
      <div className="flex -space-x-2" aria-label="Mastercard">
        <div className="h-6 w-6 rounded-full bg-red-500/95" />
        <div className="h-6 w-6 rounded-full bg-yellow-400/95 mix-blend-screen" />
      </div>
    );
  }

  return (
    <div className="text-right leading-none">
      <div className="text-base font-black italic tracking-tight">
        {cardType === 'upi' ? 'UPI' : (brand || 'VISA').toUpperCase()}
      </div>
    </div>
  );
};

const WalletCard = ({
  wallet,
  interactive = true,
  preview = false,
  onAddMoney,
  onEdit,
  onRemove,
  removing = false,
  compact = false
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const {
    balance = 0,
    cardNumber = '',
    cardType = 'debit',
    cardHolderName = 'CARDHOLDER',
    expiryDate = 'MM/YY',
    bankName = '',
    cardBrand = ''
  } = wallet || {};

  const isUpi = cardType.toLowerCase() === 'upi';
  const isCash = cardType.toLowerCase() === 'cash';
  const detailsVisible = showDetails || preview;
  const safeNumber = String(cardNumber || '');
  const displayId = isCash
    ? ''
    : isUpi
    ? safeNumber
    : detailsVisible
    ? safeNumber
    : `•••• •••• •••• ${safeNumber.slice(-4)}`;

  return (
    <div className="relative w-full flex flex-col gap-3">
      {/* ATM Card Plate */}
      <div
        className={`relative z-0 mx-auto w-full max-w-[350px] sm:max-w-[390px] h-[215px] overflow-hidden px-5 py-5 shadow-md transition-all duration-300 ${isUpi ? 'rounded-[28px]' : 'rounded-[20px]'}`}
        style={getCardBackground(wallet)}
      >
        {/* Card shine overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />
        
        {/* Chip and contactless icon */}
        {!isCash && !isUpi && (
          <div className="absolute left-5 top-[76px] z-10 flex items-center gap-2">
            <div className="grid h-6 w-8 place-items-center rounded bg-yellow-200/90 shadow-inner">
              <div className="h-4.5 w-6 rounded border border-yellow-700/30" />
            </div>
            <Wifi size={15} className="rotate-90 opacity-70 text-white" />
          </div>
        )}

        {isUpi && (
          <div className="absolute right-5 bottom-[68px] z-10 opacity-20">
            <QrCode size={45} className="text-white" />
          </div>
        )}

        {/* Card Content Grid */}
        <div className="relative z-10 h-full flex flex-col justify-between text-white text-left">
          {/* Top Row: Bank name / Card type */}
          <div className="flex justify-between items-start">
            <div className="min-w-0 pr-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-80 truncate">
                {bankName || cardType}
              </p>
              <p className="text-[10px] font-medium opacity-65 capitalize">
                {isCash ? 'Cash Account' : isUpi ? 'UPI Payment' : `${cardType} Card`}
              </p>
            </div>
            <CardBrand brand={cardBrand} cardType={cardType} />
          </div>

          {/* Middle Row: Card Number / ID */}
          <div className="my-1">
            {!isCash && (
              <p className="font-mono text-base font-semibold tracking-[0.14em] drop-shadow-sm">
                {displayId || '•••• •••• •••• ••••'}
              </p>
            )}
          </div>

          {/* Bottom Row: Holder, Expiry & Balance */}
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[7.5px] uppercase tracking-wider opacity-60">Card Holder</p>
              <p className="text-[11px] font-bold uppercase tracking-wide truncate max-w-[120px]">
                {cardHolderName || 'NAME'}
              </p>
            </div>
            {!isUpi && !isCash && (
              <div className="shrink-0 text-center">
                <p className="text-[7.5px] uppercase tracking-wider opacity-60">Expiry</p>
                <p className="text-[11px] font-bold">{expiryDate || 'MM/YY'}</p>
              </div>
            )}
            <div className="text-right shrink-0">
              <p className="text-[7.5px] uppercase tracking-wider opacity-60">Balance</p>
              <p className="text-base font-black tabular-nums tracking-wide">
                {detailsVisible ? formatCurrency(balance) : '₹••••'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Actions Row (displayed only below the selected card) */}
      {interactive && !compact && (
        <div className="mx-auto w-full max-w-[350px] sm:max-w-[390px] flex items-center justify-between gap-2 px-1">
          <button
            type="button"
            onClick={() => onAddMoney?.(wallet)}
            className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-white text-xs font-bold text-primary hover:bg-primary-glow shadow-sm transition-all"
          >
            <Plus size={14} /> Add balance
          </button>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-white text-neutral-muted hover:text-primary shadow-sm transition-all"
              title={showDetails ? 'Hide details' : 'Show details'}
            >
              {showDetails ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(wallet)}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-white text-neutral-muted hover:text-primary shadow-sm transition-all"
                title="Edit card"
              >
                <Pencil size={14} />
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(wallet)}
                disabled={removing}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-danger/20 bg-red-50/10 text-danger hover:bg-red-500/20 shadow-sm transition-all disabled:opacity-50"
                title="Remove card"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletCard;
