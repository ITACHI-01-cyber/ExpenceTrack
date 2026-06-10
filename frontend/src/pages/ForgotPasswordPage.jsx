import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import AuthLayout from '../components/layout/AuthLayout';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  
  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email) return;
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password/request', { email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Focus next input
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    // We don't verify OTP immediately with the backend in this flow without resetting password, 
    // unless backend has a specific verify endpoint. 
    // Since backend resets directly, we will just move to step 3 and send it all together later.
    // However, to make it realistic, we'll assume the code is valid to proceed to Step 3.
    setStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const code = otp.join('');
      await api.post('/auth/forgot-password/reset', { email, code, newPassword });
      setStep(4); // Success step
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Invalid OTP?');
      if (err.response?.status === 400) {
        setStep(2); // Go back to OTP if invalid
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot password" subtitle="Recover access to your account" back={() => window.history.back()}>
      <div className="space-y-6">
        {error && <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}

        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white">Forgot your password?</h2>
              <p className="mt-2 text-sm text-white/60">Enter your email and we’ll send a code to reset it.</p>
            </div>

            <form onSubmit={handleRequestOtp} className="space-y-5">
              <label className="block text-sm text-white/70">
                Email address
                <div className="mt-3 rounded-2xl border border-white/10 bg-[#0f1220] px-4 py-3">
                  <div className="flex items-center gap-3 text-white/50">
                    <Mail size={18} />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      required
                      className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </label>

              <button type="submit" disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-[#ef4444] to-[#f59e0b] py-4 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60">
                {loading ? 'Sending code…' : 'Send reset code'}
              </button>

              <div className="text-center text-sm text-white/50">
                Didn’t receive the code? <button type="button" onClick={handleRequestOtp} className="text-white hover:underline">Resend</button>
              </div>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white">Enter verification code</h2>
              <p className="mt-2 text-sm text-white/60">We sent a 6-digit code to {email}.</p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="grid grid-cols-6 gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength="1"
                    className="h-14 rounded-3xl border border-white/10 bg-[#0f1220] text-center text-xl font-semibold text-white outline-none"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  />
                ))}
              </div>

              <button type="submit" className="w-full rounded-2xl bg-[#2563eb] py-4 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]">
                Verify code
              </button>

              <div className="text-center text-sm text-white/50">
                Didn’t receive it? <button type="button" onClick={handleRequestOtp} className="text-white hover:underline">Resend code</button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white">Create a new password</h2>
              <p className="mt-2 text-sm text-white/60">Use a strong password to keep your account secure.</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-5">
              <label className="block text-sm text-white/70">
                New password
                <div className="mt-3 rounded-2xl border border-white/10 bg-[#0f1220] px-4 py-3 flex items-center gap-3">
                  <span className="text-white/40">••</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New password"
                    required
                    className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-white/50">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <label className="block text-sm text-white/70">
                Confirm password
                <div className="mt-3 rounded-2xl border border-white/10 bg-[#0f1220] px-4 py-3 flex items-center gap-3">
                  <span className="text-white/40">••</span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    required
                    className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-white/50">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                <p className="font-semibold text-white">Password requirements</p>
                <ul className="mt-3 space-y-2 list-disc pl-5 text-white/50">
                  <li>At least 8 characters</li>
                  <li>One uppercase letter</li>
                  <li>One special character</li>
                </ul>
              </div>

              <button type="submit" disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-[#22c55e] to-[#14b8a6] py-4 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60">
                {loading ? 'Resetting…' : 'Reset password'}
              </button>
            </form>
          </div>
        )}

        {step === 4 && (
          <div className="rounded-[32px] border border-white/10 bg-[#0a1420]/90 p-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-2xl font-semibold text-white">Password updated!</h3>
            <p className="mt-2 text-sm text-white/60">You can now log in with your new password.</p>
            <button onClick={() => navigate('/login')} className="mt-8 w-full rounded-2xl bg-[#2563eb] py-4 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]">
              Return to login
            </button>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
