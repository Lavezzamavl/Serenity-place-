import { useState } from 'react';
import Login from './pages/Login';
import Layout from './components/Layout';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeModule, setActiveModule] = useState('dashboard');

  const handleLogin = (userData) => {
    setUser(userData);
    setActiveModule('dashboard'); // always land on dashboard after login
  };

  const handleLogout = () => {
    setUser(null);
  };

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