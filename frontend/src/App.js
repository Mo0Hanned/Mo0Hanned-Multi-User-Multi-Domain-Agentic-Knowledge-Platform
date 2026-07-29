import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import CustomCursor from './components/CustomCursor';

const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
  }, []);

  const handleLogin = (user, tokenStr) => {
    setIsAuthenticated(true);
    setUsername(user);
    localStorage.setItem('username', user);
    
    // Decode token to get role
    const token = tokenStr || localStorage.getItem('access_token');
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded.role) {
        setRole(decoded.role);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUsername('');
  };

  return (
    <div className="App">
      <CustomCursor />
      {isAuthenticated ? (
        <Dashboard username={username} role={role} onLogout={handleLogout} />
      ) : (
        <Auth onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
