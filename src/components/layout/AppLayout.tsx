import React, { memo } from 'react';
import { LogOut, Stethoscope } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthProvider';
import { Button } from '../ui/Button';
import { cn } from '../../utils/helpers';
import { UI_CLASSES } from '../../utils/constants';

interface AppLayoutProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const AppLayoutComponent: React.FC<AppLayoutProps> = ({ title, children, className }) => {
  const { user, logout } = useAuthContext();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className={cn(UI_CLASSES.container, 'flex items-center justify-between h-16')}>
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
              <Stethoscope className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">MedCare EHR</h1>
              <p className="text-sm text-gray-500 hidden sm:block">{title}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(UI_CLASSES.container, UI_CLASSES.section, className)}>
        <div className="sm:hidden mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        {children}
      </main>
    </div>
  );
};

export const AppLayout = memo(AppLayoutComponent);