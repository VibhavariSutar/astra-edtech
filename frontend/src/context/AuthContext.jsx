import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('astralearn_user');
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  });
  
  const [token, setToken] = useState(() => localStorage.getItem('astralearn_token') || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      localStorage.setItem('astralearn_token', token);
      api.defaults.headers.Authorization = `Bearer ${token}`;
    } else {
      localStorage.removeItem('astralearn_token');
      delete api.defaults.headers.Authorization;
    }
    
    if (user) {
      try {
        localStorage.setItem('astralearn_user', JSON.stringify(user));
      } catch (error) {
        console.error('Error storing user data:', error);
      }
    } else {
      localStorage.removeItem('astralearn_user');
    }
  }, [token, user]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const login = async (email, password) => {
  setLoading(true);
  setError('');
  try {
    const res = await api.post('/auth/login', { email, password });
    
    if (res.data.token && res.data) {
      setToken(res.data.token);
      setUser(res.data);
      return res.data;
    } else {
      throw new Error('Invalid response from server');
    }
  } catch (err) {
    const errorMessage = err.response?.data?.msg || err.message || 'Login failed';
    setError(errorMessage);
    throw err;
  } finally {
    setLoading(false);
  }
};

  const register = async (payload) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', payload);
      if (res.data.token && res.data) {
        setToken(res.data.token);
        setUser(res.data);
        return res.data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.msg || err.message || 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setError('');
  }, []);

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    error,
    isAuthenticated: !!token && !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};