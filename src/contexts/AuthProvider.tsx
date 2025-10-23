import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, fullName: string, username: string, role: 'doctor' | 'receptionist') => Promise<{ success: boolean; error?: string | null; user?: any }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();

  const value: AuthContextType = {
    user: auth.user,
    loading: auth.loading,
    isAuthenticated: auth.isAuthenticated,
    login: auth.signIn,
    register: auth.signUp,
    resetPassword: auth.resetPassword,
    logout: auth.signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};