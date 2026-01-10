/**
 * Critical Lab Alerts Widget
 * Displays critical lab results requiring immediate doctor attention
 * For use in Doctor Dashboard
 */

import { useMemo } from 'react';
import { AlertCircle, Activity, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { useCriticalLabAlerts } from '../../hooks/useCriticalLabAlerts';
import { formatResultDate, getResultAgeDescription } from '../../utils/labHelpers';

interface CriticalLabAlertsProps {
  onViewPatient?: (patientId: string) => void;
}

export function CriticalLabAlerts({ onViewPatient }: CriticalLabAlertsProps) {
  const { alerts, loading, unacknowledgedCount, acknowledgeAlert } = useCriticalLabAlerts();

  // Separate acknowledged and unacknowledged alerts
  const { unacknowledged, acknowledged } = useMemo(() => {
    const unack = alerts.filter((a) => !a.acknowledged);
    const ack = alerts.filter((a) => a.acknowledged).slice(0, 3); // Show last 3 acknowledged
    return { unacknowledged: unack, acknowledged: ack };
  }, [alerts]);

  if (loading) {
    return (
      <Card>
        <div className="p-6 flex items-center justify-center">
          <Activity className="animate-spin mr-2" size={20} />
          <span className="text-gray-600">Loading critical alerts...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Critical Lab Results</h2>
          </div>
          {unacknowledgedCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
              {unacknowledgedCount} Unacknowledged
            </span>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No critical lab results</p>
            <p className="text-xs text-gray-400">All results are within normal ranges</p>
          </div>
        ) : (
          <>
            {/* Unacknowledged Alerts */}
            {unacknowledged.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-red-800 mb-3">
                  ⚠️ Requires Immediate Attention
                </h3>
                <div className="space-y-2">
                  {unacknowledged.map((alert) => (
                    <div
                      key={alert.result_id}
                      className="critical-alert-card bg-red-50 border border-red-200 rounded-lg p-4 hover:bg-red-100 transition-colors cursor-pointer"
                      onClick={() => onViewPatient && onViewPatient(alert.patient_id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">{alert.patient_name}</h4>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-600 text-white">
                              CRITICAL
                            </span>
                          </div>
                          <div className="mt-1 text-sm">
                            <span className="font-medium">{alert.test_name}:</span>
                            <span className="ml-2 text-red-700 font-semibold">{alert.result_value}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {formatResultDate(alert.collection_datetime, false)}
                            </span>
                            {alert.age_hours < 24 && (
                              <span className="text-red-600 font-medium">
                                {Math.floor(alert.age_hours)} hours ago
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            acknowledgeAlert(alert.result_id);
                          }}
                          className="ml-4 px-3 py-1 text-xs font-medium text-red-700 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors"
                        >
                          Acknowledge
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Acknowledged Alerts (Recent) */}
            {acknowledged.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Recently Acknowledged</h3>
                <div className="space-y-2">
                  {acknowledged.map((alert) => (
                    <div
                      key={alert.result_id}
                      className="alert-card bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer opacity-75"
                      onClick={() => onViewPatient && onViewPatient(alert.patient_id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900 text-sm">{alert.patient_name}</h4>
                            <span className="text-xs text-gray-500">✓ Acknowledged</span>
                          </div>
                          <div className="mt-1 text-xs text-gray-600">
                            {alert.test_name}: {alert.result_value}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
