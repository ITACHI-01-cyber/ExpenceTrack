import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, KeyRound, User } from 'lucide-react';
import api from '../services/api';
import AuthLayout from '../components/layout/AuthLayout';

const ForgotUsernamePage = () => {
  const [method, setMethod] = useState(''); // 'otp' or 'password'
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-username/request', { email });
      setMessage(response.data.message || 'OTP sent successfully. Check console/email.');
      setMethod('otp');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeViaOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-username/change-via-otp', { email, code, newUsername });
      setMessage('Username changed successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change username');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeViaPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-username/change-via-password', { email, password, newUsername });
      setMessage('Username changed successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change username');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Recover Username" 
      subtitle="Recover or change your username" 
      heroImage="https://w.wallhaven.cc/full/qr/wallhaven-qrm855.jpg"
      back={() => {
        if (step > 1 || method) {
          setStep(1);
          setMethod('');
          setError('');
          setMessage('');
        } else {
          navigate('/login');
        }
      }}
    >
      <div className="space-y-6 text-slate-800">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 font-medium animate-[fade-in_0.3s_ease-out]">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-600 font-medium animate-[fade-in_0.3s_ease-out]">
            {message}
          </div>
        )}

        {step === 1 && !method && (
          <div className="grid gap-4">
            <button 
              onClick={() => { setMethod('otp'); setStep(1); }} 
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left text-slate-800 transition hover:border-primary/30 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-3 text-slate-700 mb-2">
                <Mail size={18} className="text-slate-400" />
                <span className="text-xs font-semibold uppercase tracking-wider">OTP via email</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Send a one-time code to your email to reset your username.</p>
            </button>
            <button 
              onClick={() => { setMethod('password'); setStep(2); }} 
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left text-slate-800 transition hover:border-primary/30 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-3 text-slate-700 mb-2">
                <Lock size={18} className="text-slate-400" />
                <span className="text-xs font-semibold uppercase tracking-wider">Current password</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Use your existing password to confirm identity and update username.</p>
            </button>
          </div>
        )}

        {step === 1 && method === 'otp' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Email Address
              </label>
              <div className="flex items-center gap-3 rounded-full bg-[#f5ebe6] px-5 py-3.5 transition focus-within:ring-2 focus-within:ring-primary/20">
                <Mail size={16} className="text-slate-400" />
                <input 
                  type="email" 
                  placeholder="you@example.com" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400/80 text-sm" 
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full rounded-full bg-[#f5ebe6] py-3.5 text-sm font-semibold text-slate-800 hover:bg-[#ebdcd4] transition shadow-sm disabled:opacity-60 mt-2"
            >
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && method === 'otp' && (
          <form onSubmit={handleChangeViaOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                OTP Code
              </label>
              <div className="flex items-center gap-3 rounded-full bg-[#f5ebe6] px-5 py-3.5 transition focus-within:ring-2 focus-within:ring-primary/20">
                <KeyRound size={16} className="text-slate-400" />
                <input 
                  type="text" 
                  placeholder="6-digit code" 
                  required 
                  maxLength={6} 
                  value={code} 
                  onChange={(e) => setCode(e.target.value)} 
                  className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400/80 text-sm tracking-[0.2em]" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                New Username
              </label>
              <div className="flex items-center gap-3 rounded-full bg-[#f5ebe6] px-5 py-3.5 transition focus-within:ring-2 focus-within:ring-primary/20">
                <User size={16} className="text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Choose new username" 
                  required 
                  value={newUsername} 
                  onChange={(e) => setNewUsername(e.target.value)} 
                  className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400/80 text-sm" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full rounded-full bg-[#f5ebe6] py-3.5 text-sm font-semibold text-slate-800 hover:bg-[#ebdcd4] transition shadow-sm disabled:opacity-60 mt-2"
            >
              {loading ? 'Updating…' : 'Set username'}
            </button>
          </form>
        )}

        {step === 2 && method === 'password' && (
          <form onSubmit={handleChangeViaPassword} className="space-y-4">
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                  Email Address
                </label>
                <div className="flex items-center gap-3 rounded-full bg-[#f5ebe6] px-5 py-3.5 transition focus-within:ring-2 focus-within:ring-primary/20">
                  <Mail size={16} className="text-slate-400" />
                  <input 
                    type="email" 
                    placeholder="you@example.com" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400/80 text-sm" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                  Current Password
                </label>
                <div className="flex items-center gap-3 rounded-full bg-[#f5ebe6] px-5 py-3.5 transition focus-within:ring-2 focus-within:ring-primary/20">
                  <Lock size={16} className="text-slate-400" />
                  <input 
                    type="password" 
                    placeholder="Current password" 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400/80 text-sm" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                  New Username
                </label>
                <div className="flex items-center gap-3 rounded-full bg-[#f5ebe6] px-5 py-3.5 transition focus-within:ring-2 focus-within:ring-primary/20">
                  <User size={16} className="text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Choose new username" 
                    required 
                    value={newUsername} 
                    onChange={(e) => setNewUsername(e.target.value)} 
                    className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400/80 text-sm" 
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full rounded-full bg-[#f5ebe6] py-3.5 text-sm font-semibold text-slate-800 hover:bg-[#ebdcd4] transition shadow-sm disabled:opacity-60 mt-2"
            >
              {loading ? 'Updating…' : 'Set username'}
            </button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};

export default ForgotUsernamePage;
