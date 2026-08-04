import React, { useId } from 'react';

/**
 * Celestial-themed card icons — each icon uses inline SVG with gradient fills
 * and soft glow effects for that premium "Celestials" icon-pack feel.
 * Each component uses React.useId() for collision-free gradient IDs.
 */

const ICON_SIZE = 44;

/* ── Individual Icon Components ───────────────────────── */

const CrescentMoon = ({ size = ICON_SIZE, className = '' }) => {
  const uid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id={`moonG-${uid}`} x1="8" y1="6" x2="38" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <radialGradient id={`moonR-${uid}`} cx="24" cy="24" r="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill={`url(#moonR-${uid})`} />
      <path d="M30 6C22 6 14 13 14 24C14 35 22 42 30 42C20 40 16 32 16 24C16 16 20 8 30 6Z" fill={`url(#moonG-${uid})`} />
      <circle cx="33" cy="11" r="1.5" fill="#e9d5ff" opacity="0.9" />
      <circle cx="38" cy="18" r="1" fill="#ddd6fe" opacity="0.7" />
      <circle cx="36" cy="8" r="0.8" fill="#f5f3ff" opacity="0.6" />
    </svg>
  );
};

const SparkStar = ({ size = ICON_SIZE, className = '' }) => {
  const uid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id={`starG-${uid}`} x1="10" y1="4" x2="38" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <radialGradient id={`starR-${uid}`} cx="24" cy="24" r="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill={`url(#starR-${uid})`} />
      <path d="M24 4L28.5 18.5H43L31 27.5L35.5 43L24 33L12.5 43L17 27.5L5 18.5H19.5L24 4Z" fill={`url(#starG-${uid})`} />
    </svg>
  );
};

const CosmicCloud = ({ size = ICON_SIZE, className = '' }) => {
  const uid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id={`cloudG-${uid}`} x1="4" y1="12" x2="44" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="50%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
        <radialGradient id={`cloudR-${uid}`} cx="24" cy="28" r="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="28" r="20" fill={`url(#cloudR-${uid})`} />
      <ellipse cx="24" cy="30" rx="18" ry="10" fill={`url(#cloudG-${uid})`} opacity="0.9" />
      <circle cx="16" cy="24" r="9" fill={`url(#cloudG-${uid})`} />
      <circle cx="28" cy="22" r="11" fill={`url(#cloudG-${uid})`} />
      <circle cx="36" cy="27" r="7" fill={`url(#cloudG-${uid})`} />
      <circle cx="12" cy="15" r="1" fill="#e0e7ff" opacity="0.7" />
      <circle cx="38" cy="14" r="0.8" fill="#e0e7ff" opacity="0.5" />
    </svg>
  );
};

const CelestialFlame = ({ size = ICON_SIZE, className = '' }) => {
  const uid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id={`flameG-${uid}`} x1="18" y1="4" x2="30" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="40%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
        <radialGradient id={`flameR-${uid}`} cx="24" cy="30" r="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="30" r="18" fill={`url(#flameR-${uid})`} />
      <path d="M24 4C24 4 32 16 32 26C32 32 28.5 38 24 42C19.5 38 16 32 16 26C16 16 24 4 24 4Z" fill={`url(#flameG-${uid})`} />
      <path d="M24 18C24 18 28 24 28 28C28 31 26.5 34 24 36C21.5 34 20 31 20 28C20 24 24 18 24 18Z" fill="#fef3c7" opacity="0.7" />
    </svg>
  );
};

const AuroraWave = ({ size = ICON_SIZE, className = '' }) => {
  const uid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id={`waveG-${uid}`} x1="4" y1="16" x2="44" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
        <radialGradient id={`waveR-${uid}`} cx="24" cy="24" r="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="20" fill={`url(#waveR-${uid})`} />
      <path d="M4 28C8 22 14 18 20 22C26 26 32 18 38 20C42 21 44 24 44 24" stroke={`url(#waveG-${uid})`} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M4 34C10 28 16 26 22 30C28 34 34 24 40 26C43 27 44 30 44 30" stroke={`url(#waveG-${uid})`} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M4 22C8 18 14 14 18 16C22 18 28 12 34 14C38 15 44 18 44 18" stroke={`url(#waveG-${uid})`} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3" />
    </svg>
  );
};

