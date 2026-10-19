import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, PieChart, Wallet, ArrowRightLeft, Settings2, LogOut, Eye } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import catLogo from '../../assets/cat-logo.png';

const Sidebar = () => {
  const { logout, isGuest } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <Home size={22} /> },
    { name: 'Analytics', path: '/budget', icon: <PieChart size={22} /> },
    { name: 'Wallet', path: '/wallet', icon: <Wallet size={22} /> },
    { name: 'Transactions', path: '/transactions', icon: <ArrowRightLeft size={22} /> },
    { name: 'Settings', path: '/settings', icon: <Settings2 size={22} /> },
  ];

  return (
    <aside
      aria-label="Sidebar navigation"
      className="app-sidebar fixed bottom-3 left-3 right-3 z-50 flex items-center justify-between rounded-2xl border border-white/10 bg-[#18132B] px-3 py-2 shadow-[0_18px_40px_rgba(15,8,30,0.4)] backdrop-blur-md md:relative md:bottom-auto md:left-auto md:right-auto md:my-auto md:ml-4 md:flex md:h-[calc(100vh-2.5rem)] md:w-[78px] md:flex-col md:justify-between md:rounded-[2.5rem] md:py-7 md:px-2"
    >
      {/* Top brand logo - Supplied red cat logo */}
      <div className="hidden flex-col items-center gap-1 md:flex">
        <NavLink
          to="/dashboard"
          className="group flex h-12 w-12 items-center justify-center transition-transform duration-300 hover:scale-105"
          title="ExpenceTrack"
          aria-label="ExpenceTrack Home"
        >
          <img
            src={catLogo}
            alt="ExpenceTrack Cat Logo"
            className="h-10 w-10 object-contain drop-shadow-[0_4px_10px_rgba(255,75,90,0.35)]"
          />
        </NavLink>
      </div>

      {/* Navigation rail icons */}
      <nav
        aria-label="Main Navigation"
        className="flex w-full items-center justify-around gap-1 md:flex-col md:items-center md:justify-center md:gap-3.5 md:px-0"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            title={item.name}
            aria-label={item.name}
            className={({ isActive }) =>
              `group relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-[#6936F5] text-white shadow-[0_8px_20px_rgba(105,54,245,0.45)] ring-1 ring-white/20'
                  : 'text-[#A19BB8] hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <div className="transition-transform duration-200 group-hover:scale-110">
              {item.icon}
            </div>
            <span className="sr-only">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom action: Logout / Exit Preview */}
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={handleLogout}
          title={isGuest ? 'Exit preview mode' : 'Logout'}
          aria-label={isGuest ? 'Exit preview mode' : 'Logout'}
          className="group relative flex h-11 w-11 items-center justify-center rounded-2xl text-[#A19BB8] transition-all duration-200 hover:bg-white/10 hover:text-white"
        >
          <div className="transition-transform duration-200 group-hover:scale-110">
            {isGuest ? <Eye size={22} /> : <LogOut size={22} />}
          </div>
          <span className="sr-only">{isGuest ? 'Exit preview' : 'Logout'}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
