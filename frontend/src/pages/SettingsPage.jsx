import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import TopBar from '../components/layout/TopBar';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import Button from '../components/ui/Button';
import { UserCircle, Palette, CreditCard, Mail } from 'lucide-react';

const SettingsPage = () => {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Local state for forms
  const [name, setName] = useState(user?.name || '');
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
  const [theme, setTheme] = useState(user?.theme || 'light');
  const [accentColor, setAccentColor] = useState(user?.accentColor || 'purple');
  const [currency, setCurrency] = useState(user?.currency || 'INR');
  const [gmailConnected, setGmailConnected] = useState(user?.gmailConnected || false);

  const saveSettings = async (updates) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await api.put('/users/settings', updates);
      if (res.data.success) {
        updateUser(res.data.data);
        setMessage('Settings saved successfully!');
        
        // If theme or accent color changed, apply it globally
        if (updates.theme) {
            document.body.className = updates.theme;
        }
        if (updates.accentColor) {
            document.body.setAttribute('data-accent', updates.accentColor);
        }
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to save settings.');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    saveSettings({ name, profilePicture });
  };

  const handleAppearanceSave = (e) => {
    e.preventDefault();
    saveSettings({ theme, accentColor });
  };

  const handlePreferencesSave = (e) => {
    e.preventDefault();
    saveSettings({ currency });
  };

  const simulateGmailConnect = () => {
    setLoading(true);
    setTimeout(() => {
      setGmailConnected(true);
      saveSettings({ gmailConnected: true });
    }, 1500);
  };

  const simulateGmailDisconnect = () => {
    setGmailConnected(false);
    saveSettings({ gmailConnected: false });
  };

  return (
    <Layout>
      <TopBar title="Settings" />
      
      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-neutral-100 p-4 border-r border-border flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'profile' ? 'bg-primary text-white shadow-md' : 'text-neutral-muted hover:bg-white'}`}
          >
            <UserCircle size={18} /> Profile
          </button>
          <button 
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'appearance' ? 'bg-primary text-white shadow-md' : 'text-neutral-muted hover:bg-white'}`}
          >
            <Palette size={18} /> Appearance
          </button>
          <button 
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'preferences' ? 'bg-primary text-white shadow-md' : 'text-neutral-muted hover:bg-white'}`}
          >
            <CreditCard size={18} /> Preferences
          </button>
          <button 
            onClick={() => setActiveTab('integrations')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === 'integrations' ? 'bg-primary text-white shadow-md' : 'text-neutral-muted hover:bg-white'}`}
          >
            <Mail size={18} /> Integrations
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 relative">
          {message && (
            <div className="absolute top-4 right-8 bg-success/20 text-success px-4 py-2 rounded-md text-sm font-medium animate-[fade-in_0.3s_ease-out_both]">
              {message}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="animate-[fade-in_0.3s_ease-out_both]">
              <h2 className="text-xl font-bold mb-6 text-neutral-text">Profile Settings</h2>
              <form onSubmit={handleProfileSave} className="max-w-md space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-muted mb-2">Profile Picture (URL)</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl overflow-hidden shrink-0">
                      {profilePicture ? <img src={profilePicture} alt="Avatar" className="w-full h-full object-cover" /> : name.charAt(0)}
                    </div>
                    <input 
                      type="url" 
                      value={profilePicture} 
                      onChange={(e) => setProfilePicture(e.target.value)} 
                      placeholder="https://example.com/avatar.jpg"
                      className="flex-1 border border-border rounded-input p-2 bg-white text-sm" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-muted mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required
                    className="w-full border border-border rounded-input p-2 bg-white text-sm" 
                  />
                </div>
                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Profile'}</Button>
              </form>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="animate-[fade-in_0.3s_ease-out_both]">
              <h2 className="text-xl font-bold mb-6 text-neutral-text">Appearance</h2>
              <form onSubmit={handleAppearanceSave} className="max-w-md space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-muted mb-2">Theme</label>
                  <div className="flex gap-4">
                    <label className={`flex-1 border p-4 rounded-xl cursor-pointer text-center ${theme === 'light' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border'}`}>
                      <input type="radio" name="theme" value="light" checked={theme === 'light'} onChange={() => setTheme('light')} className="sr-only" />
                      <span className="font-medium">Light</span>
                    </label>
                    <label className={`flex-1 border p-4 rounded-xl cursor-pointer text-center ${theme === 'dark' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border'}`}>
                      <input type="radio" name="theme" value="dark" checked={theme === 'dark'} onChange={() => setTheme('dark')} className="sr-only" />
                      <span className="font-medium">Dark</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-muted mb-2">Accent Color</label>
                  <div className="flex gap-4">
                    {['purple', 'blue', 'green'].map(color => (
                      <label key={color} className={`w-12 h-12 rounded-full cursor-pointer flex items-center justify-center ${accentColor === color ? 'ring-4 ring-offset-2 ring-neutral-300' : ''}`}>
                        <input type="radio" name="accentColor" value={color} checked={accentColor === color} onChange={() => setAccentColor(color)} className="sr-only" />
                        <span className="w-full h-full rounded-full" style={{
                            backgroundColor: color === 'purple' ? '#4C1D95' : color === 'blue' ? '#1D4ED8' : '#15803D'
                        }}></span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Appearance'}</Button>
              </form>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="animate-[fade-in_0.3s_ease-out_both]">
              <h2 className="text-xl font-bold mb-6 text-neutral-text">Global Preferences</h2>
              <form onSubmit={handlePreferencesSave} className="max-w-md space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-muted mb-2">Default Currency</label>
                  <select 
                    value={currency} 
                    onChange={(e) => setCurrency(e.target.value)} 
                    className="w-full border border-border rounded-input p-2 bg-white text-sm"
                  >
                    <option value="INR">₹ Indian Rupee (INR)</option>
                    <option value="USD">$ US Dollar (USD)</option>
                    <option value="EUR">€ Euro (EUR)</option>
                    <option value="GBP">£ British Pound (GBP)</option>
                    <option value="NGN">₦ Nigerian Naira (NGN)</option>
                  </select>
                </div>
                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Preferences'}</Button>
              </form>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="animate-[fade-in_0.3s_ease-out_both]">
              <h2 className="text-xl font-bold mb-6 text-neutral-text">Integrations</h2>
              <div className="max-w-md space-y-6">
                <div className="border border-border rounded-xl p-4 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                      <Mail size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-neutral-text">Google Workspace</h4>
                      <p className="text-xs text-neutral-muted">Sync receipts from Gmail</p>
                    </div>
                  </div>
                  {gmailConnected ? (
                    <button onClick={simulateGmailDisconnect} className="text-sm font-medium text-danger hover:underline">Disconnect</button>
                  ) : (
                    <Button onClick={simulateGmailConnect} disabled={loading} className="text-xs py-1.5 px-4">
                      {loading ? 'Connecting...' : 'Connect'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
