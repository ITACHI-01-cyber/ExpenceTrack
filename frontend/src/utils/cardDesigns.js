export const CARD_DESIGNS = [
  {
    id: 'midnight',
    name: 'Midnight',
    primaryColor: '#111827',
    secondaryColor: '#312E81',
    textColor: '#FFFFFF'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    primaryColor: '#F97316',
    secondaryColor: '#FACC15',
    textColor: '#FFFFFF'
  },
  {
    id: 'aurora',
    name: 'Aurora',
    primaryColor: '#0F766E',
    secondaryColor: '#22D3EE',
    textColor: '#FFFFFF'
  },
  {
    id: 'berry',
    name: 'Berry',
    primaryColor: '#9F1239',
    secondaryColor: '#E11D48',
    textColor: '#FFFFFF'
  },
  {
    id: 'silver',
    name: 'Silver',
    primaryColor: '#CBD5E1',
    secondaryColor: '#64748B',
    textColor: '#0F172A'
  },
  {
    id: 'custom',
    name: 'Custom',
    primaryColor: '#7C3AED',
    secondaryColor: '#2563EB',
    textColor: '#FFFFFF'
  }
];

export const UPI_DESIGNS = [
  {
    id: 'upi-pulse',
    name: 'Pulse',
    primaryColor: '#5B21B6',
    secondaryColor: '#8B5CF6',
    textColor: '#FFFFFF'
  },
  {
    id: 'upi-mint',
    name: 'Mint Pay',
    primaryColor: '#065F46',
    secondaryColor: '#10B981',
    textColor: '#FFFFFF'
  },
  {
    id: 'upi-saffron',
    name: 'Saffron',
    primaryColor: '#C2410C',
    secondaryColor: '#FB923C',
    textColor: '#FFFFFF'
  },
  {
    id: 'upi-ocean',
    name: 'Ocean Pay',
    primaryColor: '#075985',
    secondaryColor: '#38BDF8',
    textColor: '#FFFFFF'
  },
  {
    id: 'upi-night',
    name: 'Night Pay',
    primaryColor: '#0F172A',
    secondaryColor: '#334155',
    textColor: '#FFFFFF'
  },
  {
    id: 'upi-custom',
    name: 'Custom UPI',
    primaryColor: '#4338CA',
    secondaryColor: '#EC4899',
    textColor: '#FFFFFF'
  }
];

export const CASH_DESIGNS = [
  {
    id: 'cash-pop',
    name: 'Pop Cash',
    primaryColor: '#FFD166',
    secondaryColor: '#06D6A0',
    textColor: '#0F172A'
  },
  {
    id: 'cash-neon',
    name: 'Neon Cash',
    primaryColor: '#0EA5E9',
    secondaryColor: '#F472B6',
    textColor: '#FFFFFF'
  },
  {
    id: 'cash-gold',
    name: 'Gold Rush',
    primaryColor: '#B45309',
    secondaryColor: '#F59E0B',
    textColor: '#FFFFFF'
  }
];


export const DC_DESIGNS = [
  {
    id: 'dc-superman',
    name: 'Superman Classic',
    primaryColor: '#0055A5',
    secondaryColor: '#E61E25',
    textColor: '#FFFFFF'
  },
  {
    id: 'dc-wonderwoman',
    name: 'Wonder Woman Gold',
    primaryColor: '#800000',
    secondaryColor: '#E31837',
    textColor: '#FFD700'
  },
  {
    id: 'dc-batman',
    name: 'Batman Dark Knight',
    primaryColor: '#141414',
    secondaryColor: '#262626',
    textColor: '#F3F4F6'
  }
];

