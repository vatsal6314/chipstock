import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isDefaultPassword, setIsDefaultPassword] = useState(false);

  const checkAuth = async () => {
    try {
      setIsChecking(true);
      const res = await apiRequest('/auth/me');
      if (res && res.authenticated) {
        setIsAuthenticated(true);
        setIsDefaultPassword(Boolean(res.isDefaultPassword));
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      setIsAuthenticated(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (password) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });

    if (res.token) {
      localStorage.setItem('chipstock_token', res.token);
    }
    setIsAuthenticated(true);
    setIsDefaultPassword(Boolean(res.isDefaultPassword));
    return res;
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout request error:', err);
    } finally {
      localStorage.removeItem('chipstock_token');
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isChecking,
        isDefaultPassword,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
