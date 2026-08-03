import React, { useState, useRef, useCallback } from 'react';
import { Eye, EyeOff, Pencil, Plus, Trash2, Wifi, Zap } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCardBackground } from '../../utils/cardDesigns';

/* ── Card Brand Logo ──────────────────────────────────── */
const CardBrand = ({ brand, cardType }) => {
  const normalizedBrand = (brand || cardType || '').toLowerCase();

  if (normalizedBrand.includes('master')) {
    return (
      <div className="flex -space-x-2.5" aria-label="Mastercard">
        <div className="h-7 w-7 rounded-full bg-red-500/95 shadow-lg" />
        <div className="h-7 w-7 rounded-full bg-yellow-400/95 mix-blend-screen shadow-lg" />
      </div>
    );
  }
  if (normalizedBrand.includes('rupay')) {
    return (
      <div className="text-right leading-none">
        <div className="text-[11px] font-black italic tracking-tight opacity-90">RuPay</div>
      </div>
    );
  }

  return (
    <div className="text-right leading-none">
      <div className="text-[13px] font-black italic tracking-tight opacity-90">
        {cardType === 'upi' ? 'UPI' : (brand || 'VISA').toUpperCase()}
      </div>
    </div>
  );
};

/* ── EMV Chip SVG ─────────────────────────────────────── */
const ChipIcon = () => (
  <svg width="36" height="28" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="0.5" y="0.5" width="35" height="27" rx="4.5" fill="url(#chipGrad)" stroke="rgba(180,150,60,0.4)" strokeWidth="1"/>
    <rect x="13" y="0.5" width="10" height="27" fill="rgba(200,170,80,0.15)"/>
    <rect x="0.5" y="9" width="35" height="10" fill="rgba(200,170,80,0.15)"/>
    <rect x="13" y="9" width="10" height="10" rx="1" fill="rgba(180,150,60,0.25)"/>
    <line x1="13" y1="0.5" x2="13" y2="27.5" stroke="rgba(180,150,60,0.3)" strokeWidth="0.75"/>
    <line x1="23" y1="0.5" x2="23" y2="27.5" stroke="rgba(180,150,60,0.3)" strokeWidth="0.75"/>
    <line x1="0.5" y1="9" x2="35.5" y2="9" stroke="rgba(180,150,60,0.3)" strokeWidth="0.75"/>
    <line x1="0.5" y1="19" x2="35.5" y2="19" stroke="rgba(180,150,60,0.3)" strokeWidth="0.75"/>
    <defs>
      <linearGradient id="chipGrad" x1="0" y1="0" x2="36" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#e8c97e"/>
        <stop offset="50%" stopColor="#f5e0a0"/>
        <stop offset="100%" stopColor="#c9a84c"/>
      </linearGradient>
    </defs>
  </svg>
);

/* ── UPI QR decoration ────────────────────────────────── */
const UpiQrDecor = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-[0.18]" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="2" stroke="white" strokeWidth="2.5"/>
    <rect x="6" y="6" width="12" height="12" rx="1" fill="white"/>
    <rect x="30" y="2" width="20" height="20" rx="2" stroke="white" strokeWidth="2.5"/>
    <rect x="34" y="6" width="12" height="12" rx="1" fill="white"/>
    <rect x="2" y="30" width="20" height="20" rx="2" stroke="white" strokeWidth="2.5"/>
    <rect x="6" y="34" width="12" height="12" rx="1" fill="white"/>
    <rect x="30" y="30" width="4" height="4" rx="0.5" fill="white"/>
    <rect x="38" y="30" width="4" height="4" rx="0.5" fill="white"/>
    <rect x="30" y="38" width="4" height="4" rx="0.5" fill="white"/>
    <rect x="38" y="38" width="4" height="4" rx="0.5" fill="white"/>
    <rect x="34" y="34" width="4" height="4" rx="0.5" fill="white"/>
    <rect x="46" y="34" width="4" height="4" rx="0.5" fill="white"/>
    <rect x="30" y="46" width="4" height="4" rx="0.5" fill="white"/>
  </svg>
);

