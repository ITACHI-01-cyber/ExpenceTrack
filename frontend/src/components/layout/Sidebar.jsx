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
    <aside className="fixed bottom-4 left-4 right-4 z-50 rounded-[2rem] bg-white/90 p-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md md:relative md:bottom-auto md:left-auto md:right-auto md:w-[220px] md:h-[calc(100vh-32px)] md:rounded-2xl md:bg-white/95 md:p-4 md:py-8 md:shadow-card md:ml-4 md:flex md:flex-col md:justify-between">
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

      <nav className="flex w-full items-center justify-between px-1 md:flex md:flex-col md:gap-2 md:justify-start md:px-0">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `group flex flex-col md:flex-row flex-1 md:flex-none h-[60px] md:min-h-12 items-center justify-center md:justify-start gap-1 md:gap-3 rounded-[1.25rem] md:rounded-chip mx-0.5 md:mx-0 px-1 md:px-4 py-1.5 md:py-3 transition-all duration-300 font-medium ${
                isActive 
                  ? 'bg-primary/15 text-primary md:bg-primary md:text-white md:shadow-md' 
                  : 'text-neutral-muted hover:bg-primary/5 hover:text-primary md:hover:bg-background'
              }`
            }
          >
            <div className="flex flex-col items-center justify-center md:flex-row md:gap-3 transition-transform duration-300 group-hover:scale-110 md:group-hover:scale-100">
               {React.cloneElement(item.icon, { className: "w-[22px] h-[22px] md:w-5 md:h-5 mb-0.5 md:mb-0" })}
               <span className="text-[10px] md:text-sm leading-tight block">{item.name}</span>
            </div>
          </NavLink>
        ))}
        
        <button 
          onClick={handleLogout}
          className="group flex flex-col md:flex-row flex-1 md:flex-none h-[60px] md:min-h-12 items-center justify-center md:justify-start gap-1 md:gap-3 rounded-[1.25rem] md:rounded-chip mx-0.5 md:mx-0 px-1 md:px-4 py-1.5 md:py-3 text-neutral-muted transition-all duration-300 hover:bg-danger/10 hover:text-danger md:mt-auto"
        >
          <div className="flex flex-col items-center justify-center md:flex-row md:gap-3 transition-transform duration-300 group-hover:scale-110 md:group-hover:scale-100">
            <LogOut className="w-[22px] h-[22px] md:w-5 md:h-5 mb-0.5 md:mb-0" />
            <span className="text-[10px] md:text-sm leading-tight block">Logout</span>
          </div>
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
