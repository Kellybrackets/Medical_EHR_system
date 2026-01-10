/**
 * Custom hook for managing critical lab result alerts
 * Provides real-time critical value monitoring for doctors
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import type { CriticalLabAlert } from '../types/lab';

export const useCriticalLabAlerts = () => {
  const { user } = useAuthContext();
  const [alerts, setAlerts] = useState<CriticalLabAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load critical lab alerts
   */
  const loadAlerts = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get practice code for filtering
      const practiceCode = user.role === 'admin' ? null : user.practice_code;

      const { data, error: fetchError } = await supabase.rpc('get_critical_lab_results', {
        p_practice_code: practiceCode,
      });

      if (fetchError) throw fetchError;

      setAlerts(data || []);
    } catch (err) {
      console.error('Error loading critical lab alerts:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Auto-load on mount
   */
  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  /**
   * Real-time subscription for new critical results
   */
  useEffect(() => {
    if (!isSupabaseConfigured || !user) {
      return;
    }

    const channel = supabase
      .channel('critical-lab-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lab_results',
          filter: 'abnormal_flag=eq.CRITICAL',
        },
        async (payload) => {
          const newResult = payload.new;

          // Only show alerts for user's practice (unless admin)
          if (user.role !== 'admin' && newResult.practice_code !== user.practice_code) {
            return;
          }

          // Fetch patient name
          const { data: patient } = await supabase
            .from('patients')
            .select('first_name, surname')
            .eq('id', newResult.patient_id)
            .single();

          if (patient) {
            const alert: CriticalLabAlert = {
              result_id: newResult.id,
              patient_id: newResult.patient_id,
              patient_name: `${patient.first_name} ${patient.surname}`,
              test_name: newResult.test_name,
              result_value: newResult.result_value,
              abnormal_flag: newResult.abnormal_flag,
              collection_datetime: newResult.collection_datetime,
              age_hours: 0,
              acknowledged: newResult.critical_acknowledged || false,
            };

            setAlerts((prev) => [alert, ...prev]);

            // TODO: Trigger notification (sound, popup, etc.)
            console.log('🚨 NEW CRITICAL LAB RESULT:', alert);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lab_results',
          filter: 'abnormal_flag=eq.CRITICAL',
        },
        (payload) => {
          const updated = payload.new;

          setAlerts((prev) =>
            prev.map((alert) =>
              alert.result_id === updated.id
                ? { ...alert, acknowledged: updated.critical_acknowledged || false }
                : alert
            )
          );
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  /**
   * Acknowledge a critical result
   */
  const acknowledgeAlert = useCallback(
    async (resultId: string, notes?: string) => {
      if (!user) return;

      try {
        const { error: rpcError } = await supabase.rpc('acknowledge_critical_result', {
          p_result_id: resultId,
          p_user_id: user.id,
          p_notes: notes || null,
        });

        if (rpcError) throw rpcError;

        // Update local state
        setAlerts((prev) =>
          prev.map((alert) =>
            alert.result_id === resultId ? { ...alert, acknowledged: true } : alert
          )
        );
      } catch (err) {
        console.error('Error acknowledging alert:', err);
        throw err;
      }
    },
    [user]
  );

  /**
   * Dismiss alert (mark as acknowledged without notes)
   */
  const dismissAlert = useCallback(
    async (resultId: string) => {
      await acknowledgeAlert(resultId);
    },
    [acknowledgeAlert]
  );

  return {
    alerts,
    loading,
    error,
    unacknowledgedCount: alerts.filter((a) => !a.acknowledged).length,
    refetch: loadAlerts,
    acknowledgeAlert,
    dismissAlert,
  };
};
