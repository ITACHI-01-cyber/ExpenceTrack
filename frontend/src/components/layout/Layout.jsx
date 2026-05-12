import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-background overflow-hidden md:p-4">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 px-4 md:px-8 py-6 w-full max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
