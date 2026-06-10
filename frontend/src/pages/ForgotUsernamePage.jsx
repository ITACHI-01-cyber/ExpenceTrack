import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, KeyRound, ArrowLeft, User } from 'lucide-react';
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
      const response = await api.post('/auth/forgot-username/change-via-password', { email, password, newUsername });
      setMessage('Username changed successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change username');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Recover Username" subtitle="Recover or change your username" back={() => window.history.back()}>
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-white">Recover your username</h2>
          <p className="mt-2 text-sm text-white/60">Choose how you want to recover or update your username.</p>
        </div>

        {error && <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
        {message && <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">{message}</div>}

        {step === 1 && !method && (
          <div className="grid gap-4">
            <button onClick={() => { setMethod('otp'); setStep(1); }} className="rounded-3xl border border-white/10 bg-[#0f1220] p-5 text-left text-white transition hover:border-white/20">
              <div className="flex items-center gap-3 text-white/70 mb-3">
                <Mail size={18} />
                <span className="text-sm uppercase tracking-[0.24em] text-white/50">OTP via email</span>
              </div>
              <p className="text-sm">Send a one-time code to your email to reset your username.</p>
            </button>
            <button onClick={() => { setMethod('password'); setStep(2); }} className="rounded-3xl border border-white/10 bg-[#0f1220] p-5 text-left text-white transition hover:border-white/20">
              <div className="flex items-center gap-3 text-white/70 mb-3">
                <Lock size={18} />
                <span className="text-sm uppercase tracking-[0.24em] text-white/50">Current password</span>
              </div>
              <p className="text-sm">Use your existing password to confirm identity and update username.</p>
            </button>
          </div>
        )}

        {step === 1 && method === 'otp' && (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-[#0f1220] p-4">
              <label className="block text-sm text-white/70">Email address</label>
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#08101c] px-4 py-3">
                <Mail className="text-white/50" />
                <input type="email" placeholder="Email address" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent text-white outline-none placeholder:text-white/30" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-[#ef4444] to-[#f59e0b] py-4 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60">
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && method === 'otp' && (
          <form onSubmit={handleChangeViaOtp} className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-[#0f1220] p-4">
              <label className="block text-sm text-white/70">OTP code</label>
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#08101c] px-4 py-3">
                <KeyRound className="text-white/50" />
                <input type="text" placeholder="6-digit OTP" required maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} className="w-full bg-transparent text-white outline-none placeholder:text-white/30 tracking-[0.2em]" />
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0f1220] p-4">
              <label className="block text-sm text-white/70">New username</label>
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#08101c] px-4 py-3">
                <User className="text-white/50" />
                <input type="text" placeholder="New username" required value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full bg-transparent text-white outline-none placeholder:text-white/30" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-[#22c55e] to-[#14b8a6] py-4 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60">
              {loading ? 'Updating…' : 'Set username'}
            </button>
          </form>
        )}

        {step === 2 && method === 'password' && (
          <form onSubmit={handleChangeViaPassword} className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-[#0f1220] p-4">
              <label className="block text-sm text-white/70">Email address</label>
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#08101c] px-4 py-3">
                <Mail className="text-white/50" />
                <input type="email" placeholder="Email address" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent text-white outline-none placeholder:text-white/30" />
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0f1220] p-4">
              <label className="block text-sm text-white/70">Current password</label>
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#08101c] px-4 py-3">
                <Lock className="text-white/50" />
                <input type="password" placeholder="Current password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent text-white outline-none placeholder:text-white/30" />
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0f1220] p-4">
              <label className="block text-sm text-white/70">New username</label>
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#08101c] px-4 py-3">
                <User className="text-white/50" />
                <input type="text" placeholder="New username" required value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full bg-transparent text-white outline-none placeholder:text-white/30" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-[#22c55e] to-[#14b8a6] py-4 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60">
              {loading ? 'Updating…' : 'Set username'}
            </button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};

export default ForgotUsernamePage;
