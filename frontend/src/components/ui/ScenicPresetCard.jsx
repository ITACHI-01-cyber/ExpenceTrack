import React from 'react';
import { Check } from 'lucide-react';
import { getCardBackground } from '../../utils/cardDesigns';

const ScenicPresetCard = ({ design, selected, onSelect }) => {
  const background = getCardBackground({
    designPreset: design.id,
    primaryColor: design.primaryColor,
    secondaryColor: design.secondaryColor,
    textColor: design.textColor
  });

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${design.name}${selected ? ', selected' : ''}`}
      onClick={onSelect}
      className={`group relative flex h-32 min-w-0 flex-col justify-between overflow-hidden rounded-2xl border-2 p-4 text-left text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:h-36 ${
        selected
          ? 'border-primary shadow-lg shadow-primary/25 ring-2 ring-primary/35'
          : 'border-white/70 hover:border-primary/70'
      }`}
      style={background}
    >
      <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/85 drop-shadow">
        Scenic Design
      </span>
      <span className="pr-9 text-base font-bold leading-tight drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)] sm:text-lg">
        {design.name}
      </span>
      <span
        className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border shadow-sm transition-all ${
          selected
            ? 'border-white bg-primary text-white shadow-primary/50'
            : 'border-white/90 bg-black/20 text-transparent group-hover:bg-black/35'
        }`}
        aria-hidden="true"
      >
        {selected && <Check size={16} strokeWidth={3} />}
      </span>
    </button>
  );
};

export default ScenicPresetCard;
