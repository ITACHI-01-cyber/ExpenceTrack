import React from 'react';
import { ArrowLeft } from 'lucide-react';

const AuthLayout = ({ title = 'Welcome back', subtitle = 'Sign in to continue', leftTitle, leftSubtitle, heroImage, children, back }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-slate-800 p-2 sm:p-4 relative overflow-y-auto">
      {/* Viewport background: blurred and dimmed hero image */}
      <div 
        className="absolute inset-0 bg-cover bg-center pointer-events-none transition-all duration-500"
        style={{
          backgroundImage: heroImage ? `url(${heroImage})` : 'none',
          filter: 'blur(24px) brightness(0.6)',
          transform: 'scale(1.1)',
          opacity: 0.75
        }}
      />
      
      {/* Main Container */}
      <div className="relative z-10 flex w-full max-w-[1000px] min-h-fit md:min-h-[620px] md:h-[650px] overflow-hidden rounded-[32px] md:rounded-[40px] border border-white/10 bg-[#d5e3ec] shadow-[0_24px_80px_rgba(0,0,0,0.5)] md:flex-row flex-col">
        
        {/* Left Side: Hero Image (visible on md+) */}
        <div 
          className="hidden md:block md:w-[45%] h-full relative bg-cover bg-center shrink-0" 
          style={heroImage ? { backgroundImage: `url(${heroImage})` } : { backgroundColor: '#1e293b' }}
        >
          {/* Subtle overlay to blend */}
          <div className="absolute inset-0 bg-black/5" />
        </div>

        {/* Wavy Divider SVG (visible on md+) */}
        <div className="hidden md:block absolute left-[45%] top-0 bottom-0 w-[40px] h-full z-20 pointer-events-none translate-x-[-39.5px]">
          <svg className="w-full h-full text-[#d5e3ec] fill-current" viewBox="0 0 40 100" preserveAspectRatio="none">
            <path d="M40,0 C15,15 -10,35 25,50 C50,60 15,85 40,100 Z" />
          </svg>
        </div>

        {/* Mobile top image banner */}
        <div 
          className="block md:hidden w-full h-[180px] bg-cover bg-center relative"
          style={heroImage ? { backgroundImage: `url(${heroImage})` } : { backgroundColor: '#1e293b' }}
        >
          <div className="absolute inset-0 bg-black/15" />
          {back && (
            <button 
              onClick={back} 
              className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full"
            >
              <ArrowLeft size={12} /> Back
            </button>
          )}
        </div>

        {/* Right Side: Form Content */}
        <div className="w-full md:w-[55%] flex-1 overflow-y-auto p-6 sm:p-8 md:p-10 flex flex-col justify-center relative">
          {back && (
            <button 
              onClick={back} 
              className="hidden md:inline-flex absolute top-6 left-8 items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}
          
          <div className="w-full max-w-[380px] mx-auto space-y-6 py-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 leading-tight">
                {title}
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {subtitle}
              </p>
            </div>
            
            <div className="text-slate-800">
              {children}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthLayout;
