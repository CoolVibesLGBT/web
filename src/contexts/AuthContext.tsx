import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../interfaces/user';
import { api } from '../services/api';



interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  token:string | null;
  login: (token:string, user: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Auto-login on mount if token exists in localStorage
  useEffect(() => {
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
        //localStorage.removeItem("authToken");
        //setToken(null);
      }
    };

    autoLogin();
  }, []);

  const login = (token: string, userData: User) => {
    setToken(token);
    setUser(userData);
    localStorage.setItem("authToken", token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken");
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  return (
    <AuthContext.Provider value={{
        user,
        isAuthenticated: !!token,
        token,
        login,
        logout,
        updateUser,
    }}>
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
