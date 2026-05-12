import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import useAuthStore from '../store/authStore';
import Button from '../components/ui/Button';
import api from '../services/api';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;
        
      const response = await api.post(endpoint, payload);
      
      if (response.data.success) {
        const { token, email, name } = response.data.data;
        login({ email, name }, token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-white rounded-card shadow-card w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Star fill="currentColor" size={32} />
            <span className="text-3xl font-bold">Zealz</span>
          </div>
          <p className="text-neutral-muted">Manage your expenses effortlessly</p>
        </div>

        {error && (
          <div className="bg-danger/10 text-danger p-3 rounded-btn mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-neutral-text mb-1">Full Name</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-2 rounded-input border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-neutral-text mb-1">Email</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-2 rounded-input border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-text mb-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-2 rounded-input border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <Button type="submit" className="w-full mt-6" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-muted">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-medium hover:underline"
          >
            {isLogin ? 'Register' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
