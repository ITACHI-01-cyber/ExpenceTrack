import React from 'react';
import AnimatedNumber from '../ui/AnimatedNumber';
import { formatCurrency } from '../../utils/formatCurrency';

const BalanceCard = ({ balance, cardNumber, cardType }) => {
  return (
    <div className="bg-background rounded-[24px] p-6 h-[200px] flex flex-col justify-between border shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 translate-y-0 hover:-translate-y-1">
      {/* Abstract shapes for design */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/4"></div>

      <div className="relative z-10">
        <p className="text-neutral-muted text-sm mb-2 font-medium">Available balance</p>
        <h2 className="text-3xl font-bold text-primary tabular-nums">
          <AnimatedNumber value={balance} formatter={formatCurrency} />
        </h2>
      </div>

      <div className="flex justify-between items-end relative z-10">
        <p className="text-neutral-muted text-sm font-medium tracking-widest">{cardNumber}</p>
        <div className="flex -space-x-2">
          {cardType === 'mastercard' ? (
            <>
              <div className="w-6 h-6 rounded-full bg-red-500 opacity-80 mix-blend-multiply"></div>
              <div className="w-6 h-6 rounded-full bg-yellow-500 opacity-80 mix-blend-multiply"></div>
            </>
          ) : (
             <div className="text-blue-700 font-bold italic text-lg">VISA</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