/* ── Main WalletCard Component ───────────────────────── */
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
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  const {
    balance = 0,
    cardNumber = '',
    cardType = 'debit',
    cardHolderName = 'CARDHOLDER',
    expiryDate = 'MM/YY',
    bankName = '',
    cardBrand = ''
  } = wallet || {};

  const isUpi  = cardType.toLowerCase() === 'upi';
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

  /* 3-D tilt on mouse move */
  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current || compact || preview) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width  / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: -dy * 7, y: dx * 7 });
  }, [compact, preview]);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);

  const cardTransform = (!compact && !preview && isHovered)
    ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.025,1.025,1.025)`
    : 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';

  return (
    <div className="w-full flex flex-col items-center">

      {/* ── ATM Card Plate ── */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        className={`relative w-full max-w-[350px] sm:max-w-[390px] h-[190px] sm:h-[220px] overflow-hidden px-5 py-5 select-none ${isUpi ? 'rounded-[28px]' : 'rounded-[22px]'}`}
        style={{
          ...getCardBackground(wallet),
          transform: cardTransform,
          transition: isHovered
            ? 'transform 0.08s ease-out, box-shadow 0.3s ease'
            : 'transform 0.55s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.55s ease',
          boxShadow: isHovered
            ? '0 28px 60px rgba(0,0,0,0.35), 0 8px 20px rgba(0,0,0,0.18)'
            : '0 10px 30px rgba(0,0,0,0.16), 0 4px 8px rgba(0,0,0,0.08)',
          willChange: 'transform',
        }}
      >
        {/* Animated shimmer sweep */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.13) 50%, rgba(255,255,255,0) 70%)',
            backgroundSize: '200% 200%',
            animation: 'cardShine 4s ease-in-out infinite',
          }}
        />

        {/* Top-right highlight orb */}
        <div
          className="absolute -top-10 -right-10 w-36 h-36 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)' }}
        />

        {/* EMV Chip + Contactless */}
        {!isCash && !isUpi && (
          <div className="absolute left-5 top-[72px] sm:top-[80px] z-10 flex items-center gap-2.5">
            <div className="drop-shadow-md">
              <ChipIcon />
            </div>
            <Wifi size={15} className="rotate-90 opacity-55 text-white" />
          </div>
        )}

        {/* UPI QR decoration */}
        {isUpi && (
          <div className="absolute right-5 bottom-14 z-10">
            <UpiQrDecor />
          </div>
        )}

        {/* Cash lightning icon */}
        {isCash && (
          <div className="absolute right-5 bottom-5 z-10 opacity-[0.15]">
            <Zap size={44} className="text-white" />
          </div>
        )}

        {/* ── Card Content ── */}
        <div className="relative z-10 h-full flex flex-col justify-between text-white text-left">

          {/* Top Row */}
          <div className="flex justify-between items-start">
            <div className="min-w-0 pr-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-85 truncate">
                {bankName || cardType}
              </p>
              <p className="text-[9.5px] font-medium opacity-60 capitalize mt-0.5">
                {isCash ? 'Cash Account' : isUpi ? 'UPI Payment' : `${cardType} Card`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {wallet?.status === 'active' && (
                <span className="text-[7.5px] font-bold uppercase tracking-widest bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/25">
                  ACTIVE
                </span>
              )}
              <CardBrand brand={cardBrand} cardType={cardType} />
            </div>
          </div>

          {/* Middle Row — Number / UPI ID / Cash balance */}
          <div className="my-auto pt-1">
            {!isCash && (
              <p
                className="font-mono drop-shadow-sm"
                style={{
                  fontSize: isUpi ? '11px' : '15px',
                  fontWeight: 600,
                  letterSpacing: isUpi ? '0.04em' : '0.15em'
                }}
              >
                {displayId || '•••• •••• •••• ••••'}
              </p>
            )}
            {isCash && (
              <p className="text-2xl font-black tracking-tight drop-shadow">
                {formatCurrency(balance)}
              </p>
            )}
          </div>

          {/* Bottom Row */}
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[7px] uppercase tracking-[0.12em] opacity-55 mb-0.5">Card Holder</p>
              <p className="text-[11.5px] font-bold uppercase tracking-wide truncate max-w-[130px]">
                {cardHolderName || 'NAME'}
              </p>
            </div>
            {!isUpi && !isCash && (
              <div className="shrink-0 text-center">
                <p className="text-[7px] uppercase tracking-[0.12em] opacity-55 mb-0.5">Valid Thru</p>
                <p className="text-[11.5px] font-bold">{expiryDate || 'MM/YY'}</p>
              </div>
            )}
            {!isCash && (
              <div className="text-right shrink-0">
                <p className="text-[7px] uppercase tracking-[0.12em] opacity-55 mb-0.5">Balance</p>
                <p className="text-[15px] font-black tabular-nums tracking-wide drop-shadow">
                  {detailsVisible ? formatCurrency(balance) : '₹ ••••'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Action Row ── */}
      {interactive && !compact && (
        <div
          className="w-full max-w-[350px] sm:max-w-[390px] flex items-center justify-between gap-2 mt-3"
          style={{ animation: 'fadeSlideUp 0.35s ease both' }}
        >
          <button
            type="button"
            onClick={() => onAddMoney?.(wallet)}
            className="flex-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-white text-xs font-bold text-primary hover:bg-primary hover:text-white hover:border-primary shadow-sm transition-all duration-200 active:scale-95"
          >
            <Plus size={14} />
            Add balance
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl border shadow-sm transition-all duration-200 active:scale-90 ${
                showDetails
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-white text-neutral-muted hover:text-primary hover:border-primary/30'
              }`}
              title={showDetails ? 'Hide details' : 'Show details'}
            >
              {showDetails ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(wallet)}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-border bg-white text-neutral-muted hover:text-primary hover:border-primary/30 shadow-sm transition-all duration-200 active:scale-90"
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
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-danger/20 bg-red-50 text-danger hover:bg-red-500 hover:text-white shadow-sm transition-all duration-200 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Remove card"
              >
                {removing ? (
                  <div className="w-3.5 h-3.5 border-2 border-danger/40 border-t-danger rounded-full animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletCard;
