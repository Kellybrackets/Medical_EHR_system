import React, { useState, useMemo } from 'react';
import { Users, Building2, Settings, BarChart3 } from 'lucide-react';
import { AppLayout } from '../layout/AppLayout';
import { Card } from '../ui/Card';
import { DashboardOverview } from '../admin/DashboardOverview';
import { PracticesManagement } from '../admin/PracticesManagement';
import { UsersManagement } from '../admin/UsersManagement';
import { SystemSettings } from '../admin/SystemSettings';

type AdminView = 'dashboard' | 'practices' | 'users' | 'settings';

export const AdminDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<AdminView>('dashboard');

  const menuItems = [
    { id: 'dashboard' as AdminView, label: 'Dashboard', icon: BarChart3 },
    { id: 'practices' as AdminView, label: 'Practices', icon: Building2 },
    { id: 'users' as AdminView, label: 'Users', icon: Users },
    { id: 'settings' as AdminView, label: 'System Settings', icon: Settings },
  ];

  return (
    <AppLayout title="Admin Portal">
      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <nav className="w-64 flex-shrink-0">
          <Card className="sticky top-4">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeView === item.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </nav>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {activeView === 'dashboard' && <DashboardOverview />}
          {activeView === 'practices' && <PracticesManagement />}
          {activeView === 'users' && <UsersManagement />}
          {activeView === 'settings' && <SystemSettings />}
        </div>
      </div>
    </AppLayout>
  );
};
