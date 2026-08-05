import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye } from 'lucide-react';
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

  const heroTitle = 'Hello ! Welcome Back';
  const heroSubtitle = 'We are glad to see you 😊';

  return (
    <AuthLayout 
      title={heroTitle} 
      subtitle={heroSubtitle} 
      heroImage="https://w.wallhaven.cc/full/yq/wallhaven-yqg6r7.jpg"
    >
      <div className="space-y-6 text-slate-800">

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        {authStep === 'form' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                  Email Address
                </label>
                <div className="flex items-center gap-3 rounded-full bg-[#f5ebe6] px-5 py-3.5 transition focus-within:ring-2 focus-within:ring-primary/20">
                  <Mail size={16} className="text-slate-400" />
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    placeholder="you@example.com" 
                    className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400/80 text-sm" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                  Password
                </label>
                <div className="flex items-center gap-3 rounded-full bg-[#f5ebe6] px-5 py-3.5 transition focus-within:ring-2 focus-within:ring-primary/20">
                  <Lock size={16} className="text-slate-400" />
                  <input 
                    type="password" 
                    value={formData.password} 
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                    placeholder="Password" 
                    className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400/80 text-sm" 
                    required 
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full rounded-full bg-[#f5ebe6] py-3.5 text-sm font-semibold text-slate-800 hover:bg-[#ebdcd4] transition shadow-sm disabled:opacity-60 mt-2"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="text-xs font-medium text-slate-500 mb-2">
              Enter the 6-digit code sent to <span className="font-semibold text-slate-700">{formData.email}</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              <OtpInput 
                value={otp} 
                onChange={setOtp} 
                numInputs={6} 
                renderInput={(props) => <input {...props} />}
                containerStyle="flex justify-between w-full gap-2"
                inputStyle={{ 
                  width: '100%', 
                  height: '48px', 
                  borderRadius: '9999px', 
                  border: 'none', 
                  background: '#f5ebe6', 
                  color: '#1e293b', 
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
              className="w-full rounded-full bg-[#f5ebe6] py-3.5 text-sm font-semibold text-slate-800 hover:bg-[#ebdcd4] transition disabled:opacity-60 shadow-sm mt-2"
            >
              {loading ? 'Verifying…' : 'Verify & Continue'}
            </button>
          </form>
        )}

        <div className="flex flex-col gap-2.5 text-center text-xs text-slate-500 font-medium pt-2 border-t border-slate-200/50">
          <div>
            Don't have an account?{' '}
            <button type="button" onClick={() => navigate('/signup')} className="text-slate-800 font-semibold hover:underline">
              Sign Up
            </button>
          </div>
          <div className="flex justify-center gap-4">
            <button type="button" onClick={() => navigate('/forgot-password')} className="hover:text-slate-800 hover:underline">
              Forgot password?
            </button>
            <button type="button" onClick={() => navigate('/forgot-username')} className="hover:text-slate-800 hover:underline">
              Forgot username?
            </button>
          </div>
        </div>

        {/* Guest / Preview Mode */}
        <div className="relative flex items-center justify-center pt-1">
          <span className="absolute inset-x-0 top-1/2 h-px bg-slate-200/60" />
          <span className="relative bg-white px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">or</span>
        </div>

        <button
          type="button"
          onClick={handleGuestLogin}
          className="w-full flex items-center justify-center gap-2 rounded-full border-2 border-dashed border-slate-300 bg-white py-3 text-sm font-semibold text-slate-600 hover:border-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all duration-200 shadow-sm"
        >
          <Eye size={16} />
          Continue as Guest
        </button>
        <p className="text-center text-[10px] text-slate-400 -mt-1">
          Preview the app — data is saved locally in your browser
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
