import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useToast } from '../ui/Toast';
import { useSystemSettings } from '../../hooks/useSystemSettings';

export const SystemSettings: React.FC = () => {
  const { settings, loading, getSettingValue, updateMultipleSettings } = useSystemSettings();
  const { showToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({
    system_name: '',
    require_strong_password: false,
    session_timeout: 30,
    max_login_attempts: 5,
    enable_audit_log: false,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings.length > 0) {
      setFormData({
        system_name: (getSettingValue('system_name') as string) || 'MedCare EHR',
        require_strong_password: Boolean(getSettingValue('require_strong_password')),
        session_timeout: Number(getSettingValue('session_timeout')) || 30,
        max_login_attempts: Number(getSettingValue('max_login_attempts')) || 5,
        enable_audit_log: Boolean(getSettingValue('enable_audit_log')),
      });
    }
  }, [settings, getSettingValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const updates = [
      { key: 'system_name', value: formData.system_name },
      { key: 'require_strong_password', value: formData.require_strong_password },
      { key: 'session_timeout', value: formData.session_timeout },
      { key: 'max_login_attempts', value: formData.max_login_attempts },
      { key: 'enable_audit_log', value: formData.enable_audit_log },
    ];

    const result = await updateMultipleSettings(updates);

    if (result.success) {
      showToast('Settings saved successfully', 'success');
    } else {
      showToast(result.error || 'Failed to save settings', 'error');
    }

    setSaving(false);
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading settings..." />;
  }

  return (
    <>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
              <div className="space-y-4">
                <Input
                  label="System Name"
                  value={formData.system_name}
                  onChange={(e) => setFormData({ ...formData, system_name: e.target.value })}
                  placeholder="MedCare EHR"
                />
              </div>
            </div>

            {/* Security Settings */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requireStrongPassword"
                    checked={formData.require_strong_password}
                    onChange={(e) =>
                      setFormData({ ...formData, require_strong_password: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requireStrongPassword" className="ml-2 block text-sm text-gray-900">
                    Require Strong Passwords
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={formData.session_timeout}
                      onChange={(e) =>
                        setFormData({ ...formData, session_timeout: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Users will be logged out after this period of inactivity (5-120 minutes)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Login Attempts
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="10"
                      value={formData.max_login_attempts}
                      onChange={(e) =>
                        setFormData({ ...formData, max_login_attempts: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Account will be temporarily locked after this many failed attempts (3-10)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Audit & Logging */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit & Logging</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableAuditLog"
                    checked={formData.enable_audit_log}
                    onChange={(e) =>
                      setFormData({ ...formData, enable_audit_log: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="enableAuditLog" className="ml-2 block text-sm text-gray-900">
                    Enable Audit Logging
                  </label>
                </div>
                <p className="text-sm text-gray-600 ml-6">
                  Track all administrative actions including user creation, practice management, and
                  system configuration changes.
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="border-t border-gray-200 pt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <SettingsIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-900">About System Settings</h4>
                    <p className="mt-1 text-sm text-blue-700">
                      These settings apply globally to all users across all practices. Changes take effect
                      immediately for new sessions. Existing active sessions will continue with their
                      current settings until the next login.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end border-t border-gray-200 pt-6">
              <Button type="submit" loading={saving}>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <ToastContainer />
    </>
  );
};
