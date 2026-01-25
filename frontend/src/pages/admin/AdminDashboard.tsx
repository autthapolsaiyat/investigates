/**
 * Admin Dashboard Page
 * Overview statistics and quick actions for administrators
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Building2,
  Briefcase,
  Clock,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  XCircle,
  Activity,
  Calendar,
  Shield
} from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { registrationAPI, usersAPI, organizationsAPI, casesAPI } from '../../services/api';
import type { RegistrationStats } from '../../services/api';

interface DashboardStats {
  totalUsers: number;
  totalOrganizations: number;
  totalCases: number;
  activeUsers: number;
  registrations: RegistrationStats | null;
}

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalOrganizations: 0,
    totalCases: 0,
    activeUsers: 0,
    registrations: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all stats in parallel
      const [usersRes, orgsRes, casesRes, regStats] = await Promise.all([
        usersAPI.list({ page: 1, page_size: 1 }).catch(() => ({ total: 0 })),
        organizationsAPI.list({ page: 1, page_size: 1 }).catch(() => ({ total: 0 })),
        casesAPI.list({ page: 1, page_size: 1 }).catch(() => ({ total: 0 })),
        registrationAPI.getStats().catch(() => null),
      ]);

      setStats({
        totalUsers: usersRes.total || 0,
        totalOrganizations: orgsRes.total || 0,
        totalCases: casesRes.total || 0,
        activeUsers: usersRes.total || 0, // TODO: Filter by active status
        registrations: regStats,
      });
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError('Unable to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const quickActions = [
    {
      label: 'View Registration Requests',
      description: `${stats.registrations?.pending || 0} items pending approval`,
      icon: UserPlus,
      to: '/admin/registrations',
      color: 'from-yellow-500 to-orange-500',
      highlight: (stats.registrations?.pending || 0) > 0,
    },
    {
      label: 'Manage Users',
      description: `${stats.totalUsers} total users`,
      icon: Users,
      to: '/admin/users',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Manage Organizations',
      description: `${stats.totalOrganizations} organizations`,
      icon: Building2,
      to: '/admin/organizations',
      color: 'from-purple-500 to-pink-500',
    },
    {
      label: 'System Settings',
      description: 'Configure system',
      icon: Shield,
      to: '/admin/settings',
      color: 'from-gray-500 to-gray-600',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="w-7 h-7 text-red-400" />
            Admin Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Overview and system management</p>
        </div>
        <Button onClick={fetchStats} variant="secondary" disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">total users</p>
              <p className="text-3xl font-bold text-white">
                {isLoading ? '-' : stats.totalUsers}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </Card>

        {/* Pending Registrations */}
        <Card className={`p-5 ${(stats.registrations?.pending || 0) > 0 ? 'ring-2 ring-yellow-500/50' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Pending Approval</p>
              <p className="text-3xl font-bold text-white">
                {isLoading ? '-' : stats.registrations?.pending || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          {(stats.registrations?.pending || 0) > 0 && (
            <button
              onClick={() => navigate('/admin/registrations')}
              className="mt-3 text-sm text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
            >
              Check now <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </Card>

        {/* Organizations */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">organizations</p>
              <p className="text-3xl font-bold text-white">
                {isLoading ? '-' : stats.totalOrganizations}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </Card>

        {/* Total Cases */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Cases</p>
              <p className="text-3xl font-bold text-white">
                {isLoading ? '-' : stats.totalCases}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Registration Stats */}
      {stats.registrations && (
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary-400" />
            Registration Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-dark-800 rounded-lg text-center">
              <p className="text-2xl font-bold text-white">{stats.registrations.total}</p>
              <p className="text-sm text-gray-400">All</p>
            </div>
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-yellow-400" />
                <p className="text-2xl font-bold text-yellow-400">{stats.registrations.pending}</p>
              </div>
              <p className="text-sm text-gray-400">Pending Approval</p>
            </div>
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <p className="text-2xl font-bold text-green-400">{stats.registrations.approved}</p>
              </div>
              <p className="text-sm text-gray-400">Approved</p>
            </div>
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-400" />
                <p className="text-2xl font-bold text-red-400">{stats.registrations.rejected}</p>
              </div>
              <p className="text-sm text-gray-400">Rejected</p>
            </div>
          </div>
          
          {/* Today's Registrations */}
          {stats.registrations.today > 0 && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-400" />
              <p className="text-blue-400">
                Today has new registration requests: <span className="font-bold">{stats.registrations.today}</span> items
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-400" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.to}
              onClick={() => navigate(action.to)}
              className={`p-5 rounded-xl text-left transition-all hover:scale-[1.02] ${
                action.highlight
                  ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 hover:border-yellow-400/50'
                  : 'bg-dark-800 border border-dark-700 hover:border-dark-500'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white font-medium mb-1">{action.label}</h3>
              <p className="text-sm text-gray-400">{action.description}</p>
              {action.highlight && (
                <div className="mt-2 flex items-center gap-1 text-yellow-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Needs action</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* System Info */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-400" />
          System Info
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Version</p>
            <p className="text-white font-medium">1.0.0</p>
          </div>
          <div>
            <p className="text-gray-500">Status API</p>
            <p className="text-green-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Online
            </p>
          </div>
          <div>
            <p className="text-gray-500">Last Update</p>
            <p className="text-white font-medium">{new Date().toLocaleDateString('en-US')}</p>
          </div>
          <div>
            <p className="text-gray-500">Environment</p>
            <p className="text-white font-medium">Production</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export { AdminDashboard as AdminDashboardPage };
export default AdminDashboard;
