import React, { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AuthContext, AuthContextType } from './AuthContext';

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
    loginWithGoogle: auth.signInWithGoogle,
    resetPassword: auth.resetPassword,
    logout: auth.signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
