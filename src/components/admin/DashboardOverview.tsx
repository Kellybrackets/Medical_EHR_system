import React, { useEffect, useState } from 'react';
import { Users, Building2, Activity, TrendingUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  totalPractices: number;
  activePractices: number;
  totalUsers: number;
  activeUsers: number;
  totalDoctors: number;
  totalReceptionists: number;
}

export const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPractices: 0,
    activePractices: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalDoctors: 0,
    totalReceptionists: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch practices stats (practices table is readable by all authenticated users)
      const { data: practices, error: practicesError } = await supabase
        .from('practices')
        .select('status');

      if (practicesError) throw practicesError;

      // Call security definer function to get user stats
      const { data: statsData, error: statsError } = await supabase.rpc('get_admin_stats');

      if (statsError) throw statsError;

      setStats({
        totalPractices: practices?.length || 0,
        activePractices: practices?.filter(p => p.status === 'active').length || 0,
        totalUsers: statsData?.totalUsers || 0,
        activeUsers: statsData?.totalUsers || 0,
        totalDoctors: statsData?.totalDoctors || 0,
        totalReceptionists: statsData?.totalReceptionists || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Practices',
      value: stats.totalPractices,
      subtitle: `${stats.activePractices} active`,
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      subtitle: `${stats.activeUsers} active`,
      icon: Users,
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Doctors',
      value: stats.totalDoctors,
      subtitle: 'Medical practitioners',
      icon: Activity,
      color: 'from-teal-500 to-teal-600',
    },
    {
      title: 'Receptionists',
      value: stats.totalReceptionists,
      subtitle: 'Administrative staff',
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className={`bg-gradient-to-br ${stat.color} text-white`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  <p className="text-xs opacity-75 mt-1">{stat.subtitle}</p>
                </div>
                <Icon className="h-12 w-12 opacity-50" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Chart Placeholder */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Registrations This Week
        </h3>
        <div className="flex items-end justify-around h-64 bg-gray-50 rounded-lg p-6">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
            const height = Math.random() * 100 + 20;
            return (
              <div key={day} className="flex flex-col items-center gap-2">
                <div
                  className="w-12 bg-gradient-to-t from-blue-500 to-teal-500 rounded-t-lg transition-all hover:opacity-80"
                  style={{ height: `${height}%` }}
                ></div>
                <span className="text-xs text-gray-600">{day}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
