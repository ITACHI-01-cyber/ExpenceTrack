import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, KeyRound, ArrowLeft, User } from 'lucide-react';
import api from '../services/api';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#503fb0] via-[#984399] to-[#db3c7f] p-4 font-sans">
      <div className="w-full max-w-[500px] bg-white rounded-[10px] p-10 md:p-14 shadow-2xl relative">
        <button onClick={() => step === 1 && !method ? navigate('/login') : setStep(1)} className="absolute top-6 left-6 text-[#999999] hover:text-[#57b846] transition-colors flex items-center gap-1">
          <ArrowLeft size={16} /> Back
        </button>
        
        <h2 className="text-[28px] font-bold text-[#333333] text-center mb-8 tracking-tight mt-6">
          Recover / Change Username
        </h2>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center border border-red-100">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-6 text-sm text-center border border-green-100">
            {message}
          </div>
        )}

        {step === 1 && !method && (
          <div className="flex flex-col gap-4">
            <p className="text-[#666666] text-[14px] text-center mb-2">
              How would you like to recover or change your username?
            </p>
            <button 
              onClick={() => { setMethod('otp'); setStep(1); }}
              className="w-full bg-[#e6e6e6] hover:bg-[#d4d4d4] text-[#333333] rounded-xl py-4 text-[15px] font-bold transition-colors flex flex-col items-center gap-2"
            >
              <Mail className="w-6 h-6 text-[#666666]" />
              <span>Send OTP to Email</span>
            </button>
            <button 
              onClick={() => { setMethod('password'); setStep(2); }}
              className="w-full bg-[#e6e6e6] hover:bg-[#d4d4d4] text-[#333333] rounded-xl py-4 text-[15px] font-bold transition-colors flex flex-col items-center gap-2"
            >
              <Lock className="w-6 h-6 text-[#666666]" />
              <span>Use Current Password</span>
            </button>
          </div>
        )}

        {step === 1 && method === 'otp' && (
          <form onSubmit={handleRequestOtp} className="flex flex-col">
            <p className="text-[#666666] text-[14px] text-center mb-6">
              Enter your email address to receive an OTP.
            </p>
            <div className="bg-[#e6e6e6] rounded-full flex items-center px-6 py-4 mb-6">
              <Mail className="text-[#666666] w-5 h-5 mr-3" />
              <input 
                type="email" 
                placeholder="Email Address"
                required
                className="bg-transparent flex-1 outline-none text-[#333333] placeholder-[#999999] text-[15px] font-medium w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#57b846] hover:bg-[#333333] text-white rounded-full py-4 text-[15px] font-bold uppercase tracking-wider transition-colors disabled:opacity-70"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && method === 'otp' && (
          <form onSubmit={handleChangeViaOtp} className="flex flex-col">
            <p className="text-[#666666] text-[14px] text-center mb-6">
              Enter the OTP sent to your email to set a new username.
            </p>
            <div className="bg-[#e6e6e6] rounded-full flex items-center px-6 py-4 mb-4">
              <KeyRound className="text-[#666666] w-5 h-5 mr-3" />
              <input 
                type="text" 
                placeholder="6-Digit OTP"
                required
                maxLength="6"
                className="bg-transparent flex-1 outline-none text-[#333333] placeholder-[#999999] text-[15px] font-medium w-full tracking-widest"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div className="bg-[#e6e6e6] rounded-full flex items-center px-6 py-4 mb-6">
              <User className="text-[#666666] w-5 h-5 mr-3" />
              <input 
                type="text" 
                placeholder="New Username"
                required
                className="bg-transparent flex-1 outline-none text-[#333333] placeholder-[#999999] text-[15px] font-medium w-full"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#57b846] hover:bg-[#333333] text-white rounded-full py-4 text-[15px] font-bold uppercase tracking-wider transition-colors disabled:opacity-70"
            >
              {loading ? 'Updating...' : 'Set Username'}
            </button>
          </form>
        )}

        {step === 2 && method === 'password' && (
          <form onSubmit={handleChangeViaPassword} className="flex flex-col">
            <p className="text-[#666666] text-[14px] text-center mb-6">
              Verify your identity with your email and password to change your username.
            </p>
            <div className="bg-[#e6e6e6] rounded-full flex items-center px-6 py-4 mb-4">
              <Mail className="text-[#666666] w-5 h-5 mr-3" />
              <input 
                type="email" 
                placeholder="Email Address"
                required
                className="bg-transparent flex-1 outline-none text-[#333333] placeholder-[#999999] text-[15px] font-medium w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="bg-[#e6e6e6] rounded-full flex items-center px-6 py-4 mb-4">
              <Lock className="text-[#666666] w-5 h-5 mr-3" />
              <input 
                type="password" 
                placeholder="Current Password"
                required
                className="bg-transparent flex-1 outline-none text-[#333333] placeholder-[#999999] text-[15px] font-medium w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="bg-[#e6e6e6] rounded-full flex items-center px-6 py-4 mb-6">
              <User className="text-[#666666] w-5 h-5 mr-3" />
              <input 
                type="text" 
                placeholder="New Username"
                required
                className="bg-transparent flex-1 outline-none text-[#333333] placeholder-[#999999] text-[15px] font-medium w-full"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#57b846] hover:bg-[#333333] text-white rounded-full py-4 text-[15px] font-bold uppercase tracking-wider transition-colors disabled:opacity-70"
            >
              {loading ? 'Updating...' : 'Set Username'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotUsernamePage;
