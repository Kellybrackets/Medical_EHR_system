/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface UserWithPractice extends User {
  practiceName?: string;
}

export const useAdminUsers = () => {
  const [users, setUsers] = useState<UserWithPractice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      // Call security definer function to get all users
      const { data, error: rpcError } = await supabase.rpc('get_all_users');

      if (rpcError) throw rpcError;

      // Map database response to UserWithPractice type
      const usersWithPractices: UserWithPractice[] =
        data?.map((u: any) => ({
          id: u.id,
          username: u.username,
          role: u.role,
          name: u.name,
          practiceCode: u.practice_code,
          practiceName: u.practice_name,
          createdAt: u.created_at,
          updatedAt: u.updated_at,
        })) || [];

      setUsers(usersWithPractices);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const resetPassword = async (userId: string, email: string) => {
    try {
      // In production, this would trigger Supabase password reset email
      // For now, we'll use the auth API
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateUser = async (
    userId: string,
    updates: Partial<{
      name: string;
      username: string;
      role: 'doctor' | 'receptionist' | 'admin';
      practiceCode: string;
    }>,
  ) => {
    try {
      const updateData: any = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.username !== undefined) updateData.username = updates.username;
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.practiceCode !== undefined) updateData.practice_code = updates.practiceCode;

      const { error: updateError } = await supabase
        .from('users')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      await fetchUsers();
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Call security definer function to delete user
      const { error: rpcError } = await supabase.rpc('admin_delete_user', {
        user_id_to_delete: userId,
      });

      if (rpcError) throw rpcError;

      // Note: Auth user should be deleted via Supabase Dashboard or Admin API
      // for proper cleanup

      await fetchUsers();
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    users,
    loading,
    error,
    resetPassword,
    updateUser,
    deleteUser,
    refetch: fetchUsers,
  };
};
