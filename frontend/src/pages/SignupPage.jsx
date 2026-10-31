import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LoaderCircle } from 'lucide-react';
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
      title={step === 1 ? 'Create account' : 'Verify your email'}
      subtitle={step === 1 ? 'Please enter your details to register.' : 'A quick check to keep your account secure.'}
      back={() => (step === 2 ? setStep(1) : navigate('/login'))}
    >
      <div className="space-y-4">
        {error && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600 text-center">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-400 md:hidden">Username</label>
              <input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Username"
                className="w-full rounded-full border border-neutral-700 bg-[#1E1E24] px-5 py-3 text-xs text-white placeholder:text-neutral-500 focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] outline-none transition md:border-gray-200 md:bg-white md:text-neutral-900 md:placeholder:text-neutral-400 md:focus:border-[#F59E0B] md:focus:ring-2 md:focus:ring-[#F59E0B]/20"
                required
              />
            </div>

            <div className="hidden md:block">
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
                className="w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 outline-none transition"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-400 md:hidden">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email"
                  className="w-full rounded-full border border-neutral-700 bg-[#1E1E24] px-5 py-3 pr-11 text-xs text-white placeholder:text-neutral-500 focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] outline-none transition md:border-gray-200 md:bg-white md:text-neutral-900 md:placeholder:text-neutral-400 md:focus:border-[#F59E0B] md:focus:ring-2 md:focus:ring-[#F59E0B]/20"
                  required
                />
                <Mail size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 md:text-neutral-300" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-400 md:hidden">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Password"
                  className="w-full rounded-full border border-neutral-700 bg-[#1E1E24] px-5 py-3 pr-11 text-xs text-white placeholder:text-neutral-500 focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] outline-none transition md:border-gray-200 md:bg-white md:text-neutral-900 md:placeholder:text-neutral-400 md:focus:border-[#F59E0B] md:focus:ring-2 md:focus:ring-[#F59E0B]/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white md:hover:text-neutral-700 transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-400 md:hidden">Confirm password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm password"
                  className="w-full rounded-full border border-neutral-700 bg-[#1E1E24] px-5 py-3 pr-11 text-xs text-white placeholder:text-neutral-500 focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] outline-none transition md:border-gray-200 md:bg-white md:text-neutral-900 md:placeholder:text-neutral-400 md:focus:border-[#F59E0B] md:focus:ring-2 md:focus:ring-[#F59E0B]/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white md:hover:text-neutral-700 transition"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="px-1 pt-1">
              <label className="flex cursor-pointer items-center gap-2 text-[11px] text-neutral-400 md:text-neutral-500 font-medium select-none">
                <input 
                  type="checkbox" 
                  required
                  className="h-3.5 w-3.5 rounded border-neutral-700 bg-transparent text-[#F59E0B] focus:ring-[#F59E0B] md:border-gray-300" 
                />
                <span>I agree to the Terms & Privacy Policy</span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="mt-3 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-[#F5EFEB] py-3 text-xs font-bold text-neutral-900 shadow-md hover:opacity-90 transition md:bg-gradient-to-r md:from-[#F59E0B] md:to-[#F97316] md:text-white md:shadow-[#F59E0B]/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <LoaderCircle size={16} className="animate-spin" />}
              {loading ? 'Sending code…' : 'Sign Up'}
            </button>

            <div className="pt-2 text-center text-[11px] text-neutral-400 md:text-neutral-500">
              Already have an account?{' '}
              <button type="button" onClick={() => navigate('/login')} className="font-bold text-white md:text-neutral-900 hover:underline">
                Log In
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="text-center text-xs text-neutral-400 md:text-neutral-500">
              We sent a verification code to <span className="font-semibold text-white md:text-neutral-800">{sentEmail}</span>
            </div>

            <div className="grid grid-cols-6 gap-2 py-2">
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
                  className="h-11 w-full rounded-2xl border border-neutral-700 bg-[#1E1E24] text-center text-base font-bold text-white outline-none focus:border-[#F59E0B] transition md:border-gray-200 md:bg-white md:text-neutral-900"
                />
              ))}
            </div>

            <button 
              type="submit" 
              disabled={loading || otp.join('').length !== 6} 
              className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#F97316] py-3 text-xs font-bold text-white shadow-md hover:opacity-95 transition disabled:opacity-60"
            >
              {loading && <LoaderCircle size={16} className="animate-spin" />}
              {loading ? 'Verifying…' : 'Verify & Continue'}
            </button>

            <div className="pt-2 text-center text-[11px] text-neutral-400 md:text-neutral-500">
              Didn’t receive the code?{' '}
              <button type="button" onClick={handleResend} className="font-semibold text-white md:text-neutral-900 hover:underline">
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
