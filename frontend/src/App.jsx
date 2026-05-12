import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BudgetPlannerPage from './pages/BudgetPlannerPage';
import TransactionsPage from './pages/TransactionsPage';
import WalletPage from './pages/WalletPage';
import SettingsPage from './pages/SettingsPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      if (user.theme) {
        document.body.className = user.theme;
      } else {
        document.body.className = 'light';
      }

      if (user.accentColor) {
        document.body.setAttribute('data-accent', user.accentColor);
      } else {
        document.body.setAttribute('data-accent', 'purple');
      }
    }
  }, [user?.theme, user?.accentColor]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
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
