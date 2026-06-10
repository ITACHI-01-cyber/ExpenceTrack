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

export const getCardDesign = (wallet = {}) => {
  const type = (wallet.cardType || '').toLowerCase();
  const designs = type === 'upi' ? UPI_DESIGNS : (type === 'cash' ? CASH_DESIGNS : CARD_DESIGNS);
  const preset = designs.find((design) => design.id === wallet.designPreset)
    || designs[0];

  return {
    ...preset,
    primaryColor: wallet.primaryColor || preset.primaryColor,
    secondaryColor: wallet.secondaryColor || preset.secondaryColor,
    textColor: wallet.textColor || preset.textColor
  };
};

export const getCardBackground = (wallet = {}) => {
  const design = getCardDesign(wallet);
  const gradient = `linear-gradient(135deg, ${design.primaryColor}, ${design.secondaryColor})`;

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

  if (wallet.designPreset && cashPatterns[wallet.designPreset]) {
    return {
      backgroundImage: cashPatterns[wallet.designPreset],
      color: design.textColor
    };
  }

  return {
    backgroundImage: patterns[wallet.designPreset] || gradient,
    color: design.textColor
  };
};

export const getCardCoverStyle = (wallet = {}) => {
  const design = getCardDesign(wallet);

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
