import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, KeyRound, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
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

  return (
    <AuthLayout
      title="Create account"
      subtitle="Sign up to track your money and stay on top of every expense"
      heroImage="https://w.wallhaven.cc/full/gw/wallhaven-gw2yx3.jpg"
      back={() => navigate('/login')}
    >
      <div className="space-y-6">
        {error && <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}

        {step === 1 && (
          <form onSubmit={handleSubmit} className="space-y-5 rounded-[32px] border border-white/10 bg-[#08101c]/95 p-6 shadow-[0_32px_80px_rgba(0,0,0,0.25)] backdrop-blur-md">
            <div className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-white/50">Personal info</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Let’s create your account</h2>
              </div>

              <label className="block text-sm text-white/70">
                Full name
                <div className="mt-3 rounded-2xl border border-white/10 bg-[#0f1220] px-4 py-3 flex items-center gap-3">
                  <User className="text-white/50" />
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your full name"
                    className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
                    required
                  />
                </div>
              </label>

              <label className="block text-sm text-white/70">
                Username
                <div className="mt-3 rounded-2xl border border-white/10 bg-[#0f1220] px-4 py-3 flex items-center gap-3">
                  <KeyRound className="text-white/50" />
                  <input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Choose a username"
                    className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
                    required
                  />
                </div>
              </label>

              <label className="block text-sm text-white/70">
                Email address
                <div className="mt-3 rounded-2xl border border-white/10 bg-[#0f1220] px-4 py-3 flex items-center gap-3">
                  <Mail className="text-white/50" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
                    required
                  />
                </div>
              </label>

              <label className="block text-sm text-white/70">
                Password
                <div className="mt-3 rounded-2xl border border-white/10 bg-[#0f1220] px-4 py-3 flex items-center gap-3">
                  <Lock className="text-white/50" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Create a password"
                    className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-white/50">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <label className="block text-sm text-white/70">
                Confirm password
                <div className="mt-3 rounded-2xl border border-white/10 bg-[#0f1220] px-4 py-3 flex items-center gap-3">
                  <Lock className="text-white/50" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm password"
                    className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-white/50">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
            </div>

            <button type="submit" disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-[#22c55e] to-[#14b8a6] py-4 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60">
              {loading ? 'Sending code…' : 'Create account'}
            </button>

            <div className="text-center text-sm text-white/50">
              Already have an account?{' '}
              <button type="button" onClick={() => navigate('/login')} className="text-white hover:underline">
                Log in
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerify} className="space-y-6 rounded-[32px] border border-white/10 bg-[#08101c]/95 p-6 shadow-[0_32px_80px_rgba(0,0,0,0.25)] backdrop-blur-md">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-white/50">Verify your email</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Enter the 6-digit code</h2>
              <p className="mt-2 text-sm text-white/60">We sent a verification code to {sentEmail}</p>
            </div>

            <div className="grid grid-cols-6 gap-3">
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
                  className="h-14 rounded-3xl border border-white/10 bg-[#0f1220] text-center text-xl font-semibold text-white outline-none"
                />
              ))}
            </div>

            <button type="submit" disabled={loading || otp.join('').length !== 6} className="w-full rounded-2xl bg-gradient-to-r from-[#22c55e] to-[#14b8a6] py-4 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60">
              {loading ? 'Verifying…' : 'Verify & continue'}
            </button>

            <div className="text-center text-sm text-white/50">
              Didn’t receive the code?{' '}
              <button type="button" onClick={handleResend} className="text-white hover:underline">
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
