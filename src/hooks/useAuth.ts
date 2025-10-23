import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const handleAuthStateChange = useCallback(async (session: any) => {
    console.log('🔐 Auth state change:', { session: session?.user });

    if (session?.user) {
      // Verify user exists in public.users table
      // This prevents deleted users from accessing the app with cached tokens
      const { data: publicUser, error } = await supabase
        .from('users')
        .select('id, username, role, name, created_at, updated_at')
        .eq('id', session.user.id)
        .single();

      if (error || !publicUser) {
        console.warn('⚠️ User not found in public.users, signing out');
        console.error('Error:', error);
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
        return;
      }

      // User exists in both auth.users and public.users
      const userData = {
        id: publicUser.id,
        username: publicUser.username,
        role: publicUser.role,
        name: publicUser.name,
        createdAt: publicUser.created_at,
        updatedAt: publicUser.updated_at
      };

      console.log('👤 Setting user:', userData);
      setUser(userData);
    } else {
      console.log('❌ No session, clearing user');
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          handleAuthStateChange(session);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (isMounted) {
        handleAuthStateChange(session);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [handleAuthStateChange]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Please confirm your email address before signing in.');
        }
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password.');
        }
        throw error;
      }
      
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const signUp = useCallback(async (
    email: string, 
    password: string, 
    fullName: string, 
    username: string, 
    role: 'doctor' | 'receptionist'
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, username, role }
        }
      });

      if (error) throw error;
      return { success: true, error: null, user: data.user };
    } catch (error: any) {
      return { success: false, error: error.message, user: null };
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) throw error;
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Error signing out:', error);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, []);

  return {
    user,
    loading,
    signIn,
    signUp,
    resetPassword,
    signOut,
    isAuthenticated: !!user
  };
};