const NebulaDiamond = ({ size = ICON_SIZE, className = '' }) => {
  const uid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id={`diamG-${uid}`} x1="14" y1="4" x2="34" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="50%" stopColor="#e879f9" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
        <radialGradient id={`diamR-${uid}`} cx="24" cy="24" r="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e879f9" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#e879f9" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="20" fill={`url(#diamR-${uid})`} />
      <path d="M24 4L34 18L44 24L34 30L24 44L14 30L4 24L14 18L24 4Z" fill={`url(#diamG-${uid})`} />
      <path d="M24 12L30 20L36 24L30 28L24 36L18 28L12 24L18 20L24 12Z" fill="white" opacity="0.15" />
    </svg>
  );
};

const SunBurst = ({ size = ICON_SIZE, className = '' }) => {
  const uid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id={`sunG-${uid}`} cx="24" cy="24" r="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="60%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
        <radialGradient id={`sunR-${uid}`} cx="24" cy="24" r="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill={`url(#sunR-${uid})`} />
      <circle cx="24" cy="24" r="10" fill={`url(#sunG-${uid})`} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={angle}
          x1={24 + 13 * Math.cos((angle * Math.PI) / 180)}
          y1={24 + 13 * Math.sin((angle * Math.PI) / 180)}
          x2={24 + 20 * Math.cos((angle * Math.PI) / 180)}
          y2={24 + 20 * Math.sin((angle * Math.PI) / 180)}
          stroke="#fbbf24"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.8"
        />
      ))}
    </svg>
  );
};

const GalaxySpiral = ({ size = ICON_SIZE, className = '' }) => {
  const uid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id={`galG-${uid}`} x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#f0abfc" />
        </linearGradient>
        <radialGradient id={`galR-${uid}`} cx="24" cy="24" r="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="20" fill={`url(#galR-${uid})`} />
      <circle cx="24" cy="24" r="4" fill={`url(#galG-${uid})`} />
      <path d="M24 20C28 20 30 22 30 24C30 28 26 30 22 28C18 26 18 22 20 20C22 18 28 16 32 18C36 20 38 26 36 30C34 34 28 38 22 36C16 34 12 28 14 22C16 16 22 12 28 14" stroke={`url(#galG-${uid})`} strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="14" cy="14" r="1" fill="#c4b5fd" opacity="0.7" />
      <circle cx="36" cy="12" r="0.8" fill="#e9d5ff" opacity="0.6" />
      <circle cx="38" cy="36" r="1.2" fill="#ddd6fe" opacity="0.5" />
      <circle cx="10" cy="34" r="0.7" fill="#c4b5fd" opacity="0.4" />
    </svg>
  );
};

const CrystalGem = ({ size = ICON_SIZE, className = '' }) => {
  const uid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id={`gemG-${uid}`} x1="14" y1="8" x2="34" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="50%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
        <radialGradient id={`gemR-${uid}`} cx="24" cy="24" r="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="20" fill={`url(#gemR-${uid})`} />
      <path d="M16 14H32L38 22L24 42L10 22L16 14Z" fill={`url(#gemG-${uid})`} />
      <path d="M16 14L24 22L32 14" stroke="#a5f3fc" strokeWidth="1" opacity="0.6" />
      <path d="M10 22H38" stroke="#a5f3fc" strokeWidth="1" opacity="0.4" />
      <path d="M24 22V42" stroke="#a5f3fc" strokeWidth="0.8" opacity="0.3" />
      <path d="M16 14L24 42" stroke="#a5f3fc" strokeWidth="0.6" opacity="0.2" />
      <path d="M32 14L24 42" stroke="#a5f3fc" strokeWidth="0.6" opacity="0.2" />
    </svg>
  );
};

