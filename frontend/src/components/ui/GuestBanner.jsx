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
    <div className="guest-banner relative mb-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl border border-primary/15 bg-gradient-to-r from-primary-glow via-white to-primary-glow px-4 py-3 text-xs font-medium text-neutral-text shadow-sm animate-[fade-in_0.4s_ease-out_both]">
      <div className="flex items-center gap-2">
        <Eye size={14} className="shrink-0 text-primary" />
        <span>
          You&apos;re in <strong>preview mode</strong> &mdash; your data is saved locally in your browser.
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSignUp}
          className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-white shadow-sm transition-colors hover:bg-primary-light"
        >
          <UserPlus size={12} />
          Sign Up
        </button>
        <button
          type="button"
          onClick={handleExit}
          className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-white px-3 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary-glow"
        >
          Exit Preview
        </button>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-neutral-muted transition-colors hover:bg-primary/10 hover:text-primary"
        aria-label="Dismiss banner"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default GuestBanner;
