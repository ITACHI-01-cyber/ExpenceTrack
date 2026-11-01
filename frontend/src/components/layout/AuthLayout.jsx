import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import pandaAuth from '../../assets/panda_auth.jpg';
import catLogo from '../../assets/cat-logo.png';

const AuthLayout = ({
  title = 'Welcome back',
  subtitle = 'Please enter your details.',
  children,
  back,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginPage = location.pathname.includes('/login');
  const isSignupPage = location.pathname.includes('/signup');
  const isForgotPage = location.pathname.includes('/forgot');

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background p-3 sm:p-6 md:p-10 selection:bg-primary/20">
      
      {/* ── MOBILE VIEW (< md) ── */}
      <div className="relative z-10 flex min-h-screen w-full flex-col bg-background md:hidden">
        {/* Top Header Card with Brand Logo */}
        <div className="relative flex min-h-[150px] w-full items-center justify-center rounded-b-[40px] bg-surface px-6 pb-6 pt-8 shadow-sm">
          {back && (
            <button
              type="button"
              onClick={back}
              aria-label="Go back"
              className="absolute left-6 top-7 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-800 transition hover:bg-neutral-200"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="flex flex-col items-center">
            <img src={catLogo} alt="ExpenceTrack logo" className="h-12 w-auto object-contain" />
            <span className="mt-1 text-xs font-black tracking-widest uppercase text-neutral-900">ExpenceTrack</span>
          </div>
        </div>

        {/* Dark Body Panel */}
        <div className="flex flex-1 flex-col bg-background px-6 pb-10 pt-6">
          {(isLoginPage || isSignupPage) && (
            <div className="mb-6 flex w-full rounded-full bg-surface p-1 shadow-inner">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className={`flex-1 rounded-full py-2.5 text-xs font-bold transition-all ${
                  isLoginPage
                    ? 'bg-primary text-primary-contrast shadow-sm'
                    : 'text-neutral-muted hover:text-neutral-text'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className={`flex-1 rounded-full py-2.5 text-xs font-bold transition-all ${
                  isSignupPage
                    ? 'bg-primary text-primary-contrast shadow-sm'
                    : 'text-neutral-muted hover:text-neutral-text'
                }`}
              >
                Sign up
              </button>
            </div>
          )}

          {isForgotPage && (
            <div className="mb-6 text-center">
              <h1 className="text-xl font-bold tracking-tight text-neutral-text">{title}</h1>
              <p className="mt-1 text-xs text-neutral-muted">{subtitle}</p>
            </div>
          )}

          <div className="auth-mobile-container flex-1">{children}</div>
        </div>
      </div>

      {/* ── DESKTOP VIEW (hidden md:flex) - Exactly like Reference 1 with Panda Image ── */}
      <div className="relative z-10 hidden min-h-[580px] w-full max-w-[1060px] overflow-hidden rounded-[2.5rem] bg-card shadow-[0_25px_70px_rgba(0,0,0,0.4)] md:flex md:flex-row">
        
        {/* Left Form Panel */}
        <section className="relative flex w-full flex-1 flex-col justify-center px-8 py-10 sm:px-12 md:w-[50%] lg:px-14 lg:py-12">
          {back && (
            <button
              type="button"
              onClick={back}
              className="absolute left-8 top-8 inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}

          <div className="mx-auto w-full max-w-[370px]">
            {/* Header */}
            <div className="mb-6 text-left">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-xs font-medium text-neutral-500 sm:text-sm">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Form Slot */}
            <div className="auth-desktop-content">{children}</div>
          </div>
        </section>

        {/* Right Artwork Panel (Orange Panda Image) */}
        <section className="relative hidden w-[50%] p-4 md:flex items-center justify-center">
          <div className="relative h-full w-full overflow-hidden rounded-[2.25rem] bg-[#F59E0B]/10 shadow-inner">
            <img
              src={pandaAuth}
              alt="Kung Fu Panda Artwork"
              className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
            />
          </div>
        </section>

      </div>
    </main>
  );
};

export default AuthLayout;
