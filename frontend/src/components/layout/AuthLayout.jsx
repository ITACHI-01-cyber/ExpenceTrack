import React from 'react';
import { ArrowLeft } from 'lucide-react';

const AuthLayout = ({ title = 'Welcome back', subtitle = 'Sign in to continue', leftTitle, leftSubtitle, heroImage, children, back }) => {
  const panelTitle = leftTitle || title;
  const panelSubtitle = leftSubtitle || subtitle;

  return (
    <div className="min-h-screen overflow-hidden bg-[#04050b] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),transparent_18%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.18),transparent_20%)] pointer-events-none" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-center justify-center px-4 py-8">
        <div className="absolute inset-0 md:hidden bg-cover bg-center" style={heroImage ? { backgroundImage: `url(${heroImage})` } : { backgroundColor: '#07090f' }} />
        <div className="absolute inset-0 md:hidden bg-black/35" />
        <div className="relative z-10 flex w-full flex-col overflow-hidden rounded-[40px] border border-white/10 bg-[#090b13]/95 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl md:flex-row">
          <div className="hidden md:flex md:w-1/2 items-center justify-center p-10" style={heroImage ? { backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: '#07090f' }}>
            <div className="absolute inset-0 bg-black/25" />
          </div>

          <div className="w-full md:w-1/2 p-6 md:p-10 flex items-center justify-center">
            <div className="w-full max-w-[430px] space-y-6">
              {back && (
                <button onClick={back} className="inline-flex items-center gap-2 text-white/70 transition hover:text-white">
                  <ArrowLeft size={16} /> Back
                </button>
              )}
              <div className="rounded-[32px] border border-white/10 bg-[#08101c]/95 p-6 shadow-[0_32px_80px_rgba(0,0,0,0.25)] backdrop-blur-md">
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-[0.32em] text-white/50">{title}</p>
                  <h1 className="mt-4 text-3xl font-semibold text-white">{title}</h1>
                  <p className="mt-2 text-sm text-white/60">{subtitle}</p>
                </div>
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