const SnowFlake = ({ size = ICON_SIZE, className = '' }) => {
  const uid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id={`snowG-${uid}`} x1="10" y1="6" x2="38" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="50%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <radialGradient id={`snowR-${uid}`} cx="24" cy="24" r="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#bae6fd" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="20" fill={`url(#snowR-${uid})`} />
      {[0, 60, 120].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 24 24)`}>
          <line x1="24" y1="6" x2="24" y2="42" stroke={`url(#snowG-${uid})`} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="24" y1="10" x2="19" y2="14" stroke={`url(#snowG-${uid})`} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="24" y1="10" x2="29" y2="14" stroke={`url(#snowG-${uid})`} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="24" y1="38" x2="19" y2="34" stroke={`url(#snowG-${uid})`} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="24" y1="38" x2="29" y2="34" stroke={`url(#snowG-${uid})`} strokeWidth="1.8" strokeLinecap="round" />
        </g>
      ))}
      <circle cx="24" cy="24" r="3" fill={`url(#snowG-${uid})`} opacity="0.6" />
    </svg>
  );
};

const LotusFlower = ({ size = ICON_SIZE, className = '' }) => {
  const uid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id={`lotusG-${uid}`} x1="14" y1="8" x2="34" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fda4af" />
          <stop offset="50%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
        <radialGradient id={`lotusR-${uid}`} cx="24" cy="28" r="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fda4af" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#fda4af" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="28" r="18" fill={`url(#lotusR-${uid})`} />
      <ellipse cx="24" cy="24" rx="5" ry="14" fill={`url(#lotusG-${uid})`} opacity="0.9" />
      <ellipse cx="24" cy="24" rx="5" ry="14" fill={`url(#lotusG-${uid})`} opacity="0.7" transform="rotate(30 24 24)" />
      <ellipse cx="24" cy="24" rx="5" ry="14" fill={`url(#lotusG-${uid})`} opacity="0.7" transform="rotate(-30 24 24)" />
      <ellipse cx="24" cy="24" rx="5" ry="14" fill={`url(#lotusG-${uid})`} opacity="0.5" transform="rotate(60 24 24)" />
      <ellipse cx="24" cy="24" rx="5" ry="14" fill={`url(#lotusG-${uid})`} opacity="0.5" transform="rotate(-60 24 24)" />
      <circle cx="24" cy="24" r="3.5" fill="#fce7f3" opacity="0.7" />
    </svg>
  );
};

const PhoenixWing = ({ size = ICON_SIZE, className = '' }) => {
  const uid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id={`phxG-${uid}`} x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="40%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
        <radialGradient id={`phxR-${uid}`} cx="24" cy="24" r="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill={`url(#phxR-${uid})`} />
      <path d="M24 8C24 8 14 14 8 24C14 22 18 22 22 24C18 28 14 34 12 40C18 36 22 32 24 28C26 32 30 36 36 40C34 34 30 28 26 24C30 22 34 22 40 24C34 14 24 8 24 8Z" fill={`url(#phxG-${uid})`} />
      <path d="M24 14C24 14 20 18 18 24C22 23 24 22 24 22C24 22 26 23 30 24C28 18 24 14 24 14Z" fill="#fef3c7" opacity="0.4" />
    </svg>
  );
};

/* ── Icon Registry ────────────────────────────────────── */
export const CARD_ICONS = [
  { id: 'none', name: 'None', component: null },
  { id: 'crescent-moon', name: 'Moon', component: CrescentMoon },
  { id: 'spark-star', name: 'Star', component: SparkStar },
  { id: 'cosmic-cloud', name: 'Cloud', component: CosmicCloud },
  { id: 'celestial-flame', name: 'Flame', component: CelestialFlame },
  { id: 'aurora-wave', name: 'Aurora', component: AuroraWave },
  { id: 'nebula-diamond', name: 'Diamond', component: NebulaDiamond },
  { id: 'sun-burst', name: 'Sun', component: SunBurst },
  { id: 'galaxy-spiral', name: 'Galaxy', component: GalaxySpiral },
  { id: 'crystal-gem', name: 'Gem', component: CrystalGem },
  { id: 'snowflake', name: 'Snow', component: SnowFlake },
  { id: 'lotus-flower', name: 'Lotus', component: LotusFlower },
  { id: 'phoenix-wing', name: 'Phoenix', component: PhoenixWing },
];

/**
 * Renders the selected card icon by its id.
 * Returns null for 'none' or unknown ids.
 */
export const CardIconRenderer = ({ iconId, size = ICON_SIZE, className = '' }) => {
  const entry = CARD_ICONS.find((i) => i.id === iconId);
  if (!entry || !entry.component) return null;
  const IconComp = entry.component;
  return <IconComp size={size} className={className} />;
};

export default CARD_ICONS;
