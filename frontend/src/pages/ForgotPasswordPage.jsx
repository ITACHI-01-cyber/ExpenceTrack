import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
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
    <AuthLayout 
      title="Recover Password" 
      subtitle="Reset your password to log in" 
      heroImage="https://w.wallhaven.cc/full/yq/wallhaven-yqg6r7.jpg"
      back={() => {
        if (step > 1 && step < 4) {
          setStep(step - 1);
        } else {
          navigate('/login');
        }
      }}
    >
      <div className="space-y-6 text-slate-800">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 ml-1">Forgot your password?</p>
              <p className="text-xs text-slate-400 font-medium">Enter your email and we’ll send a code to reset it.</p>
            </div>

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
                    className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400/80 text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full rounded-full bg-[#f5ebe6] py-3.5 text-sm font-semibold text-slate-800 hover:bg-[#ebdcd4] transition shadow-sm disabled:opacity-60 mt-1"
              >
                {loading ? 'Sending code…' : 'Send reset code'}
              </button>

              <div className="text-center text-xs text-slate-500 font-medium pt-2 border-t border-slate-200/50">
                Didn’t receive the code?{' '}
                <button type="button" onClick={handleRequestOtp} className="text-slate-800 font-semibold hover:underline">
                  Resend
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 ml-1">Enter code</p>
              <p className="text-xs text-slate-400 font-medium">We sent a 6-digit verification code to <span className="font-semibold text-slate-600">{email}</span></p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="grid grid-cols-6 gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength="1"
                    className="h-12 rounded-full border-none bg-[#f5ebe6] text-center text-lg font-semibold text-slate-800 outline-none"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  />
                ))}
              </div>

              <button 
                type="submit" 
                className="w-full rounded-full bg-[#f5ebe6] py-3.5 text-sm font-semibold text-slate-800 hover:bg-[#ebdcd4] transition shadow-sm mt-1"
              >
                Verify code
              </button>

              <div className="text-center text-xs text-slate-500 font-medium pt-2 border-t border-slate-200/50">
                Didn’t receive it?{' '}
                <button type="button" onClick={handleRequestOtp} className="text-slate-800 font-semibold hover:underline">
                  Resend code
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 ml-1">New Password</p>
              <p className="text-xs text-slate-400 font-medium">Use a strong password to keep your account secure.</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                    New password
                  </label>
                  <div className="flex items-center gap-3 rounded-full bg-[#f5ebe6] px-5 py-3.5 transition focus-within:ring-2 focus-within:ring-primary/20">
                    <span className="text-slate-400 text-sm">•</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="New password"
                      required
                      className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400/80 text-sm"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600 transition">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                    Confirm password
                  </label>
                  <div className="flex items-center gap-3 rounded-full bg-[#f5ebe6] px-5 py-3.5 transition focus-within:ring-2 focus-within:ring-primary/20">
                    <span className="text-slate-400 text-sm">•</span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      required
                      className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400/80 text-sm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-slate-400 hover:text-slate-600 transition">
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-[#f5ebe6]/40 p-4 text-xs text-slate-500">
                <p className="font-semibold text-slate-700">Password requirements</p>
                <ul className="mt-2 space-y-1.5 list-disc pl-5">
                  <li>At least 8 characters</li>
                  <li>One uppercase letter</li>
                  <li>One special character</li>
                </ul>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full rounded-full bg-[#f5ebe6] py-3.5 text-sm font-semibold text-slate-800 hover:bg-[#ebdcd4] transition shadow-sm disabled:opacity-60 mt-1"
              >
                {loading ? 'Resetting…' : 'Reset password'}
              </button>
            </form>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Password updated!</h3>
              <p className="mt-1 text-xs text-slate-500 font-medium">You can now log in with your new password.</p>
            </div>
            <button 
              onClick={() => navigate('/login')} 
              className="w-full rounded-full bg-[#f5ebe6] py-3.5 text-sm font-semibold text-slate-800 hover:bg-[#ebdcd4] transition shadow-sm"
            >
              Return to login
            </button>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
