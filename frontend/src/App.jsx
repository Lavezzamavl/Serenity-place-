import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Layout from './components/Layout';
import { fetchMe, logout as apiLogout } from './api/auth';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [checkingSession, setCheckingSession] = useState(true);

  // On page load/refresh, if we still have a valid token, stay logged in
  // instead of bouncing back to the login screen.
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setCheckingSession(false);
      return;
    }
    fetchMe()
      .then(setUser)
      .catch(() => apiLogout())
      .finally(() => setCheckingSession(false));
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setActiveModule('dashboard');
  };

  const handleLogout = () => {
    apiLogout();
    setUser(null);
  };

  if (checkingSession) {
    return <div className="min-h-screen flex items-center justify-center bg-mist text-slate">Loading...</div>;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout
      user={user}
      activeModule={activeModule}
      setActiveModule={setActiveModule}
      onLogout={handleLogout}
    />
  );
}