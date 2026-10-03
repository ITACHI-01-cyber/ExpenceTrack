import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import guestStorage from '../services/guestStorage';
import OtpInput from 'react-otp-input';
import AuthLayout from '../components/layout/AuthLayout';

const LoginPage = () => {
  const [authStep, setAuthStep] = useState('form');
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginAsGuest } = useAuthStore();
  const navigate = useNavigate();

  const handleGuestLogin = () => {
    guestStorage.seedDemoData();
    loginAsGuest();
    navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = { identifier: formData.email, password: formData.password };
      const response = await api.post('/auth/login', payload);
      if (response.data.success) {
        const { token, ...userData } = response.data.data;
        login(userData, token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await api.post('/auth/register/verify-otp', { otp, email: formData.email });
      if (resp.data.success) {
        const { token, ...userData } = resp.data.data;
        login(userData, token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const heroTitle = 'Welcome back';
  const heroSubtitle = 'Sign in to continue managing your money.';

  return (
    <AuthLayout 
      title={heroTitle} 
      subtitle={heroSubtitle} 
      heroImage="https://w.wallhaven.cc/full/yq/wallhaven-yqg6r7.jpg"
    >
      <div className="space-y-5">

        {error && (
          <div role="alert" className="auth-error rounded-xl border px-4 py-3 text-xs font-medium">
            {error}
          </div>
        )}

        {authStep === 'form' ? (
          <form onSubmit={handleSubmit} className="auth-form space-y-4">
            <div className="space-y-4">
              <div>
                <label className="auth-label mb-1.5 ml-1 block text-[10px] font-bold uppercase tracking-[0.14em]">
                  Email Address
                </label>
                <div className="auth-field-shell flex items-center gap-3 rounded-[14px] border px-4 py-3 transition">
                  <Mail size={17} className="auth-field-icon shrink-0" />
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    placeholder="you@example.com" 
                    className="auth-field-input w-full bg-transparent text-sm outline-none"
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="auth-label mb-1.5 ml-1 block text-[10px] font-bold uppercase tracking-[0.14em]">
                  Password
                </label>
                <div className="auth-field-shell flex items-center gap-3 rounded-[14px] border px-4 py-3 transition">
                  <Lock size={17} className="auth-field-icon shrink-0" />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password} 
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                    placeholder="Password" 
                    className="auth-field-input w-full bg-transparent text-sm outline-none"
                    required 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="auth-password-toggle rounded-lg p-1.5 transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="auth-submit mt-2 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[14px] py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <LoaderCircle size={17} className="animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="auth-description mb-2 text-xs font-medium">
              Enter the 6-digit code sent to <span className="font-semibold text-slate-700">{formData.email}</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              <OtpInput 
                value={otp} 
                onChange={setOtp} 
                numInputs={6} 
                renderInput={(props) => <input {...props} />}
                containerStyle="flex justify-between w-full gap-2"
                inputStyle={{ width: '100%', height: '48px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '16px', fontWeight: 700, outline: 'none', textAlign: 'center' }}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || otp.length !== 6} 
              className="auth-submit mt-2 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[14px] py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <LoaderCircle size={17} className="animate-spin" />}
              {loading ? 'Verifying…' : 'Verify & Continue'}
            </button>
          </form>
        )}

        <div className="auth-links flex flex-col gap-3 border-t pt-4 text-center text-xs font-medium">
          <div>
            Don't have an account?{' '}
            <button type="button" onClick={() => navigate('/signup')} className="auth-link font-bold hover:underline">
              Sign Up
            </button>
          </div>
          <div className="flex justify-center gap-4">
            <button type="button" onClick={() => navigate('/forgot-password')} className="auth-link hover:underline">
              Forgot password?
            </button>
            <button type="button" onClick={() => navigate('/forgot-username')} className="auth-link hover:underline">
              Forgot username?
            </button>
          </div>
        </div>

        {/* Guest / Preview Mode */}
        <div className="auth-separator relative flex items-center justify-center pt-1">
          <span className="absolute inset-x-0 top-1/2 h-px" />
          <span className="relative px-3 text-[10px] font-semibold uppercase tracking-widest">or</span>
        </div>

        <button
          type="button"
          onClick={handleGuestLogin}
          className="auth-guest-button flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] border px-4 py-3 text-sm font-semibold transition-all duration-200"
        >
          <Eye size={16} />
          Continue as Guest
        </button>
        <p className="auth-footnote -mt-1 text-center text-[10px]">
          Preview the app — data is saved locally in your browser
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
