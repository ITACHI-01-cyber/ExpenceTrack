import React from 'react';
import useAuthStore from '../../store/authStore';

const TopBar = ({ title }) => {
  const { user } = useAuthStore();
  
  return (
    <header className="mb-6 flex items-center justify-between md:mb-8">
      <h1 className="text-xl font-semibold leading-tight text-neutral-text sm:text-2xl">
        {title || (user ? `Welcome back, ${user.name.split(' ')[0]}!` : 'Welcome!')}
      </h1>
      <div className="flex items-center gap-4">
        {/* Placeholder for ThemeToggle if implemented */}
      </div>
    </header>
  );
};

export default TopBar;
