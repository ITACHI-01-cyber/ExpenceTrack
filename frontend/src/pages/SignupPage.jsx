import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, KeyRound, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import AuthLayout from '../components/layout/AuthLayout';

const SignupPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [sentEmail, setSentEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const inputRefs = useRef([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register/send-otp', {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      setSentEmail(formData.email);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value && isNaN(value)) return;
    const nextOtp = [...otp];
    nextOtp[index] = value.slice(-1);
    setOtp(nextOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register/verify-otp', {
        email: sentEmail || formData.email,
        code,
      });
      if (response.data.success) {
        const { token, ...userData } = response.data.data;
        login(userData, token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!formData.email) return;
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register/send-otp', {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      setSentEmail(formData.email);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const heroTitle = 'Hello ! Welcome Aboard';
  const heroSubtitle = 'We are glad to see you 😊';

  return (
    <AuthLayout
      title={heroTitle}
      subtitle={heroSubtitle}
      heroImage="https://w.wallhaven.cc/full/qr/wallhaven-qrm855.jpg"
      back={() => navigate('/login')}
    >
      <div className="space-y-6 text-slate-800">


        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                  Name
                </label>
                <div className="flex items-center gap-3 rounded-full bg-[#f5ebe6] px-5 py-3 transition focus-within:ring-2 focus-within:ring-primary/20">
                  <User size={15} className="text-slate-400" />
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                    className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400/80 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                  Username
                </label>
                <div className="flex items-center gap-3 rounded-full bg-[#f5ebe6] px-5 py-3 transition focus-within:ring-2 focus-within:ring-primary/20">
                  <KeyRound size={15} className="text-slate-400" />
                  <input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Username"
                    className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400/80 text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Email Address
              </label>
              <div className="flex items-center gap-3 rounded-full bg-[#f5ebe6] px-5 py-3 transition focus-within:ring-2 focus-within:ring-primary/20">
                <Mail size={15} className="text-slate-400" />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                  Password
                </label>
                <div className="flex items-center gap-3 rounded-full bg-[#f5ebe6] px-5 py-3 transition focus-within:ring-2 focus-within:ring-primary/20">
                  <Lock size={15} className="text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Password"
                    className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400/80 text-sm"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600 transition">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                  Confirm Password
                </label>
                <div className="flex items-center gap-3 rounded-full bg-[#f5ebe6] px-5 py-3 transition focus-within:ring-2 focus-within:ring-primary/20">
                  <Lock size={15} className="text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm"
                    className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400/80 text-sm"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-slate-400 hover:text-slate-600 transition">
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="py-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-500">
                <input 
                  type="checkbox" 
                  required
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary" 
                />
                <span>I agree terms of service and privacy policy</span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full rounded-full bg-[#f5ebe6] py-3.5 text-sm font-semibold text-slate-800 hover:bg-[#ebdcd4] transition shadow-sm disabled:opacity-60 mt-1"
            >
              {loading ? 'Sending code…' : 'Sign up'}
            </button>

            <div className="text-center text-xs text-slate-500 font-medium pt-2 border-t border-slate-200/50">
              Already have an account?{' '}
              <button type="button" onClick={() => navigate('/login')} className="text-slate-800 font-semibold hover:underline">
                Log in
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 ml-1">Verify Email</p>
              <p className="text-xs text-slate-400 font-medium">We sent a verification code to <span className="font-semibold text-slate-600">{sentEmail}</span></p>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="h-12 rounded-full border-none bg-[#f5ebe6] text-center text-lg font-semibold text-slate-800 outline-none"
                />
              ))}
            </div>

            <button 
              type="submit" 
              disabled={loading || otp.join('').length !== 6} 
              className="w-full rounded-full bg-[#f5ebe6] py-3.5 text-sm font-semibold text-slate-800 hover:bg-[#ebdcd4] transition disabled:opacity-60 shadow-sm mt-1"
            >
              {loading ? 'Verifying…' : 'Verify & continue'}
            </button>

            <div className="text-center text-xs text-slate-500 font-medium pt-2 border-t border-slate-200/50">
              Didn’t receive the code?{' '}
              <button type="button" onClick={handleResend} className="text-slate-800 font-semibold hover:underline">
                Resend code
              </button>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};

export default SignupPage;
