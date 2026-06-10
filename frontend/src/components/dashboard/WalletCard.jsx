import React, { useState } from 'react';
import { Eye, EyeOff, Pencil, Plus, QrCode, ScanLine, Trash2, Wifi } from 'lucide-react';
import AnimatedNumber from '../ui/AnimatedNumber';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCardBackground, getCardCoverStyle } from '../../utils/cardDesigns';

const CardBrand = ({ brand, cardType }) => {
  const normalizedBrand = (brand || cardType).toLowerCase();

  if (normalizedBrand.includes('master')) {
    return (
      <div className="flex -space-x-2" aria-label="Mastercard">
        <div className="h-7 w-7 rounded-full bg-red-500/95" />
        <div className="h-7 w-7 rounded-full bg-yellow-400/95 mix-blend-screen" />
      </div>
    );
  }

  return (
    <div className="text-right leading-none">
      <div className="text-xl font-black italic tracking-tight">
        {cardType === 'upi' ? 'UPI' : (brand || 'VISA').toUpperCase()}
      </div>
      {cardType !== 'upi' && (
        <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.2em]">
          {cardType}
        </div>
      )}
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
  removing = false
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
  } = wallet;

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
    <div className="relative w-full pt-2">
      <div
        className={`relative z-0 mx-4 h-[190px] overflow-hidden px-5 pb-16 pt-5 shadow-lg transition-transform duration-300 sm:mx-6 ${isUpi ? 'rounded-[30px]' : 'rounded-[22px]'}`}
        style={getCardBackground(wallet)}
      >
        <div className="absolute -right-10 -top-14 h-40 w-40 rounded-full border-[24px] border-white/10" />
        <div className="absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-white/10 blur-xl" />

        {isUpi ? (
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-70">UPI payment pass</p>
                <p className="mt-1 max-w-[180px] truncate text-lg font-bold">{bankName || 'UPI'}</p>
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/18 backdrop-blur">
                <QrCode size={25} />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/18 text-lg font-bold uppercase">
                {(cardHolderName || 'U').charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{cardHolderName}</p>
                <p className="mt-0.5 truncate font-mono text-xs opacity-75">{displayId || 'name@bank'}</p>
              </div>
            </div>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider">
              <ScanLine size={14} />
              Scan and pay ready
            </div>
          </div>
        ) : isCash ? (
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-70">Cash Account</p>
                <p className="mt-1 max-w-[180px] truncate text-lg font-bold">{bankName || 'Cash'}</p>
              </div>
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/18 backdrop-blur text-2xl">
                💵
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/18 text-lg font-bold uppercase">
                {String((cardHolderName || 'C').charAt(0))}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{cardHolderName}</p>
                <p className="mt-0.5 truncate font-mono text-xs opacity-75">Direct balance</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="max-w-[190px] truncate text-xs font-bold uppercase tracking-[0.16em] opacity-80">
                  {bankName || cardType}
                </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="grid h-7 w-10 place-items-center rounded-md bg-yellow-200/90 shadow-inner">
                  <div className="h-5 w-7 rounded border border-yellow-700/30" />
                </div>
                <Wifi size={19} className="rotate-90 opacity-75" />
              </div>
              </div>
              <CardBrand brand={cardBrand} cardType={cardType} />
            </div>

            <div className="relative z-10 mt-5">
                {!isCash && (
                  <p className="font-mono text-[15px] font-semibold tracking-[0.14em] drop-shadow-sm sm:text-base">
                    {displayId || '•••• •••• •••• ••••'}
                  </p>
                )}
              <div className="mt-3 flex items-end justify-between gap-4 text-[10px] font-semibold uppercase tracking-[0.12em] opacity-80">
                {!isCash ? (
                  <>
                    <div className="min-w-0">
                      <p className="mb-0.5 text-[8px] opacity-70">Card holder</p>
                      <p className="truncate">{cardHolderName}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="mb-0.5 text-[8px] opacity-70">Valid thru</p>
                      <p>{expiryDate || 'MM/YY'}</p>
                    </div>
                  </>
                ) : (
                  <div className="min-w-0">
                    <p className="mb-0.5 text-[8px] opacity-70">Account</p>
                    <p className="truncate">Cash</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div
        className="relative z-10 min-h-[176px] overflow-hidden rounded-[26px] border p-5 shadow-[0_18px_40px_rgba(15,23,42,0.2)]"
        style={{ ...getCardCoverStyle(wallet), marginTop: '-62px' }}
      >
        <div
          className="pointer-events-none absolute -top-5 left-[-5%] h-12 w-[110%] rounded-[50%] border-t border-white/30 bg-white/10"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-x-5 bottom-3 top-3 rounded-[20px] border border-dashed border-current opacity-20" />

        <div className="relative z-10 pt-5">
          <p className="text-xs font-medium opacity-70">{isUpi ? 'UPI balance' : 'Total balance'}</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight tabular-nums sm:text-[28px]">
            <AnimatedNumber value={balance} formatter={formatCurrency} />
          </h2>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {interactive ? (
              <>
                <button
                  type="button"
                  onClick={() => onAddMoney?.(wallet)}
                  disabled={!onAddMoney}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-current/20 bg-white/12 px-4 text-sm font-semibold backdrop-blur transition hover:bg-white/20"
                >
                  <Plus size={17} />
                  Add balance
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDetails((current) => !current)}
                    className="grid h-10 w-10 place-items-center rounded-full border border-current/20 bg-white/12 transition hover:bg-white/20"
                    aria-label={showDetails ? 'Hide card number' : 'Show card number'}
                    title={showDetails ? 'Hide card number' : 'Show card number'}
                  >
                    {showDetails ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(wallet)}
                      className="grid h-10 w-10 place-items-center rounded-full border border-current/20 bg-white/12 transition hover:bg-white/20"
                      aria-label="Edit card"
                      title="Edit card"
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                  {onRemove && (
                    <button
                      type="button"
                      onClick={() => onRemove(wallet)}
                      disabled={removing}
                      className="grid h-10 w-10 place-items-center rounded-full border border-current/20 bg-white/12 transition hover:bg-red-500/30 disabled:opacity-50"
                      aria-label="Remove card"
                      title="Remove card"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </>
            ) : onAddMoney ? (
              <button
                type="button"
                onClick={() => onAddMoney(wallet)}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-current/20 bg-white/12 px-4 text-sm font-semibold transition hover:bg-white/20"
              >
                <Plus size={17} />
                Add balance
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletCard;
