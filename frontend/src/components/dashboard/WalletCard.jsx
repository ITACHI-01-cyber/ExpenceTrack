import React, { useState, useRef, useCallback } from 'react';
import { Eye, EyeOff, Pencil, Plus, Trash2, Wifi, Zap, RotateCcw } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCardBackground } from '../../utils/cardDesigns';
import { CardIconRenderer } from '../../utils/cardIcons';

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

/* ── DC Superhero Card Emblems ────────────────────────── */
const SupermanShield = ({ size = 88, className = '' }) => (
  <svg width={size} height={size * 0.85} viewBox="0 0 100 85" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.45))' }}>
    <path d="M50 2L94 18L84 64L50 83L16 64L6 18L50 2Z" fill="#E61E25" stroke="#FFD700" strokeWidth="5.5" strokeLinejoin="round" />
    <path d="M50 9L86 22L78 59L50 75L22 59L14 22L50 9Z" fill="#FFD700" />
    <path d="M50 14C43 14 30 20 22 28L28 36C34 32 44 26 50 26C58 26 62 30 62 36C62 48 24 44 24 62C24 74 38 78 50 78C58 78 70 72 78 64L72 56C66 60 58 66 50 66C42 66 38 62 38 56C38 46 76 48 76 32C76 20 62 14 50 14Z" fill="#E61E25" />
  </svg>
);

const WonderWomanLogo = ({ size = 110, className = '' }) => (
  <svg width={size} height={size * 0.42} viewBox="0 0 120 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.45))' }}>
    <path d="M2 5L28 5L46 32L60 10L74 32L92 5L118 5L90 45L74 45L60 25L46 45L30 45L2 5Z" fill="#FFD700" stroke="#8A5A00" strokeWidth="3" strokeLinejoin="round" />
    <path d="M16 14L32 14L46 34L54 14L66 14L74 34L88 14L104 14L86 38L74 38L60 20L46 38L34 38L16 14Z" fill="#FFF099" opacity="0.9" />
  </svg>
);

