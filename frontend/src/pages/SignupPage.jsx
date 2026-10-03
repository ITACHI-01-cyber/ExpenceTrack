import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, KeyRound, Eye, EyeOff, LoaderCircle } from 'lucide-react';
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

  const heroTitle = step === 1 ? 'Create your account' : 'Verify your email';
  const heroSubtitle = step === 1 ? 'Start managing your finances.' : 'A quick check to keep your account secure.';

  return (
    <AuthLayout
      title={heroTitle}
      subtitle={heroSubtitle}
      heroImage="https://w.wallhaven.cc/full/qr/wallhaven-qrm855.jpg"
      back={() => navigate('/login')}
    >
      <div className="space-y-5">


        {error && (
          <div role="alert" className="auth-error rounded-xl border px-4 py-3 text-xs font-medium">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="auth-label mb-1.5 ml-1 block text-xs font-semibold uppercase tracking-wider">
                  Name
                </label>
                <div className="auth-field-shell flex items-center gap-3 rounded-[14px] border px-4 py-3 transition">
                  <User size={16} className="auth-field-icon shrink-0" />
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                    className="auth-field-input w-full bg-transparent text-sm outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="auth-label mb-1.5 ml-1 block text-xs font-semibold uppercase tracking-wider">
                  Username
                </label>
                <div className="auth-field-shell flex items-center gap-3 rounded-[14px] border px-4 py-3 transition">
                  <KeyRound size={16} className="auth-field-icon shrink-0" />
                  <input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Username"
                    className="auth-field-input w-full bg-transparent text-sm outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="auth-label mb-1.5 ml-1 block text-xs font-semibold uppercase tracking-wider">
                Email Address
              </label>
              <div className="auth-field-shell flex items-center gap-3 rounded-[14px] border px-4 py-3 transition">
                <Mail size={16} className="auth-field-icon shrink-0" />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="auth-label mb-1.5 ml-1 block text-xs font-semibold uppercase tracking-wider">
                  Password
                </label>
                <div className="auth-field-shell flex items-center gap-3 rounded-[14px] border px-4 py-3 transition">
                  <Lock size={16} className="auth-field-icon shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Password"
                    className="auth-field-input w-full bg-transparent text-sm outline-none"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="auth-password-toggle rounded-lg p-1.5 transition" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="auth-label mb-1.5 ml-1 block text-xs font-semibold uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="auth-field-shell flex items-center gap-3 rounded-[14px] border px-4 py-3 transition">
                  <Lock size={16} className="auth-field-icon shrink-0" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm"
                    className="auth-field-input w-full bg-transparent text-sm outline-none"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="auth-password-toggle rounded-lg p-1.5 transition" aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}>
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="py-1">
              <label className="auth-policy flex cursor-pointer items-center gap-2 text-xs font-semibold">
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
              className="auth-submit mt-1 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[14px] py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <LoaderCircle size={17} className="animate-spin" />}
              {loading ? 'Sending code…' : 'Sign up'}
            </button>

            <div className="auth-links border-t pt-4 text-center text-xs font-medium">
              Already have an account?{' '}
              <button type="button" onClick={() => navigate('/login')} className="auth-link font-bold hover:underline">
                Log in
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <p className="auth-label mb-1 ml-1 text-xs font-semibold uppercase tracking-wider">Verify Email</p>
              <p className="auth-description text-xs font-medium">We sent a verification code to <span className="auth-emphasis font-semibold">{sentEmail}</span></p>
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
                  className="auth-otp-input h-12 rounded-xl border text-center text-lg font-semibold outline-none"
                />
              ))}
            </div>

            <button 
              type="submit" 
              disabled={loading || otp.join('').length !== 6} 
              className="auth-submit mt-1 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[14px] py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <LoaderCircle size={17} className="animate-spin" />}
              {loading ? 'Verifying…' : 'Verify & continue'}
            </button>

            <div className="auth-links border-t pt-4 text-center text-xs font-medium">
              Didn’t receive the code?{' '}
              <button type="button" onClick={handleResend} className="auth-link font-semibold hover:underline">
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
