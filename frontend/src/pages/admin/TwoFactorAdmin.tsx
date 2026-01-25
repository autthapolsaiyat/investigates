/**
 * Admin Two-Factor Authentication Management Page
 * View and reset users' 2FA settings
 */
import { useState, useEffect } from 'react';
import { 
  Shield, ShieldCheck, ShieldOff, Search, RefreshCw, 
  AlertCircle, UserX, Users, TrendingUp, Check
} from 'lucide-react';
import { Button, Input, Card, Badge } from '../../components/ui';
import { twoFactorAPI } from '../../services/api';
import type { TwoFAUserStatus, TwoFAStats } from '../../services/api';
import { useSettingsStore } from '../../store/settingsStore';

export default function TwoFactorAdmin() {
  const language = useSettingsStore((state) => state.language);
  
  const [users, setUsers] = useState<TwoFAUserStatus[]>([]);
  const [stats, setStats] = useState<TwoFAStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  
  // Reset modal
  const [resetModal, setResetModal] = useState<TwoFAUserStatus | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const t = {
    th: {
      title: 'Manage 2FA',
      subtitle: 'View and reset user 2FA',
      totalUsers: 'Total Users',
      with2FA: 'Enabled 2FA',
      without2FA: 'Without 2FA',
      adoptionRate: 'Adoption Rate',
      search: 'Search users...',
      filterAll: 'All',
      filterEnabled: '2FA Enabled',
      filterDisabled: '2FA Not Enabled',
      enabled: 'Enabled',
      disabled: 'Not Enabled',
      enabledAt: 'Enabled at',
      reset: 'Reset 2FA',
      noAction: 'No 2FA',
      confirmReset: 'Confirm Reset 2FA',
      confirmResetDesc: 'User will need to setup 2FA again',
      cancel: 'Cancel',
      confirm: 'Confirm',
      loading: 'Loading...',
      error: 'Error occurred',
      noUsers: 'No users found',
      resetSuccess: '2FA reset successful for',
    },
    en: {
      title: '2FA Management',
      subtitle: 'View and reset users\' 2FA settings',
      totalUsers: 'Total Users',
      with2FA: '2FA Enabled',
      without2FA: '2FA Not Enabled',
      adoptionRate: 'Adoption Rate',
      search: 'Search users...',
      filterAll: 'All',
      filterEnabled: '2FA Enabled',
      filterDisabled: '2FA Disabled',
      enabled: 'Enabled',
      disabled: 'Disabled',
      enabledAt: 'Enabled at',
      reset: 'Reset 2FA',
      noAction: 'No 2FA',
      confirmReset: 'Confirm 2FA Reset',
      confirmResetDesc: 'User will need to set up 2FA again',
      cancel: 'Cancel',
      confirm: 'Confirm',
      loading: 'Loading...',
      error: 'Error',
      noUsers: 'No users found',
      resetSuccess: '2FA reset successful for',
    },
  }[language];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersData, statsData] = await Promise.all([
        twoFactorAPI.listUsers(),
        twoFactorAPI.getStats(),
      ]);
      setUsers(usersData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!resetModal) return;
    
    try {
      setResetting(true);
      setError(null);
      const result = await twoFactorAPI.resetUser(resetModal.user_id);
      setResetSuccess(`${t.resetSuccess} ${result.email}`);
      setResetModal(null);
      loadData();
      setTimeout(() => setResetSuccess(null), 5000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset 2FA');
    } finally {
      setResetting(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.full_name.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'enabled' && user.two_fa_enabled) ||
      (filter === 'disabled' && !user.two_fa_enabled);
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="p-8 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary-400" />
        <p className="text-dark-400 mt-2">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-primary-400" />
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-dark-400">{t.subtitle}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Success */}
      {resetSuccess && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
          <Check className="w-5 h-5 text-green-400" />
          <p className="text-green-400">{resetSuccess}</p>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total_active_users}</p>
                <p className="text-sm text-dark-400">{t.totalUsers}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.users_with_2fa}</p>
                <p className="text-sm text-dark-400">{t.with2FA}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <ShieldOff className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.users_without_2fa}</p>
                <p className="text-sm text-dark-400">{t.without2FA}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.adoption_rate}%</p>
                <p className="text-sm text-dark-400">{t.adoptionRate}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <Input
              type="text"
              placeholder={t.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filter */}
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              {t.filterAll}
            </Button>
            <Button
              variant={filter === 'enabled' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('enabled')}
            >
              <ShieldCheck className="w-4 h-4 mr-1" />
              {t.filterEnabled}
            </Button>
            <Button
              variant={filter === 'disabled' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('disabled')}
            >
              <ShieldOff className="w-4 h-4 mr-1" />
              {t.filterDisabled}
            </Button>
          </div>
          
          {/* Refresh */}
          <Button variant="secondary" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <UserX className="w-12 h-12 text-dark-600 mx-auto mb-2" />
            <p className="text-dark-400">{t.noUsers}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left p-4 text-dark-400 font-medium">Email</th>
                  <th className="text-left p-4 text-dark-400 font-medium">Name</th>
                  <th className="text-left p-4 text-dark-400 font-medium">2FA Status</th>
                  <th className="text-left p-4 text-dark-400 font-medium">{t.enabledAt}</th>
                  <th className="text-right p-4 text-dark-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.user_id} className="border-b border-dark-800 hover:bg-dark-800/50">
                    <td className="p-4 text-white">{user.email}</td>
                    <td className="p-4 text-dark-300">{user.full_name}</td>
                    <td className="p-4">
                      {user.two_fa_enabled ? (
                        <Badge variant="success">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          {t.enabled}
                        </Badge>
                      ) : (
                        <Badge variant="default">
                          <ShieldOff className="w-3 h-3 mr-1" />
                          {t.disabled}
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 text-dark-400 text-sm">
                      {user.two_fa_enabled_at
                        ? new Date(user.two_fa_enabled_at).toLocaleDateString(
                            language === 'th' ? 'en-US' : 'en-US'
                          )
                        : '-'}
                    </td>
                    <td className="p-4 text-right">
                      {user.two_fa_enabled ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setResetModal(user)}
                        >
                          {t.reset}
                        </Button>
                      ) : (
                        <span className="text-dark-500 text-sm">{t.noAction}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Reset Modal */}
      {resetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <h3 className="text-lg font-semibold text-white">{t.confirmReset}</h3>
            </div>
            
            <div className="p-3 bg-dark-800 rounded-lg mb-4">
              <p className="text-white font-medium">{resetModal.full_name}</p>
              <p className="text-dark-400 text-sm">{resetModal.email}</p>
            </div>
            
            <p className="text-dark-300 mb-6">{t.confirmResetDesc}</p>
            
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setResetModal(null)}
                disabled={resetting}
              >
                {t.cancel}
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleReset}
                disabled={resetting}
              >
                {resetting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                {t.confirm}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
