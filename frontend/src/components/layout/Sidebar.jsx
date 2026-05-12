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
    <aside className="w-full md:w-[220px] bg-white md:h-[calc(100vh-32px)] md:rounded-2xl shadow-card flex flex-row md:flex-col justify-between p-4 md:py-8 md:px-4 fixed bottom-0 md:relative md:ml-4 z-50">
      <div className="hidden md:flex flex-col gap-8">
        <div className="flex items-center gap-2 px-2 text-primary">
          <Star fill="currentColor" size={24} />
          <span className="text-xl font-bold">Zealz</span>
        </div>

        {user && (
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary-glow flex items-center justify-center text-primary font-bold text-xl overflow-hidden">
               {user.profilePicture ? <img src={user.profilePicture} alt="User" /> : user.name.charAt(0)}
            </div>
            <span className="font-semibold text-primary text-sm text-center">{user.name}</span>
          </div>
        )}
      </div>

      <nav className="flex md:flex-col w-full gap-2 justify-around md:justify-start">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-chip transition-all duration-300 font-medium ${
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
          className="flex items-center gap-3 px-4 py-3 rounded-chip text-neutral-muted hover:bg-danger/10 hover:text-danger transition-all duration-300 md:mt-auto"
        >
          <LogOut size={20} />
          <span className="hidden md:block text-sm font-medium">Sign Out</span>
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
