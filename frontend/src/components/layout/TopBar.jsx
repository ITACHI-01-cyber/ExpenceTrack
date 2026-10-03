import React from 'react';
import { CalendarDays } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const TopBar = ({ title, className = '' }) => {
  const { user } = useAuthStore();
  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className={`app-topbar mb-6 flex items-end justify-between gap-4 md:mb-8 ${className}`}>
      <div className="min-w-0">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          Personal finance
        </p>
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-neutral-text sm:text-3xl">
          {title || (user ? `Welcome back, ${user.name.split(' ')[0]}` : 'Welcome')}
        </h1>
        <p className="mt-1 hidden text-sm text-neutral-muted sm:block">
          A clearer view of your money, every day.
        </p>
      </div>
      <div className="mb-0.5 hidden shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-medium text-neutral-muted shadow-sm sm:flex">
        <CalendarDays size={15} className="text-primary" />
        <span>{dateLabel}</span>
      </div>
    </header>
  );
};

export default TopBar;