const BatmanLogo = ({ size = 110, className = '' }) => (
  <svg width={size} height={size * 0.5} viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.55))' }}>
    <path d="M50 5C48 9 46 12 45 14C38 12 30 10 20 18C24 20 28 20 31 22C20 24 10 20 2 35C12 37 25 33 34 29C34 33 29 41 50 45C71 41 66 33 66 29C75 33 88 37 98 35C90 20 80 24 69 22C72 20 76 20 80 18C70 10 62 12 55 14C54 12 52 9 50 5Z" fill="url(#batGrad2)" stroke="#444" strokeWidth="1.5" strokeLinejoin="round" />
    <defs>
      <linearGradient id="batGrad2" x1="0" y1="0" x2="100" y2="50" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#e5e7eb" />
        <stop offset="50%" stopColor="#9ca3af" />
        <stop offset="100%" stopColor="#4b5563" />
      </linearGradient>
    </defs>
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
  const [isFlipped, setIsFlipped] = useState(false);
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

  const handleFlip = useCallback(() => {
    if (!compact) setIsFlipped((f) => !f);
  }, [compact]);

  /* Shared card dimensions & border-radius */
  const cardRadius = isUpi ? '28px' : '22px';

  /* Tilt transform (no flip — flip is handled by the wrapper) */
  const tiltTransform = (!compact && !preview && isHovered && !isFlipped)
    ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.025,1.025,1.025)`
    : '';

  /* Back-side helper: mask last-4 or show full number */
  const backNumber = safeNumber || '•••• •••• •••• ••••';

  return (
    <div className="w-full flex flex-col items-center">

      {/* ── 3D Flip Container ── */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        onClick={handleFlip}
        className="relative w-full max-w-[350px] sm:max-w-[390px] h-[190px] sm:h-[220px]"
        style={{
          perspective: '1200px',
          cursor: (!compact) ? 'pointer' : 'default',
        }}
      >
        <div
          className="relative w-full h-full"
          style={{
            transformStyle: 'preserve-3d',
            transform: `${isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'} ${tiltTransform}`,
            transition: isFlipped
              ? 'transform 0.65s cubic-bezier(0.23, 1, 0.32, 1)'
              : isHovered
              ? 'transform 0.08s ease-out'
              : 'transform 0.55s cubic-bezier(0.23, 1, 0.32, 1)',
            willChange: 'transform',
          }}
        >

          {/* ═══════════════  FRONT FACE  ═══════════════ */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(0deg)',
              borderRadius: cardRadius,
              boxShadow: isHovered
                ? '0 28px 60px rgba(0,0,0,0.35), 0 8px 20px rgba(0,0,0,0.18)'
                : '0 10px 30px rgba(0,0,0,0.16), 0 4px 8px rgba(0,0,0,0.08)',
            }}
          >
            <div
              className="w-full h-full overflow-hidden px-5 py-5 select-none"
              style={{
                ...getCardBackground(wallet),
                borderRadius: cardRadius,
              }}
            >
              {/* Animated shimmer sweep */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.13) 50%, rgba(255,255,255,0) 70%)',
                  backgroundSize: '200% 200%',
                  animation: 'cardShine 4s ease-in-out infinite',
                  borderRadius: cardRadius,
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

                {/* Top Row — Bank name + Logo Icon + Brand */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* DC Logo if it is a DC preset */}
                    {wallet?.designPreset?.startsWith('dc-') && (
                      <div className="shrink-0 text-white opacity-95">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="inline-block">
                          <circle cx="12" cy="12" r="10.5" />
                          <text x="12" y="15.5" fontSize="8" fontWeight="900" textAnchor="middle" fill="currentColor" fontFamily="sans-serif">DC</text>
                        </svg>
                      </div>
                    )}
                    {/* Card Logo Icon — prominent, inline with bank name */}
                    {wallet?.cardIcon && wallet.cardIcon !== 'none' && (
                      <div
                        className="shrink-0"
                        style={{
                          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))',
                        }}
                      >
                        <CardIconRenderer iconId={wallet.cardIcon} size={36} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-85 truncate">
                        {bankName || cardType}
                      </p>
                      <p className="text-[9.5px] font-medium opacity-60 capitalize mt-0.5">
                        {isCash ? 'Cash Account' : isUpi ? 'UPI Payment' : `${cardType} Card`}
                      </p>
                    </div>
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

              {/* Flip hint */}
              {!compact && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                     style={{ opacity: isHovered ? 0.45 : 0, transition: 'opacity 0.3s' }}>
                  <span className="text-[8px] text-white font-semibold uppercase tracking-widest bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    Click to flip
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════  BACK FACE  ═══════════════ */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              borderRadius: cardRadius,
              boxShadow: isHovered
                ? '0 28px 60px rgba(0,0,0,0.35), 0 8px 20px rgba(0,0,0,0.18)'
                : '0 10px 30px rgba(0,0,0,0.16), 0 4px 8px rgba(0,0,0,0.08)',
            }}
          >
            <div
              className="w-full h-full overflow-hidden select-none"
              style={{
                ...getCardBackground(wallet),
                borderRadius: cardRadius,
              }}
            >
              {/* Darker overlay for back side */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.06) 100%)',
                  borderRadius: cardRadius,
                }}
              />

              {/* Magnetic Stripe */}
              <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                  top: '18px',
                  height: '38px',
                  background: 'linear-gradient(180deg, #111 0%, #2a2a2a 30%, #222 60%, #111 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
              />

              {/* Back Content */}
              <div className="relative z-10 h-full flex flex-col text-white text-left" style={{ paddingTop: '68px', paddingLeft: '20px', paddingRight: '20px', paddingBottom: '16px' }}>

                {/* Back Contact Info / Disclaimer */}
                <div className="text-[7px] opacity-75 truncate mb-1" title={wallet?.backContactInfo || "support@bank.com | 1-800-555-0199"}>
                  {wallet?.backContactInfo || "support@bank.com | 1-800-555-0199"}
                </div>

                {/* Signature Strip + CVV area */}
                <div className="flex items-stretch gap-2.5 mb-3">
                  {/* Signature strip */}
                  <div
                    className="flex-1 rounded-md px-3 flex items-center overflow-hidden"
                    style={{
                      background: 'repeating-linear-gradient(90deg, #e8e4dc 0px, #f0ece4 2px, #e2ded6 4px)',
                      minHeight: '30px',
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
                    }}
                  >
                    <p
                      className="text-[8.5px] italic text-gray-500/85 font-medium truncate"
                      style={{ fontFamily: 'cursive, serif' }}
                      title={wallet?.backSignatureText || "Not Valid without Authorized Signature"}
                    >
                      {wallet?.backSignatureText || "Not Valid without Authorized Signature"}
                    </p>
                  </div>
                  {/* CVV box */}
                  {!isUpi && !isCash && (
                    <div
                      className="flex items-center justify-center rounded-md px-3 shrink-0"
                      style={{
                        background: '#f5f1ea',
                        minWidth: '46px',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.08)',
                      }}
                    >
                      <p className="text-[13px] font-black text-gray-800 tracking-[0.2em] font-mono">
                        •••
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Icon on back */}
                {wallet?.cardIcon && wallet.cardIcon !== 'none' && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <div style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.3))' }}>
                      <CardIconRenderer iconId={wallet.cardIcon} size={26} />
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-wider opacity-70">
                      {bankName || cardType}
                    </span>
                  </div>
                )}

                {/* Cardholder & Number */}
                <div className="mt-auto">
                  <p className="text-[10px] font-bold uppercase tracking-wide opacity-90 mb-0.5">
                    {cardHolderName || 'CARDHOLDER'}
                  </p>
                  {!isCash && (
                    <p
                      className="font-mono font-bold tracking-[0.14em] drop-shadow-sm"
                      style={{ fontSize: isUpi ? '10px' : '14px' }}
                    >
                      {backNumber}
                    </p>
                  )}
                  {isCash && (
                    <p className="text-lg font-black tracking-tight drop-shadow">
                      {formatCurrency(balance)}
                    </p>
                  )}

                  {/* Bottom row: expiry + brand */}
                  <div className="flex items-end justify-between mt-1.5">
                    <div>
                      {!isUpi && !isCash && (
                        <div>
                          <p className="text-[6px] uppercase tracking-[0.12em] opacity-50 mb-0.5">Good Thru</p>
                          <p className="text-[12px] font-bold">{expiryDate || 'MM/YY'}</p>
                        </div>
                      )}
                    </div>
                    <CardBrand brand={cardBrand} cardType={cardType} />
                  </div>
                </div>
              </div>

              {/* Flip-back hint */}
              {!compact && !preview && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                     style={{ opacity: isHovered ? 0.45 : 0, transition: 'opacity 0.3s' }}>
                  <span className="text-[8px] text-white font-semibold uppercase tracking-widest bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    Click to flip back
                  </span>
                </div>
              )}
            </div>
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

            <button
              type="button"
              onClick={handleFlip}
              className={`w-10 h-10 flex items-center justify-center rounded-xl border shadow-sm transition-all duration-200 active:scale-90 ${
                isFlipped
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-white text-neutral-muted hover:text-primary hover:border-primary/30'
              }`}
              title={isFlipped ? 'Show front' : 'Show back'}
            >
              <RotateCcw size={14} />
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
