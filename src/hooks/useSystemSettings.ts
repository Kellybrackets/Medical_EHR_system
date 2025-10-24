import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { SystemSetting } from '../types';

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key');

      if (fetchError) throw fetchError;

      setSettings(
        data?.map((s) => ({
          id: s.id,
          settingKey: s.setting_key,
          settingValue: s.setting_value,
          settingType: s.setting_type,
          description: s.description,
          updatedAt: s.updated_at,
          updatedBy: s.updated_by,
        })) || []
      );
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getSetting = (key: string): SystemSetting | undefined => {
    return settings.find((s) => s.settingKey === key);
  };

  const getSettingValue = (key: string): string | number | boolean | null => {
    const setting = getSetting(key);
    if (!setting) return null;

    switch (setting.settingType) {
      case 'boolean':
        return setting.settingValue === 'true';
      case 'number':
        return parseInt(setting.settingValue, 10);
      default:
        return setting.settingValue;
    }
  };

  const updateSetting = async (
    key: string,
    value: string | number | boolean
  ) => {
    try {
      const stringValue = String(value);

      const { error: updateError } = await supabase
        .from('system_settings')
        .update({
          setting_value: stringValue,
          updated_at: new Date().toISOString(),
        })
        .eq('setting_key', key);

      if (updateError) throw updateError;

      await fetchSettings();
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateMultipleSettings = async (
    updates: Array<{ key: string; value: string | number | boolean }>
  ) => {
    try {
      for (const update of updates) {
        const result = await updateSetting(update.key, update.value);
        if (!result.success) {
          throw new Error(result.error || 'Failed to update setting');
        }
      }

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    settings,
    loading,
    error,
    getSetting,
    getSettingValue,
    updateSetting,
    updateMultipleSettings,
    refetch: fetchSettings,
  };
};
