import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../interfaces/user';
import { api } from '../services/api';



interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const emitAuthTokenChange = React.useCallback((nextToken: string | null) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('auth-token-changed', { detail: { token: nextToken } })
    );
  }, []);

  // Auto-login on mount if token exists in localStorage
  useEffect(() => {
    let isActive = true;
    const autoLogin = async () => {
      try {
        const savedToken = localStorage.getItem("authToken");
        if (savedToken) {
          // Set token first
          setToken(savedToken);

          // Fetch user info from API
          const response = await api.getUserInfo();

          // If response has user data, set it
          if (response?.user) {
            setUser(response.user);
          } else if (response) {
            // If response itself is user data
            setUser(response as User);
          }
        }
      } catch (error) {
        console.error('Auto-login failed:', error);
        // If token is invalid, remove it
        localStorage.removeItem("authToken");
        setToken(null);
        setUser(null)
      } finally {
        if (isActive) {
          setIsAuthReady(true);
        }
      }
    };

    autoLogin();
    return () => {
      isActive = false;
    };
  }, []);

  const login = React.useCallback((token: string, userData: User) => {
    setToken(token);
    setUser(userData);
    localStorage.setItem("authToken", token);
    emitAuthTokenChange(token);
  }, [emitAuthTokenChange]);

  const logout = React.useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken");
    emitAuthTokenChange(null);
  }, [emitAuthTokenChange]);

  const updateUser = React.useCallback((userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  }, []);

  const contextValue = React.useMemo(() => ({
    user,
    isAuthenticated: !!token,
    isAuthReady,
    token,
    login,
    logout,
    updateUser,
  }), [user, token, isAuthReady, login, logout, updateUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
