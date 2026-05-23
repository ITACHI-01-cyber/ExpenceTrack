import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

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
    <div className="min-h-screen flex items-center justify-center bg-[#f4f6fa] p-4 font-sans text-[#333333]">
      <div className="w-full max-w-[400px] bg-white rounded-[32px] p-8 shadow-sm relative min-h-[600px] flex flex-col">
        
        {step < 4 && (
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : navigate('/login')} 
            className="text-[#333333] hover:text-black transition-colors mb-6"
          >
            <ArrowLeft size={24} />
          </button>
        )}

        {/* Step 1: Email */}
        {step === 1 && (
          <div className="flex-1 flex flex-col">
            <h2 className="text-[24px] font-bold mb-2">Forget your password</h2>
            <p className="text-[#888888] text-[14px] mb-8">
              Please enter your email to send the reset code to it
            </p>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <form onSubmit={handleRequestOtp} className="flex-1 flex flex-col">
              <div className="mb-2 ml-2">
                <label className="text-[14px] font-medium text-[#333333]">Email</label>
              </div>
              <div className="bg-[#f2f2f2] rounded-full flex items-center px-4 py-3.5 mb-auto">
                <Mail className="text-[#888888] w-5 h-5 mr-3" />
                <input 
                  type="email" 
                  placeholder="ex@gmail.com"
                  required
                  className="bg-transparent flex-1 outline-none text-[#333333] placeholder-[#aaaaaa] text-[15px]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="mt-8">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#360568] text-white rounded-full py-4 text-[16px] font-medium transition-colors disabled:opacity-70 mb-4"
                >
                  {loading ? 'Sending...' : 'Send code'}
                </button>
                <div className="text-center">
                  <span className="text-[#888888] text-[13px]">Don't receive the code? </span>
                  <button type="button" onClick={() => handleRequestOtp()} className="text-[#333333] font-medium text-[13px] hover:underline">
                    Resend Code
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: OTP Code */}
        {step === 2 && (
          <div className="flex-1 flex flex-col">
            <h2 className="text-[24px] font-bold mb-2">Forget your password</h2>
            <p className="text-[#888888] text-[14px] mb-8">
              Please enter the code that sent to {email}
            </p>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <form onSubmit={handleVerifyOtp} className="flex-1 flex flex-col">
              <div className="flex justify-between gap-2 mb-auto px-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    maxLength="1"
                    className="w-12 h-12 md:w-10 md:h-12 border-2 border-transparent bg-blue-50 focus:bg-white focus:border-blue-200 rounded-lg text-center text-xl font-bold text-[#333333] outline-none transition-all"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  />
                ))}
              </div>

              <div className="mt-8">
                <button 
                  type="submit" 
                  className="w-full bg-[#360568] text-white rounded-full py-4 text-[16px] font-medium transition-colors mb-4"
                >
                  Verify
                </button>
                <div className="text-center">
                  <span className="text-[#888888] text-[13px]">Don't receive the code? </span>
                  <button type="button" onClick={() => handleRequestOtp()} className="text-[#333333] font-medium text-[13px] hover:underline">
                    Resend Code
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <div className="flex-1 flex flex-col">
            <h2 className="text-[24px] font-bold mb-2">Create a secure password</h2>
            <p className="text-[#888888] text-[14px] mb-8">
              Please enter a strong password and keep it well
            </p>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <form onSubmit={handleResetPassword} className="flex-1 flex flex-col">
              <div className="mb-2 ml-2">
                <label className="text-[14px] font-medium text-[#333333]">New password</label>
              </div>
              <div className="bg-[#f2f2f2] rounded-full flex items-center px-4 py-3 mb-4">
                <span className="text-[#888888] font-bold tracking-widest mr-3">**</span>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="new password"
                  required
                  className="bg-transparent flex-1 outline-none text-[#333333] placeholder-[#aaaaaa] text-[15px]"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[#888888]">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="mb-2 ml-2">
                <label className="text-[14px] font-medium text-[#333333]">Confirm new password</label>
              </div>
              <div className="bg-[#f2f2f2] rounded-full flex items-center px-4 py-3 mb-6">
                <span className="text-[#888888] font-bold tracking-widest mr-3">**</span>
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="confirm new password"
                  required
                  className="bg-transparent flex-1 outline-none text-[#333333] placeholder-[#aaaaaa] text-[15px]"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-[#888888]">
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="mb-auto">
                <p className="text-[13px] font-medium text-[#333333] mb-2">Must contain at least:</p>
                <ul className="text-[#888888] text-[13px] list-disc pl-5 space-y-1">
                  <li>8 characters</li>
                  <li>1 upper case character</li>
                  <li>1 special character</li>
                </ul>
              </div>

              <div className="mt-8">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#360568] text-white rounded-full py-4 text-[16px] font-medium transition-colors disabled:opacity-70 mb-4"
                >
                  {loading ? 'Resetting...' : 'Reset'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 4: Success Modal */}
        {step === 4 && (
          <div className="absolute inset-0 bg-black/20 rounded-[32px] flex items-center justify-center p-4 backdrop-blur-sm z-10">
            <div className="bg-white rounded-[24px] p-8 w-full shadow-2xl relative flex flex-col items-center animate-in zoom-in-95 duration-200">
              <button onClick={() => navigate('/login')} className="absolute top-4 left-4 text-[#888888] hover:text-black">
                <ArrowLeft size={20} />
              </button>
              
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-6 mt-4 text-green-500">
                <CheckCircle2 size={32} />
              </div>
              
              <h3 className="text-[18px] font-bold text-[#333333] mb-8 text-center">
                Password changed successfully
              </h3>
              
              <button 
                onClick={() => navigate('/login')}
                className="w-full bg-[#360568] text-white rounded-full py-3 text-[16px] font-medium transition-colors"
              >
                Log in
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
