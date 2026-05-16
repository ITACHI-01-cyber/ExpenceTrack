import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ArrowRightLeft, Wallet, LogOut, Star, Settings2 } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Transactions', path: '/transactions', icon: <ArrowRightLeft size={20} /> },
    { name: 'Wallet', path: '/wallet', icon: <Wallet size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings2 size={20} /> },
  ];

  return (
    <aside className="fixed bottom-0 left-0 right-0 z-50 w-full border-t border-border bg-white/95 p-2 shadow-card backdrop-blur md:relative md:left-auto md:right-auto md:w-[220px] md:h-[calc(100vh-32px)] md:rounded-2xl md:border-t-0 md:ml-4 md:flex md:flex-col md:justify-between md:p-4 md:py-8">
      <div className="hidden md:flex flex-col gap-8">
        <div className="flex items-center gap-2 px-2 text-primary">
          <Star fill="currentColor" size={24} />
          <span className="text-xl font-bold">Expence rack</span>
        </div>

        {user && (
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary-glow flex items-center justify-center text-primary font-bold text-xl overflow-hidden">
               {user.profilePicture ? <img src={user.profilePicture} alt="User" className="h-full w-full object-cover" /> : user.name.charAt(0)}
            </div>
            <span className="font-semibold text-primary text-sm text-center">{user.name}</span>
          </div>
        )}
      </div>

      <nav className="grid w-full grid-cols-5 gap-1 md:flex md:flex-col md:gap-2 md:justify-start">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex min-h-12 items-center justify-center gap-3 rounded-chip px-2 py-2 transition-all duration-300 font-medium md:justify-start md:px-4 md:py-3 ${
                isActive 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-neutral-muted hover:bg-background hover:text-primary'
              }`
            }
          >
            {item.icon}
            <span className="hidden md:block text-sm">{item.name}</span>
          </NavLink>
        ))}
        
        <button 
          onClick={handleLogout}
          className="flex min-h-12 items-center justify-center gap-3 rounded-chip px-2 py-2 text-neutral-muted transition-all duration-300 hover:bg-danger/10 hover:text-danger md:mt-auto md:justify-start md:px-4 md:py-3"
        >
          <LogOut size={20} />
          <span className="hidden md:block text-sm font-medium">Sign Out</span>
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
