import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, ArrowRight, KeyRound, ArrowLeft } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import OtpInput from 'react-otp-input';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [authStep, setAuthStep] = useState('credentials'); // 'credentials' or 'otp'
  const [otp, setOtp] = useState('');
  
  const [formData, setFormData] = useState({ name: '', username: '', identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        const payload = { identifier: formData.identifier, password: formData.password };
        const response = await api.post('/auth/login', payload);
        if (response.data.success) {
          const { token, ...userData } = response.data.data;
          login(userData, token);
          navigate('/dashboard');
        }
      } else {
        const endpoint = '/auth/register/send-otp';
        const payload = { name: formData.name, username: formData.username, email: formData.identifier, password: formData.password };
        await api.post(endpoint, payload);
        setAuthStep('otp');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }
    setError('');
    setLoading(true);
    
    try {
      const endpoint = '/auth/register/verify-otp';
      const payload = { email: formData.identifier, code: otp };
        
      const response = await api.post(endpoint, payload);
      
      if (response.data.success) {
        const { token, ...userData } = response.data.data;
        login(userData, token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
      // If error is Max attempts reached, we probably should redirect back
      if (err.response?.data?.message?.includes('Max attempts')) {
        setTimeout(() => setAuthStep('credentials'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#503fb0] via-[#984399] to-[#db3c7f] p-4 font-sans">
      <div className="w-full max-w-[960px] bg-white rounded-[10px] overflow-hidden flex flex-col md:flex-row shadow-2xl md:h-[600px] relative">
        
        {/* Left Side - Illustration */}
        <div className="hidden md:flex w-1/2 relative items-center justify-center bg-white">
          <div className="relative w-[300px] h-[300px] bg-[#f2f2f2] rounded-full flex items-center justify-center mt-[-20px]">
            {/* Monitor Illustration */}
            <div className="flex flex-col items-center z-10">
              <div className="w-[160px] h-[110px] bg-[#4a5568] rounded-t-lg rounded-b-sm border-[4px] border-[#2d3748] flex items-center justify-center relative">
                  <User size={60} className="text-[#a0aec0] stroke-1" />
              </div>
              <div className="w-[30px] h-[20px] bg-[#cbd5e0]"></div>
              <div className="w-[120px] h-[5px] bg-[#e2e8f0] rounded-full"></div>
            </div>

            {/* Floating Shapes */}
            <div className="absolute top-[35px] left-[35px] w-3 h-3 rounded-full border-[2px] border-teal-400"></div>
            <svg className="absolute top-[60px] right-[-10px] w-5 h-5 text-green-400 rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L22 20H2L12 2Z" /></svg>
            <svg className="absolute bottom-[60px] left-[-20px] w-5 h-5 text-green-400 -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L22 20H2L12 2Z" /></svg>
            <div className="absolute bottom-[70px] right-[25px] w-2.5 h-2.5 rounded-full bg-cyan-400"></div>
            
            <div className="absolute top-[25%] right-[10%] w-2 h-2 border border-gray-300 rounded-[2px] rotate-12"></div>
            <div className="absolute bottom-[25%] left-[20%] w-2 h-2 border border-gray-300 rounded-[2px] -rotate-12"></div>
            <div className="absolute top-[10%] left-[50%] w-1.5 h-1.5 border border-gray-300 rounded-[2px] rotate-45"></div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-10 md:p-14 bg-white flex flex-col justify-center relative">
          
          {authStep === 'otp' && (
            <button 
              onClick={() => setAuthStep('credentials')} 
              className="absolute top-6 left-6 text-[#999999] hover:text-[#57b846] transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}

          {authStep === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="flex flex-col w-full max-w-[320px] mx-auto h-full">
              <div className="flex-1 flex flex-col justify-center">
                <h2 className="text-[28px] font-bold text-[#333333] text-center mb-10 tracking-tight">
                  {isLogin ? 'Member Login' : 'Sign Up'}
                </h2>
                
                {error && (
                  <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center border border-red-100">
                    {error}
                  </div>
                )}

                {!isLogin && (
                  <div className="bg-[#e6e6e6] rounded-full flex items-center px-6 py-4 mb-4">
                    <User className="text-[#666666] w-5 h-5 mr-3" />
                    <input 
                      type="text" 
                      placeholder="Full Name"
                      required
                      className="bg-transparent flex-1 outline-none text-[#333333] placeholder-[#999999] text-[15px] font-medium w-full"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                )}

                {!isLogin && (
                  <div className="bg-[#e6e6e6] rounded-full flex items-center px-6 py-4 mb-4">
                    <User className="text-[#666666] w-5 h-5 mr-3" />
                    <input 
                      type="text" 
                      placeholder="Username"
                      required
                      className="bg-transparent flex-1 outline-none text-[#333333] placeholder-[#999999] text-[15px] font-medium w-full"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                    />
                  </div>
                )}

                <div className="bg-[#e6e6e6] rounded-full flex items-center px-6 py-4 mb-4">
                  <Mail className="text-[#666666] w-5 h-5 mr-3" />
                  <input 
                    type={isLogin ? "text" : "email"} 
                    placeholder={isLogin ? "Email or Username" : "Email"}
                    required
                    className="bg-transparent flex-1 outline-none text-[#333333] placeholder-[#999999] text-[15px] font-medium w-full"
                    value={formData.identifier}
                    onChange={(e) => setFormData({...formData, identifier: e.target.value})}
                  />
                </div>

                <div className="bg-[#e6e6e6] rounded-full flex items-center px-6 py-4 mb-6">
                  <Lock className="text-[#666666] w-5 h-5 mr-3" />
                  <input 
                    type="password" 
                    placeholder="Password"
                    required
                    className="bg-transparent flex-1 outline-none text-[#333333] placeholder-[#999999] text-[15px] font-medium w-full"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#57b846] hover:bg-[#333333] text-white rounded-full py-4 text-[15px] font-bold uppercase tracking-wider transition-colors disabled:opacity-70 mt-2 mb-8"
                >
                  {loading ? '...' : (isLogin ? 'Login' : 'Sign Up')}
                </button>

                {isLogin && (
                  <div className="text-center flex flex-col gap-2">
                    <div>
                      <span className="text-[#999999] text-[13px]">Forgot </span>
                      <button type="button" onClick={() => navigate('/forgot-username')} className="text-[#999999] text-[13px] hover:text-[#57b846] transition-colors">
                        Username?
                      </button>
                    </div>
                    <div>
                      <span className="text-[#999999] text-[13px]">Forgot </span>
                      <button type="button" onClick={() => navigate('/forgot-password')} className="text-[#999999] text-[13px] hover:text-[#57b846] transition-colors">
                        Password?
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-8 text-center">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className="text-[#666666] text-[14px] hover:text-[#57b846] transition-colors inline-flex items-center"
                >
                  {isLogin ? 'Create your Account' : 'Already have an account? Login'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="flex flex-col w-full max-w-[320px] mx-auto h-full">
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-[#f2f2f2] rounded-full flex items-center justify-center">
                    <KeyRound className="w-8 h-8 text-[#57b846]" />
                  </div>
                </div>
                
                <h2 className="text-[28px] font-bold text-[#333333] text-center mb-2 tracking-tight">
                  Verification Code
                </h2>
                <p className="text-[#666666] text-[14px] text-center mb-10">
                  Please enter the 6-digit OTP sent to your email.
                </p>
                
                {error && (
                  <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center border border-red-100">
                    {error}
                  </div>
                )}

                <div className="flex justify-center mb-8">
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    numInputs={6}
                    renderSeparator={<span className="w-2"></span>}
                    renderInput={(props) => <input {...props} />}
                    inputStyle={{
                      width: "40px",
                      height: "50px",
                      margin: "0 2px",
                      fontSize: "20px",
                      borderRadius: "8px",
                      border: "2px solid #e6e6e6",
                      backgroundColor: "#f9f9f9",
                      color: "#333333",
                      fontWeight: "bold",
                      outline: "none"
                    }}
                    containerStyle={{
                      display: "flex",
                      justifyContent: "center"
                    }}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-[#57b846] hover:bg-[#333333] text-white rounded-full py-4 text-[15px] font-bold uppercase tracking-wider transition-colors disabled:opacity-70 mt-2 mb-4"
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>
                
                <div className="text-center">
                  <span className="text-[#999999] text-[13px]">Didn't receive the code? </span>
                  <button 
                    type="button" 
                    onClick={handleCredentialsSubmit} 
                    disabled={loading}
                    className="text-[#57b846] text-[13px] hover:underline font-bold disabled:opacity-50"
                  >
                    Resend
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
