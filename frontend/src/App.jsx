import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { fetchMe, logout as apiLogout } from './api/auth';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [checkingSession, setCheckingSession] = useState(true);

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

  return (
    <ErrorBoundary>
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Layout
          user={user}
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          onLogout={handleLogout}
        />
      )}
    </ErrorBoundary>
  );
}