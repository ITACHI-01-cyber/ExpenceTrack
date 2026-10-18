import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import useAppearanceStore from './store/appearanceStore';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ForgotUsernamePage from './pages/ForgotUsernamePage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import BudgetPlannerPage from './pages/BudgetPlannerPage';
import TransactionsPage from './pages/TransactionsPage';
import WalletPage from './pages/WalletPage';
import SettingsPage from './pages/SettingsPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, token, isGuest } = useAuthStore();
  if (!isAuthenticated || (!token && !isGuest)) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  const { user, isAuthenticated, isGuest } = useAuthStore();
  const { theme, glass, setTheme, setGlass } = useAppearanceStore();

  useEffect(() => {
    // The server wins over a previous browser user's cached appearance.
    if (isAuthenticated && !isGuest && user) {
      setTheme(user.theme || 'light');
      setGlass(Boolean(user.glass));
    }
  }, [isAuthenticated, isGuest, user?.theme, user?.glass, setTheme, setGlass]);

  useEffect(() => {
    document.body.dataset.theme = theme;
    document.body.dataset.glass = String(glass);
    document.body.classList.toggle('dark', theme === 'dark');
    document.body.dataset.accent = user?.accentColor || 'purple';
    const wallpaper = user?.wallpaperEnabled ? user.wallpaperImage : null;
    document.body.style.setProperty('--wallpaper-image', wallpaper ? `url("${wallpaper.startsWith('http') ? wallpaper : (import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://expencetrack.onrender.com/api' : 'http://localhost:8080/api')).replace(/\/api\/?$/, '') + wallpaper}")` : 'none');
    document.body.style.setProperty('--wallpaper-overlay', `${Math.max(0, Math.min(100, user?.wallpaperOpacity ?? 35)) / 100}`);
  }, [theme, glass, user?.accentColor, user?.wallpaperEnabled, user?.wallpaperImage, user?.wallpaperOpacity]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/forgot-username" element={<ForgotUsernamePage />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/budget" element={<ProtectedRoute><BudgetPlannerPage /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        
        {/* Default redirect to dashboard or login */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
