import React from 'react';
import useAuthStore from '../../store/authStore';

const TopBar = ({ title }) => {
  const { user } = useAuthStore();
  
  return (
    <header className="flex justify-between items-center mb-8">
      <h1 className="text-2xl font-semibold text-neutral-text">
        {title || (user ? `Welcome back, ${user.name.split(' ')[0]}!` : 'Welcome!')}
      </h1>
      <div className="flex items-center gap-4">
        {/* Placeholder for ThemeToggle if implemented */}
      </div>
    </header>
  );
};

export default TopBar;
