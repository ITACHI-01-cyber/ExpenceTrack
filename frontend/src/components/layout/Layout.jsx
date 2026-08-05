import React from 'react';
import Sidebar from './Sidebar';
import GuestBanner from '../ui/GuestBanner';

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-background md:h-screen md:overflow-hidden md:p-4">
      <Sidebar />
      <main className="w-full flex-1 overflow-y-auto px-4 pb-24 pt-5 sm:px-6 md:px-8 md:py-6 md:pb-0">
        <div className="mx-auto w-full max-w-7xl">
        <GuestBanner />
        {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
