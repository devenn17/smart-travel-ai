import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser, loginUser, registerUser, logoutUser } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check persistent session on initial mount
  const checkAuthStatus = useCallback(async () => {
    try {
      const data = await getCurrentUser();
      if (data && data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      // 401 or network failure means user is currently unauthenticated
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Login handler
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const data = await loginUser({ email, password });
      if (data && data.success && data.user) {
        setUser(data.user);
        return { success: true, user: data.user };
      }
      throw new Error(data.message || 'Login failed');
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Unable to connect to server. Please try again.';
      setAuthError(message);
      return { success: false, message };
    }
  };

  // Registration handler
  const register = async (name, email, password) => {
    setAuthError(null);
    try {
      const data = await registerUser({ name, email, password });
      if (data && data.success && data.user) {
        setUser(data.user);
        return { success: true, user: data.user };
      }
      throw new Error(data.message || 'Registration failed');
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Unable to complete registration. Please try again.';
      setAuthError(message);
      return { success: false, message };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('[Auth] Logout request warning:', err.message);
    } finally {
      setUser(null);
      setAuthError(null);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    authError,
    setAuthError,
    login,
    register,
    logout,
    refreshUser: checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
