import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, UserPlus, X } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const GuestBanner = () => {
  const { isGuest, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = React.useState(false);

  if (!isGuest || dismissed) return null;

  const handleSignUp = () => {
    logout();
    navigate('/signup');
  };

  const handleExit = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="guest-banner relative flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800 shadow-sm mb-4 animate-[fade-in_0.4s_ease-out_both]">
      <div className="flex items-center gap-2">
        <Eye size={14} className="text-amber-600 shrink-0" />
        <span>
          You&apos;re in <strong>preview mode</strong> &mdash; your data is saved locally in your browser.
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSignUp}
          className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-3 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-amber-700 transition-colors"
        >
          <UserPlus size={12} />
          Sign Up
        </button>
        <button
          type="button"
          onClick={handleExit}
          className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white px-3 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
        >
          Exit Preview
        </button>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-amber-400 hover:text-amber-700 hover:bg-amber-100 transition-colors"
        aria-label="Dismiss banner"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default GuestBanner;
