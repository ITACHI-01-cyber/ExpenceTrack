import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, ArrowRight, KeyRound } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import OtpInput from 'react-otp-input';
import AuthLayout from '../components/layout/AuthLayout';

const LoginPage = () => {
  const [authStep, setAuthStep] = useState('form');
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

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
  const heroSubtitle = 'Sign in to continue your journey';

  return (
    <AuthLayout title={heroTitle} subtitle={heroSubtitle} heroImage="https://w.wallhaven.cc/full/gw/wallhaven-gw2yx3.jpg">
      <div className="space-y-6">
        <div className="rounded-[32px] border border-white/10 bg-[#070a12]/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur-md">
          {error && <div className="mb-4 rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

          {authStep === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-4">


              <label className="space-y-2 text-sm text-white/70">
                <span className="text-xs uppercase tracking-[0.24em] text-white/50">Email address</span>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0f1220] px-4 py-3 transition focus-within:border-white/20">
                  <Mail className="text-white/50" />
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="you@example.com" className="w-full bg-transparent text-white outline-none" required />
                </div>
              </label>

              <label className="space-y-2 text-sm text-white/70">
                <span className="text-xs uppercase tracking-[0.24em] text-white/50">Password</span>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0f1220] px-4 py-3 transition focus-within:border-white/20">
                  <Lock className="text-white/50" />
                  <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Password" className="w-full bg-transparent text-white outline-none" required />
                </div>
              </label>



              <button type="submit" disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-[#ef4444] to-[#f59e0b] py-4 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60">
                {loading ? 'Signing in…' : 'Continue with Email'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="text-sm text-white/70">Enter the 6-digit code sent to {formData.email}</div>
              <div className="grid grid-cols-6 gap-3">
                <OtpInput value={otp} onChange={setOtp} numInputs={6} inputStyle={{ width: '100%', height: '58px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.12)', background: '#0f1220', color: '#fff', fontSize: '18px', fontWeight: 700, outline: 'none' }} />
              </div>
              <button type="submit" disabled={loading || otp.length !== 6} className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60">
                {loading ? 'Verifying…' : 'Verify & Continue'}
              </button>
            </form>
          )}
        </div>

        <div className="flex flex-col gap-3 text-center text-sm text-white/60">
          <button type="button" onClick={() => navigate('/signup')} className="underline transition hover:text-white">Sign Up</button>
          <button type="button" onClick={() => navigate('/forgot-password')} className="underline transition hover:text-white">Forgot password?</button>
          <button type="button" onClick={() => navigate('/forgot-username')} className="underline transition hover:text-white">Forgot username?</button>
        </div>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
