import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Practice } from '../types';

export const usePractices = () => {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPractices = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('practices')
        .select('*')
        .order('name');

      if (fetchError) throw fetchError;

      setPractices(
        data?.map((p) => ({
          id: p.id,
          name: p.name,
          code: p.code,
          address: p.address,
          city: p.city,
          phone: p.phone,
          email: p.email,
          status: p.status,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        })) || [],
      );
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching practices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPractices();
  }, [fetchPractices]);

  const addPractice = async (practice: {
    name: string;
    code: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
  }) => {
    try {
      const { data, error: insertError } = await supabase
        .from('practices')
        .insert([
          {
            name: practice.name,
            code: practice.code.toUpperCase(),
            address: practice.address,
            city: practice.city,
            phone: practice.phone,
            email: practice.email,
            status: 'active',
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchPractices();
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updatePractice = async (
    id: string,
    updates: Partial<{
      name: string;
      code: string;
      address: string;
      city: string;
      phone: string;
      email: string;
      status: 'active' | 'inactive';
    }>,
  ) => {
    try {
      const { error: updateError } = await supabase
        .from('practices')
        .update({
          ...updates,
          code: updates.code?.toUpperCase(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchPractices();
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deletePractice = async (id: string) => {
    try {
      const { error: deleteError } = await supabase.from('practices').delete().eq('id', id);

      if (deleteError) throw deleteError;

      await fetchPractices();
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const togglePracticeStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    return updatePractice(id, { status: newStatus });
  };

  return {
    practices,
    loading,
    error,
    addPractice,
    updatePractice,
    deletePractice,
    togglePracticeStatus,
    refetch: fetchPractices,
  };
};
