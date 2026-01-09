/**
 * Dashboard Page
 * Main dashboard with statistics from API
 */
import { useEffect, useState } from 'react';
import { 
  Briefcase, 
  Users, 
  
  
  FileText,
  DollarSign,
  Loader2
} from 'lucide-react';
import { Card } from '../../components/ui';
import { casesAPI } from '../../services/api';
import type { CaseStatistics } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

function StatCard({ title, value, icon, trend, trendUp }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
              {trend}
            </p>
          )}
        </div>
        <div className="p-3 bg-primary-600/20 rounded-xl">
          {icon}
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<CaseStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setIsLoading(true);
      const data = await casesAPI.getStatistics();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Welcome back, {user?.first_name}! Here's an overview of your investigations.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Cases"
          value={stats?.total_cases || 0}
          icon={<Briefcase className="w-6 h-6 text-primary-400" />}
        />
        <StatCard
          title="Open Cases"
          value={stats?.open_cases || 0}
          icon={<FileText className="w-6 h-6 text-yellow-400" />}
        />
        <StatCard
          title="Total Victims"
          value={stats?.total_victims || 0}
          icon={<Users className="w-6 h-6 text-orange-400" />}
        />
        <StatCard
          title="Total Amount"
          value={formatCurrency(stats?.total_amount || 0)}
          icon={<DollarSign className="w-6 h-6 text-green-400" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cases by Type */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Cases by Type</h3>
          <div className="space-y-3">
            {stats?.by_type && Object.entries(stats.by_type).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-gray-400 capitalize">{type.replace(/_/g, ' ')}</span>
                <span className="text-white font-medium">{count}</span>
              </div>
            ))}
            {(!stats?.by_type || Object.keys(stats.by_type).length === 0) && (
              <p className="text-gray-500 text-center py-4">No cases yet</p>
            )}
          </div>
        </Card>

        {/* Cases by Status */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Cases by Status</h3>
          <div className="space-y-3">
            {stats?.by_status && Object.entries(stats.by_status).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-gray-400 capitalize">{status.replace(/_/g, ' ')}</span>
                <span className="text-white font-medium">{count}</span>
              </div>
            ))}
            {(!stats?.by_status || Object.keys(stats.by_status).length === 0) && (
              <p className="text-gray-500 text-center py-4">No cases yet</p>
            )}
          </div>
        </Card>
      </div>

      {/* Cases by Priority */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Cases by Priority</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['critical', 'high', 'medium', 'low'].map((priority) => {
            const count = stats?.by_priority?.[priority] || 0;
            const colors: Record<string, string> = {
              critical: 'bg-red-500/20 text-red-400 border-red-500/30',
              high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
              medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
              low: 'bg-green-500/20 text-green-400 border-green-500/30',
            };
            return (
              <div
                key={priority}
                className={`p-4 rounded-lg border ${colors[priority]}`}
              >
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm capitalize">{priority}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export { Dashboard as DashboardPage };
