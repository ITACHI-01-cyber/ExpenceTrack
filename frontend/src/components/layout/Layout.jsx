import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import GuestBanner from '../ui/GuestBanner';

const Layout = ({ children }) => {
  const { pathname } = useLocation();
  const mainRef = useRef(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [pathname]);

  return (
    <div className="app-layout-shell flex min-h-screen bg-background md:h-screen md:overflow-hidden md:p-3 lg:p-4">
      <Sidebar />
      <main ref={mainRef} className="w-full min-w-0 flex-1 overflow-y-auto px-4 pb-28 pt-4 sm:px-6 md:px-7 md:py-5 md:pb-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1560px]">
          <GuestBanner />
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