/* ─── Scenic / Illustrated Card Designs ─── */
export const SCENIC_DESIGNS = [
  {
    id: 'scenic-alpine',
    name: 'Alpine Sunset',
    primaryColor: '#2d1b69',
    secondaryColor: '#e8758c',
    textColor: '#FFFFFF'
  },
  {
    id: 'scenic-ocean',
    name: 'Ocean Horizon',
    primaryColor: '#0c2340',
    secondaryColor: '#00b4d8',
    textColor: '#FFFFFF'
  },
  {
    id: 'scenic-northern',
    name: 'Northern Lights',
    primaryColor: '#0a0a2e',
    secondaryColor: '#43e97b',
    textColor: '#FFFFFF'
  },
  {
    id: 'scenic-sahara',
    name: 'Sahara Dunes',
    primaryColor: '#b45309',
    secondaryColor: '#fbbf24',
    textColor: '#FFFFFF'
  },
  {
    id: 'scenic-tropical',
    name: 'Tropical',
    primaryColor: '#0891b2',
    secondaryColor: '#f472b6',
    textColor: '#FFFFFF'
  },
  {
    id: 'scenic-neon-city',
    name: 'Neon City',
    primaryColor: '#0f0f2e',
    secondaryColor: '#a855f7',
    textColor: '#FFFFFF'
  },
  {
    id: 'scenic-cherry',
    name: 'Cherry Blossom',
    primaryColor: '#be185d',
    secondaryColor: '#f9a8d4',
    textColor: '#FFFFFF'
  },
  {
    id: 'scenic-volcano',
    name: 'Volcanic Dawn',
    primaryColor: '#7f1d1d',
    secondaryColor: '#f97316',
    textColor: '#FFFFFF'
  }
];

export const getCardDesign = (wallet = {}) => {
  const safeWallet = wallet || {};
  const type = (safeWallet.cardType || '').toLowerCase();
  const designs = type === 'upi' ? UPI_DESIGNS : (type === 'cash' ? CASH_DESIGNS : CARD_DESIGNS);

  // Check DC designs
  const dcMatch = DC_DESIGNS.find((d) => d.id === safeWallet.designPreset);
  if (dcMatch) {
    return {
      ...dcMatch,
      primaryColor: safeWallet.primaryColor || dcMatch.primaryColor,
      secondaryColor: safeWallet.secondaryColor || dcMatch.secondaryColor,
      textColor: safeWallet.textColor || dcMatch.textColor
    };
  }

  // Check scenic designs first (they work across all card types)
  const scenicMatch = SCENIC_DESIGNS.find((d) => d.id === safeWallet.designPreset);
  if (scenicMatch) {
    return {
      ...scenicMatch,
      primaryColor: safeWallet.primaryColor || scenicMatch.primaryColor,
      secondaryColor: safeWallet.secondaryColor || scenicMatch.secondaryColor,
      textColor: safeWallet.textColor || scenicMatch.textColor
    };
  }

  const preset = designs.find((design) => design.id === safeWallet.designPreset)
    || designs[0];

  return {
    ...preset,
    primaryColor: safeWallet.primaryColor || preset.primaryColor,
    secondaryColor: safeWallet.secondaryColor || preset.secondaryColor,
    textColor: safeWallet.textColor || preset.textColor
  };
};

