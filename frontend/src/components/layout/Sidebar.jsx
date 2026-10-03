import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ArrowRightLeft, Wallet, LogOut, Star, Settings2, Eye } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const Sidebar = () => {
  const { user, logout, isGuest } = useAuthStore();
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
    <aside className="app-sidebar fixed bottom-3 left-3 right-3 z-50 rounded-[1.5rem] border border-white/15 bg-gradient-to-br from-[#4F2A8A] via-[#45247C] to-[#321C60] p-2 shadow-[0_14px_38px_rgba(42,24,77,0.28)] md:relative md:bottom-auto md:left-auto md:right-auto md:flex md:h-full md:w-[232px] md:flex-col md:justify-between md:rounded-[1.5rem] md:p-4 md:py-7">
      <div className="hidden flex-col gap-7 md:flex">
        <div className="flex items-center gap-3 px-2 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/15 text-white shadow-sm">
            <Star fill="currentColor" size={20} />
          </span>
          <span className="text-lg font-extrabold tracking-tight">ExpenceTrack</span>
        </div>

        {user && (
          <div className="mb-2 flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] py-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/15 text-xl font-bold text-white">
               {isGuest ? (
                 <Eye size={28} />
               ) : user.profilePicture ? (
                 <img src={user.profilePicture} alt="User" className="h-full w-full object-cover" />
               ) : (
                 user.name.charAt(0)
               )}
            </div>
            <span className="text-center text-sm font-semibold text-white">{user.name}</span>
            {isGuest && (
              <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-100">
                Preview Mode
              </span>
            )}
          </div>
        )}
      </div>

      <nav className="flex w-full items-center justify-between px-1 md:flex md:flex-col md:items-stretch md:justify-start md:gap-2 md:px-0">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[1.1rem] px-1 py-1.5 font-medium transition-all duration-200 md:min-h-12 md:flex-none md:flex-row md:justify-start md:gap-3 md:rounded-xl md:px-4 md:py-3 ${
                isActive 
                  ? 'bg-white/20 text-white shadow-sm ring-1 ring-white/15'
                  : 'text-violet-100/75 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <div className="flex flex-col items-center justify-center md:flex-row md:gap-3 transition-transform duration-300 group-hover:scale-110 md:group-hover:scale-100">
               {React.cloneElement(item.icon, { className: "mb-0.5 h-[21px] w-[21px] md:mb-0 md:h-5 md:w-5" })}
               <span className="block text-[10px] leading-tight md:text-sm">{item.name}</span>
            </div>
          </NavLink>
        ))}
        
        <button 
          onClick={handleLogout}
          className="group mt-auto flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[1.1rem] px-1 py-1.5 text-violet-100/75 transition-colors duration-200 hover:bg-white/10 hover:text-white md:min-h-12 md:flex-none md:flex-row md:justify-start md:gap-3 md:rounded-xl md:px-4 md:py-3"
        >
          <div className="flex flex-col items-center justify-center md:flex-row md:gap-3 transition-transform duration-300 group-hover:scale-110 md:group-hover:scale-100">
            {isGuest ? (
              <Eye className="mb-0.5 h-[21px] w-[21px] md:mb-0 md:h-5 md:w-5" />
            ) : (
              <LogOut className="mb-0.5 h-[21px] w-[21px] md:mb-0 md:h-5 md:w-5" />
            )}
            <span className="block text-[10px] leading-tight md:text-sm">{isGuest ? 'Exit' : 'Logout'}</span>
          </div>
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
