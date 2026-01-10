/**
 * Custom hook for managing lab results
 * Provides real-time lab results data with filtering, sorting, and actions
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import type {
  LabResult,
  LabResultFilters,
  LabResultSort,
  LabResultsSummary,
  LabResultGroupBy,
} from '../types/lab';

interface UseLabResultsOptions {
  patientId?: string;
  autoLoad?: boolean;
  enableRealtime?: boolean;
}

export const useLabResults = (options: UseLabResultsOptions = {}) => {
  const { patientId, autoLoad = true, enableRealtime = true } = options;
  const { user } = useAuthContext();

  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<LabResultFilters>({});
  const [sort, setSort] = useState<LabResultSort>({
    field: 'collection_datetime',
    direction: 'desc',
  });
  const [groupBy, setGroupBy] = useState<LabResultGroupBy>('none');

  /**
   * Load lab results from database
   */
  const loadResults = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setResults([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('lab_results')
        .select('*')
        .order(sort.field, { ascending: sort.direction === 'asc' });

      // Apply patient filter if provided
      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      // Apply additional filters
      if (filters.dateFrom) {
        query = query.gte('collection_datetime', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('collection_datetime', filters.dateTo);
      }
      if (filters.testCategory) {
        query = query.eq('test_category', filters.testCategory);
      }
      if (filters.testCode) {
        query = query.eq('test_code', filters.testCode);
      }
      if (filters.status) {
        query = query.eq('result_status', filters.status);
      }
      if (filters.orderingDoctorId) {
        query = query.eq('ordering_doctor_id', filters.orderingDoctorId);
      }
      if (filters.abnormalOnly) {
        query = query.neq('abnormal_flag', 'N');
      }
      if (filters.criticalOnly) {
        query = query.eq('abnormal_flag', 'CRITICAL');
      }
      if (filters.unacknowledgedOnly) {
        query = query.eq('critical_acknowledged', false).eq('abnormal_flag', 'CRITICAL');
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setResults(data || []);
    } catch (err) {
      console.error('Error loading lab results:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [patientId, filters, sort, user]);

  /**
   * Auto-load on mount and when dependencies change
   */
  useEffect(() => {
    if (autoLoad) {
      loadResults();
    }
  }, [autoLoad, loadResults]);

  /**
   * Real-time subscription for new results
   */
  useEffect(() => {
    if (!isSupabaseConfigured || !enableRealtime || !user) {
      return;
    }

    const channel = supabase
      .channel('lab-results-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lab_results',
          filter: patientId ? `patient_id=eq.${patientId}` : undefined,
        },
        (payload) => {
          const newResult = payload.new as LabResult;

          // Check if result matches current filters
          const matchesFilters =
            (!filters.testCategory || newResult.test_category === filters.testCategory) &&
            (!filters.testCode || newResult.test_code === filters.testCode) &&
            (!filters.status || newResult.result_status === filters.status) &&
            (!filters.abnormalOnly || newResult.abnormal_flag !== 'N') &&
            (!filters.criticalOnly || newResult.abnormal_flag === 'CRITICAL');

          if (matchesFilters) {
            setResults((prev) => {
              // Check if result already exists (prevent duplicates)
              if (prev.some((r) => r.id === newResult.id)) {
                return prev;
              }
              return [newResult, ...prev];
            });

            // Show notification for critical results
            if (newResult.abnormal_flag === 'CRITICAL') {
              console.log('🚨 CRITICAL LAB RESULT:', newResult.test_name);
              // TODO: Trigger notification system
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lab_results',
          filter: patientId ? `patient_id=eq.${patientId}` : undefined,
        },
        (payload) => {
          const updatedResult = payload.new as LabResult;
          setResults((prev) =>
            prev.map((result) => (result.id === updatedResult.id ? updatedResult : result))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'lab_results',
          filter: patientId ? `patient_id=eq.${patientId}` : undefined,
        },
        (payload) => {
          const deletedId = payload.old.id;
          setResults((prev) => prev.filter((result) => result.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [enableRealtime, patientId, filters, user]);

  /**
   * Mark result as viewed by current user
   */
  const markAsViewed = useCallback(
    async (resultId: string) => {
      if (!user) return;

      try {
        // Call database function to mark as viewed
        const { error: rpcError } = await supabase.rpc('mark_lab_result_viewed', {
          p_result_id: resultId,
          p_user_id: user.id,
        });

        if (rpcError) throw rpcError;

        // Update local state
        setResults((prev) =>
          prev.map((result) =>
            result.id === resultId
              ? {
                  ...result,
                  viewed_by: [...result.viewed_by, user.id],
                  first_viewed_at: result.first_viewed_at || new Date().toISOString(),
                  first_viewed_by: result.first_viewed_by || user.id,
                }
              : result
          )
        );
      } catch (err) {
        console.error('Error marking result as viewed:', err);
      }
    },
    [user]
  );

  /**
   * Acknowledge critical result
   */
  const acknowledgeCritical = useCallback(
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
        setResults((prev) =>
          prev.map((result) =>
            result.id === resultId
              ? {
                  ...result,
                  critical_acknowledged: true,
                  acknowledged_by: user.id,
                  acknowledged_at: new Date().toISOString(),
                  clinician_notes: notes
                    ? result.clinician_notes
                      ? `${result.clinician_notes}\n\n${notes}`
                      : notes
                    : result.clinician_notes,
                }
              : result
          )
        );
      } catch (err) {
        console.error('Error acknowledging critical result:', err);
        throw err;
      }
    },
    [user]
  );

  /**
   * Add clinician note to result
   */
  const addNote = useCallback(
    async (resultId: string, note: string) => {
      if (!user) return;

      try {
        const result = results.find((r) => r.id === resultId);
        if (!result) return;

        const updatedNotes = result.clinician_notes
          ? `${result.clinician_notes}\n\n[${new Date().toLocaleString()}] ${user.name}: ${note}`
          : `[${new Date().toLocaleString()}] ${user.name}: ${note}`;

        const { error: updateError } = await supabase
          .from('lab_results')
          .update({ clinician_notes: updatedNotes })
          .eq('id', resultId);

        if (updateError) throw updateError;

        // Update local state
        setResults((prev) =>
          prev.map((r) => (r.id === resultId ? { ...r, clinician_notes: updatedNotes } : r))
        );
      } catch (err) {
        console.error('Error adding note:', err);
        throw err;
      }
    },
    [user, results]
  );

  /**
   * Get summary statistics for current results
   */
  const summary: LabResultsSummary = useMemo(() => {
    return {
      total_results: results.length,
      critical_count: results.filter((r) => r.abnormal_flag === 'CRITICAL').length,
      abnormal_count: results.filter((r) => r.abnormal_flag && r.abnormal_flag !== 'N').length,
      recent_tests: results
        .slice(0, 5)
        .map((r) => ({
          test_name: r.test_name,
          result_value: r.result_value,
          abnormal_flag: r.abnormal_flag,
          collection_datetime: r.collection_datetime,
        })),
      last_test_date: results.length > 0 ? results[0].collection_datetime : null,
    };
  }, [results]);

  /**
   * Get grouped results
   */
  const groupedResults = useMemo(() => {
    if (groupBy === 'none') return { none: results };

    const groups: Record<string, LabResult[]> = {};

    results.forEach((result) => {
      let key: string;

      switch (groupBy) {
        case 'date':
          key = new Date(result.collection_datetime).toLocaleDateString();
          break;
        case 'category':
          key = result.test_category || 'Uncategorized';
          break;
        case 'test':
          key = result.test_name;
          break;
        case 'status':
          key = result.result_status;
          break;
        default:
          key = 'none';
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(result);
    });

    return groups;
  }, [results, groupBy]);

  /**
   * Get results by test code (for trending)
   */
  const getResultsByTestCode = useCallback(
    (testCode: string) => {
      return results
        .filter((r) => r.test_code === testCode)
        .sort(
          (a, b) =>
            new Date(a.collection_datetime).getTime() - new Date(b.collection_datetime).getTime()
        );
    },
    [results]
  );

  /**
   * Get critical unacknowledged results
   */
  const criticalUnacknowledged = useMemo(() => {
    return results.filter((r) => r.abnormal_flag === 'CRITICAL' && !r.critical_acknowledged);
  }, [results]);

  return {
    // Data
    results,
    groupedResults,
    summary,
    criticalUnacknowledged,

    // State
    loading,
    error,

    // Filters and sorting
    filters,
    setFilters,
    sort,
    setSort,
    groupBy,
    setGroupBy,

    // Actions
    refetch: loadResults,
    markAsViewed,
    acknowledgeCritical,
    addNote,
    getResultsByTestCode,
  };
};

/**
 * Hook specifically for patient's lab summary (lightweight)
 */
export const usePatientLabSummary = (patientId: string) => {
  const [summary, setSummary] = useState<LabResultsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const fetchSummary = async () => {
      try {
        const { data, error } = await supabase.rpc('get_patient_lab_summary', {
          p_patient_id: patientId,
        });

        if (error) throw error;

        if (data && data.length > 0) {
          setSummary(data[0]);
        }
      } catch (err) {
        console.error('Error fetching lab summary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [patientId]);

  return { summary, loading };
};

/**
 * Hook for getting single result details
 */
export const useLabResult = (resultId: string | undefined) => {
  const [result, setResult] = useState<LabResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!resultId || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const fetchResult = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('lab_results')
          .select('*')
          .eq('id', resultId)
          .single();

        if (fetchError) throw fetchError;

        setResult(data);
      } catch (err) {
        console.error('Error fetching lab result:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [resultId]);

  return { result, loading, error };
};