/* ─── Scenic Background Patterns ─── */
const scenicPatterns = {
  'scenic-alpine': (design) => {
    const sky = `linear-gradient(180deg, ${design.primaryColor} 0%, #6b3fa0 25%, ${design.secondaryColor} 50%, #f4a574 72%, #fad0c0 100%)`;
    // Mountain silhouettes using polygon-like gradients
    const mountains1 = `linear-gradient(160deg, transparent 35%, rgba(30,15,60,0.85) 36%, rgba(30,15,60,0.85) 100%)`;
    const mountains2 = `linear-gradient(200deg, transparent 45%, rgba(60,30,80,0.6) 46%, rgba(60,30,80,0.6) 100%)`;
    const mountains3 = `linear-gradient(150deg, transparent 55%, rgba(20,10,50,0.4) 56%, rgba(20,10,50,0.4) 100%)`;
    const sun = `radial-gradient(circle at 78% 42%, rgba(255,200,100,0.5) 0%, rgba(255,200,100,0.15) 8%, transparent 18%)`;
    return {
      backgroundImage: `${sun}, ${mountains1}, ${mountains2}, ${mountains3}, ${sky}`,
      color: design.textColor
    };
  },
  'scenic-ocean': (design) => {
    const sky = `linear-gradient(180deg, ${design.primaryColor} 0%, #1a4a6e 30%, #3a9ec4 52%, ${design.secondaryColor} 70%, #48cae4 100%)`;
    const waves1 = `radial-gradient(ellipse at 50% 95%, rgba(0,50,80,0.6) 0%, transparent 50%)`;
    const waves2 = `radial-gradient(ellipse at 30% 88%, rgba(0,80,120,0.3) 0%, transparent 35%)`;
    const waves3 = `radial-gradient(ellipse at 70% 92%, rgba(0,60,100,0.25) 0%, transparent 30%)`;
    const sunReflection = `radial-gradient(circle at 50% 50%, rgba(255,220,130,0.35) 0%, rgba(255,220,130,0.1) 12%, transparent 22%)`;
    const haze = `linear-gradient(180deg, transparent 40%, rgba(255,255,255,0.08) 55%, transparent 65%)`;
    return {
      backgroundImage: `${sunReflection}, ${haze}, ${waves1}, ${waves2}, ${waves3}, ${sky}`,
      color: design.textColor
    };
  },
  'scenic-northern': (design) => {
    const sky = `linear-gradient(180deg, ${design.primaryColor} 0%, #0d1b3e 30%, #143a4a 55%, #0d1b3e 80%, ${design.primaryColor} 100%)`;
    const aurora1 = `radial-gradient(ellipse at 30% 35%, rgba(67,233,123,0.45) 0%, rgba(67,233,123,0.1) 25%, transparent 50%)`;
    const aurora2 = `radial-gradient(ellipse at 65% 25%, rgba(56,189,248,0.35) 0%, rgba(56,189,248,0.08) 30%, transparent 55%)`;
    const aurora3 = `radial-gradient(ellipse at 50% 40%, rgba(167,139,250,0.3) 0%, rgba(167,139,250,0.05) 20%, transparent 45%)`;
    const stars = `radial-gradient(circle at 15% 15%, rgba(255,255,255,0.9) 0.5px, transparent 1px), radial-gradient(circle at 85% 12%, rgba(255,255,255,0.7) 0.5px, transparent 1px), radial-gradient(circle at 45% 8%, rgba(255,255,255,0.6) 0.5px, transparent 1px), radial-gradient(circle at 72% 35%, rgba(255,255,255,0.5) 0.5px, transparent 1px)`;
    const ground = `linear-gradient(180deg, transparent 75%, rgba(15,15,30,0.9) 85%, #0a0a1e 100%)`;
    return {
      backgroundImage: `${stars}, ${aurora1}, ${aurora2}, ${aurora3}, ${ground}, ${sky}`,
      color: design.textColor
    };
  },
  'scenic-sahara': (design) => {
    const sky = `linear-gradient(180deg, #1a0a00 0%, ${design.primaryColor} 25%, #e07a2f 50%, ${design.secondaryColor} 72%, #fff3cd 95%)`;
    const dune1 = `radial-gradient(ellipse at 25% 90%, rgba(120,60,10,0.7) 0%, transparent 45%)`;
    const dune2 = `radial-gradient(ellipse at 75% 85%, rgba(160,80,20,0.5) 0%, transparent 40%)`;
    const dune3 = `radial-gradient(ellipse at 50% 95%, rgba(90,45,10,0.8) 0%, transparent 50%)`;
    const sun = `radial-gradient(circle at 80% 28%, rgba(255,230,100,0.6) 0%, rgba(255,230,100,0.15) 10%, transparent 25%)`;
    const haze = `linear-gradient(180deg, transparent 35%, rgba(255,200,100,0.12) 55%, transparent 75%)`;
    return {
      backgroundImage: `${sun}, ${haze}, ${dune1}, ${dune2}, ${dune3}, ${sky}`,
      color: design.textColor
    };
  },
  'scenic-tropical': (design) => {
    const sky = `linear-gradient(180deg, ${design.primaryColor} 0%, #0ea5e9 25%, #67e8f9 45%, #fda4af 65%, ${design.secondaryColor} 85%, #fce7f3 100%)`;
    const palmLeft = `linear-gradient(220deg, transparent 30%, rgba(0,60,40,0.5) 31%, rgba(0,60,40,0.5) 32%, transparent 33%)`;
    const palmRight = `linear-gradient(140deg, transparent 25%, rgba(0,50,35,0.4) 26%, rgba(0,50,35,0.4) 27%, transparent 28%)`;
    const palmLeaf1 = `linear-gradient(245deg, transparent 22%, rgba(0,80,50,0.35) 23%, transparent 26%)`;
    const palmLeaf2 = `linear-gradient(195deg, transparent 20%, rgba(0,70,45,0.3) 21%, transparent 24%)`;
    const water = `linear-gradient(180deg, transparent 70%, rgba(0,180,216,0.3) 80%, rgba(0,120,160,0.4) 100%)`;
    const sunGlow = `radial-gradient(circle at 50% 55%, rgba(255,200,150,0.4) 0%, rgba(255,200,150,0.1) 15%, transparent 30%)`;
    return {
      backgroundImage: `${palmLeft}, ${palmRight}, ${palmLeaf1}, ${palmLeaf2}, ${sunGlow}, ${water}, ${sky}`,
      color: design.textColor
    };
  },
  'scenic-neon-city': (design) => {
    const sky = `linear-gradient(180deg, ${design.primaryColor} 0%, #1a1040 35%, #2d1560 55%, #1a1040 80%, ${design.primaryColor} 100%)`;
    // Building silhouettes
    const building1 = `linear-gradient(180deg, transparent 55%, rgba(15,10,35,0.95) 56%)`;
    const building2 = `linear-gradient(180deg, transparent 50%, rgba(20,12,45,0.6) 51%, transparent 52%, transparent 60%, rgba(20,12,45,0.8) 61%)`;
    // Neon glows
    const neon1 = `radial-gradient(circle at 25% 62%, rgba(168,85,247,0.6) 0%, transparent 12%)`;
    const neon2 = `radial-gradient(circle at 70% 58%, rgba(236,72,153,0.5) 0%, transparent 10%)`;
    const neon3 = `radial-gradient(circle at 50% 55%, rgba(56,189,248,0.3) 0%, transparent 15%)`;
    // City light dots
    const lights = `radial-gradient(circle at 20% 65%, rgba(255,220,100,0.8) 0.5px, transparent 1.5px), radial-gradient(circle at 35% 60%, rgba(255,100,200,0.7) 0.5px, transparent 1.5px), radial-gradient(circle at 60% 63%, rgba(100,200,255,0.7) 0.5px, transparent 1.5px), radial-gradient(circle at 80% 58%, rgba(255,200,100,0.6) 0.5px, transparent 1.5px), radial-gradient(circle at 45% 68%, rgba(200,100,255,0.5) 0.5px, transparent 1.5px)`;
    return {
      backgroundImage: `${lights}, ${neon1}, ${neon2}, ${neon3}, ${building1}, ${building2}, ${sky}`,
      color: design.textColor
    };
  },
  'scenic-cherry': (design) => {
    const sky = `linear-gradient(180deg, ${design.primaryColor} 0%, #c2185b 20%, #e91e90 40%, ${design.secondaryColor} 65%, #fce4ec 90%)`;
    // Petal-like shapes
    const petal1 = `radial-gradient(circle at 20% 25%, rgba(255,255,255,0.35) 2px, transparent 5px)`;
    const petal2 = `radial-gradient(circle at 75% 15%, rgba(255,255,255,0.25) 2.5px, transparent 6px)`;
    const petal3 = `radial-gradient(circle at 40% 50%, rgba(255,255,255,0.2) 1.5px, transparent 4px)`;
    const petal4 = `radial-gradient(circle at 85% 40%, rgba(255,255,255,0.3) 2px, transparent 5px)`;
    const petal5 = `radial-gradient(circle at 60% 70%, rgba(255,255,255,0.15) 2px, transparent 5px)`;
    const petal6 = `radial-gradient(circle at 15% 65%, rgba(255,255,255,0.2) 1.5px, transparent 4px)`;
    // Branch silhouette
    const branch = `linear-gradient(135deg, transparent 10%, rgba(80,20,40,0.25) 11%, transparent 14%)`;
    const bloom = `radial-gradient(circle at 30% 30%, rgba(255,182,193,0.4) 0%, transparent 25%)`;
    return {
      backgroundImage: `${petal1}, ${petal2}, ${petal3}, ${petal4}, ${petal5}, ${petal6}, ${branch}, ${bloom}, ${sky}`,
      color: design.textColor
    };
  },
  'scenic-volcano': (design) => {
    const sky = `linear-gradient(180deg, #1a0000 0%, ${design.primaryColor} 20%, #991b1b 40%, ${design.secondaryColor} 65%, #fed7aa 90%)`;
    // Volcano shape
    const volcano = `linear-gradient(170deg, transparent 45%, rgba(50,10,10,0.9) 46%, rgba(50,10,10,0.9) 100%)`;
    const volcanoSide = `linear-gradient(190deg, transparent 50%, rgba(40,8,8,0.6) 51%, rgba(40,8,8,0.6) 100%)`;
    // Lava glow
    const lavaGlow = `radial-gradient(circle at 55% 40%, rgba(255,100,0,0.6) 0%, rgba(255,100,0,0.15) 12%, transparent 25%)`;
    const lavaEmber1 = `radial-gradient(circle at 50% 35%, rgba(255,200,0,0.4) 0%, transparent 8%)`;
    // Smoke
    const smoke = `radial-gradient(ellipse at 52% 25%, rgba(100,100,100,0.2) 0%, transparent 20%)`;
    const haze = `linear-gradient(180deg, transparent 30%, rgba(255,100,0,0.08) 50%, transparent 70%)`;
    return {
      backgroundImage: `${lavaEmber1}, ${smoke}, ${lavaGlow}, ${haze}, ${volcano}, ${volcanoSide}, ${sky}`,
      color: design.textColor
    };
  },
  'dc-superman': (design) => {
    return {
      backgroundImage: `url('https://logoblink.com/static/0b6d4ce5c7b9891df4d74d1f1d134cce/cf84a/superman-logo-logoblink.png')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: '#FFFFFF'
    };
  },
  'dc-wonderwoman': (design) => {
    return {
      backgroundImage: `url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTzlEknBO_feRA-R9rqPTD7LSKzZBls6oCvJ7yqLh7fxA1GDFhSZQeNViE&s=10')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: '#FFD700'
    };
  },
  'dc-batman': (design) => {
    return {
      backgroundImage: `url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYQwfmOgnIAcrL50dA4c-M3bttCFkUXb0wOlhFV_SgQgfNhmN_qHqA6tI&s=10')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: '#E5E7EB'
    };
  }
};

export const getCardBackground = (wallet = {}) => {
  const safeWallet = wallet || {};
  const design = getCardDesign(safeWallet);
  const gradient = `linear-gradient(135deg, ${design.primaryColor}, ${design.secondaryColor})`;

  // Check scenic patterns first
  if (safeWallet.designPreset && scenicPatterns[safeWallet.designPreset]) {
    return scenicPatterns[safeWallet.designPreset](design);
  }

  const patterns = {
    midnight: `${gradient}, linear-gradient(45deg, transparent 45%, rgba(255,255,255,.08) 50%, transparent 55%)`,
    sunset: `radial-gradient(circle at 85% 15%, rgba(255,255,255,.35), transparent 24%), ${gradient}`,
    aurora: `radial-gradient(circle at 20% 85%, rgba(167,243,208,.45), transparent 28%), radial-gradient(circle at 80% 10%, rgba(216,180,254,.4), transparent 32%), ${gradient}`,
    berry: `repeating-linear-gradient(120deg, transparent 0 18px, rgba(255,255,255,.07) 18px 20px), ${gradient}`,
    silver: `repeating-linear-gradient(0deg, transparent 0 5px, rgba(255,255,255,.18) 5px 6px), ${gradient}`,
    custom: `radial-gradient(circle at 10% 20%, rgba(255,255,255,.24), transparent 22%), radial-gradient(circle at 90% 85%, rgba(255,255,255,.16), transparent 28%), ${gradient}`,
    'upi-pulse': `radial-gradient(circle at 86% 16%, rgba(255,255,255,.24), transparent 18%), radial-gradient(circle at 15% 90%, rgba(236,72,153,.35), transparent 30%), ${gradient}`,
    'upi-mint': `repeating-radial-gradient(circle at 92% 12%, rgba(255,255,255,.14) 0 2px, transparent 3px 11px), ${gradient}`,
    'upi-saffron': `radial-gradient(circle at 15% 10%, rgba(254,240,138,.35), transparent 24%), ${gradient}`,
    'upi-ocean': `repeating-linear-gradient(125deg, transparent 0 16px, rgba(255,255,255,.06) 16px 18px), ${gradient}`,
    'upi-night': `radial-gradient(circle at 80% 10%, rgba(99,102,241,.45), transparent 30%), ${gradient}`,
    'upi-custom': `radial-gradient(circle at 10% 20%, rgba(255,255,255,.24), transparent 22%), radial-gradient(circle at 90% 85%, rgba(255,255,255,.16), transparent 28%), ${gradient}`
  };

  // Cash specific funky patterns
  const cashPatterns = {
    'cash-pop': `conic-gradient(from 180deg at 50% 50%, rgba(255,255,255,.06), transparent 10%), repeating-linear-gradient(45deg, rgba(0,0,0,.03) 0 6px, transparent 6px 12px), ${gradient}`,
    'cash-neon': `radial-gradient(circle at 10% 10%, rgba(255,255,255,.18), transparent 14%), repeating-linear-gradient(120deg, rgba(255,255,255,.05) 0 8px, transparent 8px 16px), ${gradient}`,
    'cash-gold': `radial-gradient(circle at 85% 15%, rgba(255,255,255,.28), transparent 20%), linear-gradient(90deg, rgba(255,255,255,.03), transparent 60%), ${gradient}`
  };

  if (safeWallet.designPreset && cashPatterns[safeWallet.designPreset]) {
    return {
      backgroundImage: cashPatterns[safeWallet.designPreset],
      color: design.textColor
    };
  }

  return {
    backgroundImage: patterns[safeWallet.designPreset] || gradient,
    color: design.textColor
  };
};

export const getCardCoverStyle = (wallet = {}) => {
  const safeWallet = wallet || {};
  const design = getCardDesign(safeWallet);

  // For scenic cards, use a complementary cover style
  if (safeWallet.designPreset && safeWallet.designPreset.startsWith('scenic-')) {
    return {
      backgroundImage: `
        radial-gradient(circle at 12% 10%, rgba(255,255,255,.15), transparent 24%),
        radial-gradient(circle at 92% 90%, rgba(0,0,0,.25), transparent 34%),
        linear-gradient(145deg, ${design.secondaryColor}, ${design.primaryColor})
      `,
      color: design.textColor,
      borderColor: 'rgba(255,255,255,0.08)'
    };
  }

  return {
    backgroundImage: `
      radial-gradient(circle at 12% 10%, rgba(255,255,255,.22), transparent 24%),
      radial-gradient(circle at 92% 90%, rgba(0,0,0,.18), transparent 34%),
      linear-gradient(145deg, ${design.secondaryColor}, ${design.primaryColor})
    `,
    color: design.textColor,
    borderColor: `${design.textColor}2B`
  };
};
