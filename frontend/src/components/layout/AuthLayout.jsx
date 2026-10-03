import React from 'react';
import { ArrowLeft } from 'lucide-react';

const AuthLayout = ({
  title = 'Welcome back',
  subtitle = 'Sign in to continue',
  leftTitle = 'Take control of your money.',
  leftSubtitle = 'Track. Plan. Save.',
  heroImage,
  children,
  back,
}) => {
  const heroStyle = heroImage
    ? { backgroundImage: `linear-gradient(145deg, rgba(42, 22, 76, 0.48), rgba(21, 13, 38, 0.72)), url(${heroImage})` }
    : { backgroundImage: 'linear-gradient(145deg, #6d4bc3, #21123d)' };

  return (
    <main className="auth-shell relative flex min-h-screen items-center justify-center overflow-y-auto p-0 sm:p-5 lg:p-8">
      <div className="auth-backdrop pointer-events-none absolute inset-0" />

      <div className="auth-frame relative z-10 flex min-h-screen w-full flex-col overflow-hidden sm:min-h-0 sm:rounded-[30px] md:min-h-[min(760px,calc(100vh-40px))] md:max-w-[1160px] md:flex-row md:shadow-[0_30px_100px_rgba(31,18,57,0.2)]">
        <section
          className="auth-hero relative hidden shrink-0 bg-cover bg-center md:flex md:w-[43%] md:flex-col md:justify-between md:p-10 lg:p-12"
          style={heroStyle}
          aria-label="ExpenseTrack introduction"
        >
          <div className="relative z-10 max-w-sm pb-5 text-white">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/75">Personal finance, in focus</p>
            <h2 className="text-3xl font-bold leading-tight tracking-tight lg:text-4xl">{leftTitle}</h2>
            <p className="mt-3 text-sm font-medium tracking-wide text-white/75">{leftSubtitle}</p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#171024]/55 via-transparent to-[#24143f]/10" />
        </section>

        <div className="auth-divider pointer-events-none absolute bottom-0 left-[43%] top-0 z-10 hidden w-12 md:block" aria-hidden="true">
          <svg className="h-full w-full" viewBox="0 0 48 100" preserveAspectRatio="none">
            <path className="auth-divider-shape" d="M48,0 C16,17 3,31 26,48 C49,65 9,83 48,100 Z" />
          </svg>
        </div>

        <section className="auth-form-panel relative flex min-h-screen w-full flex-1 flex-col justify-center overflow-y-auto px-5 py-8 sm:px-10 md:min-h-0 md:w-[57%] md:px-12 lg:px-16">
          <div
            className="auth-mobile-hero relative -mx-5 -mt-8 mb-7 h-[104px] shrink-0 bg-cover bg-center md:hidden"
            style={heroStyle}
          />

          {back && (
            <button
              type="button"
              onClick={back}
              className="auth-back-button mb-5 inline-flex w-fit items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors hover:text-primary md:absolute md:left-10 md:top-7 md:mb-0 lg:left-12"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}

          <div className="mx-auto w-full max-w-[430px] py-2">
            <div className="mb-7">
              <h1 className="text-2xl font-bold leading-tight tracking-tight text-neutral-text sm:text-3xl">{title}</h1>
              <p className="mt-2 text-sm font-medium text-neutral-muted">{subtitle}</p>
            </div>
            <div className="auth-content">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AuthLayout;
