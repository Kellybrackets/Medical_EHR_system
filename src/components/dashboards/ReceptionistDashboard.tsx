import React, { useState } from 'react';
import { LayoutDashboard, BarChart2, Coins } from 'lucide-react';
import { AppLayout } from '../layout/AppLayout';
import { useToast } from '../ui/Toast';
import { ReceptionistOverview } from './ReceptionistOverview';
import { ReceptionistStatistics } from './ReceptionistStatistics';
import { CashierTab } from '../cashier/CashierTab';
import { cn } from '../../utils/helpers';

interface ReceptionistDashboardProps {
  onAddPatient: () => void;
  onEditPatient: (patientId: string) => void;
  onViewPatient: (patientId: string) => void;
}

const ReceptionistDashboardComponent: React.FC<ReceptionistDashboardProps> = ({
  onAddPatient,
  onEditPatient,
  onViewPatient,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'cashier'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'stats', label: 'Statistics', icon: BarChart2 },
    { id: 'cashier', label: 'Cashier & Payments', icon: Coins },
  ] as const;

  return (
    <AppLayout title="Receptionist Dashboard">
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm',
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <Icon
                    className={cn(
                      '-ml-0.5 mr-2 h-5 w-5',
                      activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && (
            <ReceptionistOverview
              onAddPatient={onAddPatient}
              onEditPatient={onEditPatient}
              onViewPatient={onViewPatient}
            />
          )}

          {activeTab === 'stats' && <ReceptionistStatistics />}

          {activeTab === 'cashier' && <CashierTab />}
        </div>
      </div>
    </AppLayout>
  );
};

export const ReceptionistDashboard = React.memo(ReceptionistDashboardComponent);
// Default export for lazy loading if needed, though named export is preferred
export default ReceptionistDashboard;
