import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = `${window.location.origin}/api`;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuth = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
      return response.data;
    } catch (err) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post(`${API}/auth/login`, 
        { email, password },
        { withCredentials: true }
      );
      setUser(response.data);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Login failed';
      setError(message);
      throw new Error(message);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await axios.post(`${API}/auth/register`, 
        userData,
        { withCredentials: true }
      );
      setUser(response.data);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Registration failed';
      setError(message);
      throw new Error(message);
    }
  };

  const processGoogleSession = async (sessionId) => {
    try {
      setError(null);
      const response = await axios.post(`${API}/auth/session`, 
        { session_id: sessionId },
        { withCredentials: true }
      );
      setUser(response.data);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Google authentication failed';
      setError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await axios.put(`${API}/auth/profile`, data, {
        withCredentials: true
      });
      setUser(response.data);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.detail || 'Profile update failed');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      loading,
      error,
      login,
      register,
      logout,
      checkAuth,
      processGoogleSession,
      updateProfile,
      isAuthenticated: !!user
    }}>
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
