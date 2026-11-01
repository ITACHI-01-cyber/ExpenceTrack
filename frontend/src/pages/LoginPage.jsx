import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import guestStorage from '../services/guestStorage';
import OtpInput from 'react-otp-input';
import AuthLayout from '../components/layout/AuthLayout';

const LoginPage = () => {
  const [authStep, setAuthStep] = useState('form');
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
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

  return (
    <AuthLayout 
      title="Welcome back" 
      subtitle="Please enter your details."
    >
      <div className="space-y-4">
        {error && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-600 text-center">
            {error}
          </div>
        )}

        {authStep === 'form' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-400 md:hidden">Email</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                  placeholder="Email" 
                  className="w-full rounded-full border border-border bg-input-bg px-5 py-3.5 pr-11 text-xs text-neutral-text placeholder:text-neutral-muted outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                  required 
                />
                <Mail size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 md:text-neutral-300" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-400 md:hidden">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password} 
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                  placeholder="Password" 
                  className="w-full rounded-full border border-border bg-input-bg px-5 py-3.5 pr-11 text-xs text-neutral-text placeholder:text-neutral-muted outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-muted hover:text-neutral-text transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot Row */}
            <div className="flex items-center justify-between px-1 text-[11px] text-neutral-400 md:text-neutral-500 font-medium">
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-neutral-text select-none">
                <input 
                  type="checkbox" 
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  className="h-3.5 w-3.5 rounded border-border bg-input-bg text-primary focus:ring-primary"
                />
                Remember for 30 days
              </label>
              <button 
                type="button" 
                onClick={() => navigate('/forgot-password')} 
                className="hover:text-neutral-text transition"
              >
                Forgot password?
              </button>
            </div>

            {/* CTA Button */}
            <button 
              type="submit" 
              disabled={loading} 
              className="mt-3 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-xs font-bold text-primary-contrast shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <LoaderCircle size={16} className="animate-spin" />}
              {loading ? 'Logging in…' : 'Log In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="text-center text-xs text-neutral-400 md:text-neutral-500">
              Enter the 6-digit code sent to <span className="font-semibold text-neutral-text">{formData.email}</span>
            </div>
            <div className="py-2">
              <OtpInput 
                value={otp} 
                onChange={setOtp} 
                numInputs={6} 
                renderInput={(props) => <input {...props} />}
                containerStyle="flex justify-between w-full gap-2"
                inputStyle={{
                  width: '100%',
                  height: '46px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  fontSize: '16px',
                  fontWeight: 700,
                  outline: 'none',
                  textAlign: 'center'
                }}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || otp.length !== 6} 
              className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-xs font-bold text-primary-contrast shadow-md transition hover:opacity-95 disabled:opacity-60"
            >
              {loading && <LoaderCircle size={16} className="animate-spin" />}
              {loading ? 'Verifying…' : 'Verify & Continue'}
            </button>
          </form>
        )}

        {/* Footer Nav */}
        <div className="pt-2 text-center text-[11px] text-neutral-400 md:text-neutral-500">
          Don't have an account?{' '}
          <button 
            type="button" 
            onClick={() => navigate('/signup')} 
            className="font-bold text-neutral-text hover:underline"
          >
            Sign Up
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center py-1">
          <span className="absolute inset-x-0 top-1/2 h-px bg-neutral-800 md:bg-gray-100" />
          <span className="relative bg-surface px-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-muted">or</span>
        </div>

        {/* Continue as Guest */}
        <button
          type="button"
          onClick={handleGuestLogin}
          className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-neutral-text transition hover:bg-surface-hover"
        >
          <Eye size={15} />
          Continue as Guest
        </button>
        <p className="text-center text-[10px] text-neutral-500 md:text-neutral-400">
          Preview the app — data is saved locally in your browser
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
