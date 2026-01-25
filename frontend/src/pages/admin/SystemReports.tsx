/**
 * System Reports Page (Admin)
 * View system statistics and generate reports with real API
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  FileText, Download, Calendar, TrendingUp, Users, Briefcase,
  BarChart3, PieChart, RefreshCw, Activity, LogIn, Shield,
  ChevronDown, ChevronUp, Globe, Monitor, Smartphone
} from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { 
  reportsAPI, 
  type OverviewStats, 
  type UserStats, 
  type CaseStats,
  type FeatureUsage,
  type LoginStats
} from '../../services/api';

const daysOptions = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 365, label: '1 year' },
];

export const SystemReports = () => {
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');
  
  // Stats data
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [caseStats, setCaseStats] = useState<CaseStats | null>(null);
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage | null>(null);
  const [loginStats, setLoginStats] = useState<LoginStats | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, usersRes, casesRes, featuresRes, loginsRes] = await Promise.all([
        reportsAPI.getOverview(days),
        reportsAPI.getUserStats(days),
        reportsAPI.getCaseStats(days),
        reportsAPI.getFeatureUsage(days),
        reportsAPI.getLoginStats(days),
      ]);
      
      setOverview(overviewRes);
      setUserStats(usersRes);
      setCaseStats(casesRes);
      setFeatureUsage(featuresRes);
      setLoginStats(loginsRes);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = async (reportType: string) => {
    setExporting(reportType);
    try {
      const blob = await reportsAPI.exportReport(reportType, days);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `investigates_report_${reportType}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export report:', err);
      alert('Cannot download report');
    } finally {
      setExporting(null);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="w-7 h-7 text-primary-400" />
            System Reports
          </h1>
          <p className="text-gray-400 mt-1">Statistics and System Reports</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
            >
              {daysOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          <Button variant="secondary" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="p-12 text-center">
          <RefreshCw className="w-10 h-10 animate-spin mx-auto text-primary-400" />
          <p className="text-gray-400 mt-4">Loading report data...</p>
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          {overview && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <Card className="p-4 text-center">
                <LogIn className="w-6 h-6 mx-auto text-blue-400 mb-2" />
                <p className="text-2xl font-bold text-white">{formatNumber(overview.total_logins)}</p>
                <p className="text-xs text-gray-400">Total Logins</p>
              </Card>
              <Card className="p-4 text-center">
                <Users className="w-6 h-6 mx-auto text-green-400 mb-2" />
                <p className="text-2xl font-bold text-white">{formatNumber(overview.unique_users)}</p>
                <p className="text-xs text-gray-400">Unique Users</p>
              </Card>
              <Card className="p-4 text-center">
                <Briefcase className="w-6 h-6 mx-auto text-purple-400 mb-2" />
                <p className="text-2xl font-bold text-white">{formatNumber(overview.cases_created)}</p>
                <p className="text-xs text-gray-400">Cases Created</p>
              </Card>
              <Card className="p-4 text-center">
                <Activity className="w-6 h-6 mx-auto text-cyan-400 mb-2" />
                <p className="text-2xl font-bold text-white">{formatNumber(overview.active_cases)}</p>
                <p className="text-xs text-gray-400">Active Cases</p>
              </Card>
              <Card className="p-4 text-center">
                <Users className="w-6 h-6 mx-auto text-yellow-400 mb-2" />
                <p className="text-2xl font-bold text-white">{formatNumber(overview.total_users)}</p>
                <p className="text-xs text-gray-400">Total Users</p>
              </Card>
              <Card className="p-4 text-center">
                <TrendingUp className="w-6 h-6 mx-auto text-emerald-400 mb-2" />
                <p className="text-2xl font-bold text-white">{formatNumber(overview.new_users)}</p>
                <p className="text-xs text-gray-400">New Users</p>
              </Card>
              <Card className="p-4 text-center">
                <Shield className="w-6 h-6 mx-auto text-red-400 mb-2" />
                <p className="text-2xl font-bold text-white">{formatNumber(overview.failed_logins)}</p>
                <p className="text-xs text-gray-400">Failed Logins</p>
              </Card>
              <Card className="p-4 text-center">
                <FileText className="w-6 h-6 mx-auto text-orange-400 mb-2" />
                <p className="text-2xl font-bold text-white">{formatNumber(overview.active_subscriptions)}</p>
                <p className="text-xs text-gray-400">Active Subs</p>
              </Card>
            </div>
          )}

          {/* Feature Usage */}
          {featureUsage && (
            <Card className="p-5">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('features')}
              >
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary-400" />
                  Most Used Features ({days} days)
                </h2>
                {expandedSection === 'features' ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
              
              {expandedSection === 'features' && (
                <div className="mt-4 space-y-4">
                  {featureUsage.features.map((feature, index) => (
                    <div key={feature.name} className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 w-4">{index + 1}.</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white">{feature.name}</span>
                          <span className="text-sm text-gray-400">
                            {formatNumber(feature.usage)} times ({feature.percentage}%)
                          </span>
                        </div>
                        <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all"
                            style={{ width: `${Math.min(feature.percentage * 2, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* User Stats */}
          {userStats && (
            <Card className="p-5">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('users')}
              >
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-400" />
                  User Statistics
                </h2>
                {expandedSection === 'users' ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
              
              {expandedSection === 'users' && (
                <div className="mt-4 grid md:grid-cols-3 gap-6">
                  {/* By Role */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3">By Role</h3>
                    <div className="space-y-2">
                      {Object.entries(userStats.by_role).map(([role, count]) => (
                        <div key={role} className="flex items-center justify-between">
                          <span className="text-gray-300 capitalize">{role.replace('_', ' ')}</span>
                          <span className="text-primary-400 font-medium">{formatNumber(count)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Subscription Status */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Subscription Status</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-green-400">Active</span>
                        <span className="text-white font-medium">{formatNumber(userStats.subscription_status.active)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-red-400">Expired</span>
                        <span className="text-white font-medium">{formatNumber(userStats.subscription_status.expired)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">No Subscription</span>
                        <span className="text-white font-medium">{formatNumber(userStats.subscription_status.none)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Top Active Users */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Most Active Users</h3>
                    <div className="space-y-2">
                      {userStats.top_active_users.slice(0, 5).map((user, i) => (
                        <div key={user.user_id} className="flex items-center justify-between">
                          <span className="text-gray-300 truncate text-sm">
                            {i + 1}. {user.name || user.email}
                          </span>
                          <span className="text-primary-400 text-sm">{user.login_count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Case Stats */}
          {caseStats && (
            <Card className="p-5">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('cases')}
              >
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-purple-400" />
                  Case Statistics
                </h2>
                {expandedSection === 'cases' ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
              
              {expandedSection === 'cases' && (
                <div className="mt-4 grid md:grid-cols-2 gap-6">
                  {/* By Status */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3">By Status</h3>
                    <div className="space-y-2">
                      {Object.entries(caseStats.by_status).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-gray-300 capitalize">{status.replace('_', ' ')}</span>
                          <span className="text-primary-400 font-medium">{formatNumber(count)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between border-t border-dark-600 pt-2 mt-2">
                        <span className="text-white font-medium">Total</span>
                        <span className="text-white font-medium">{formatNumber(caseStats.total_cases)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* By Type */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3">By Type</h3>
                    {Object.keys(caseStats.by_type).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(caseStats.by_type).map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between">
                            <span className="text-gray-300">{type}</span>
                            <span className="text-primary-400 font-medium">{formatNumber(count)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No case type data yet</p>
                    )}
                    
                    <div className="mt-4 pt-2 border-t border-dark-600">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-red-400">Deleted Cases</span>
                        <span className="text-red-400 font-medium">{formatNumber(caseStats.deleted_cases)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Login Stats */}
          {loginStats && (
            <Card className="p-5">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('logins')}
              >
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <LogIn className="w-5 h-5 text-blue-400" />
                  Login Statistics
                </h2>
                {expandedSection === 'logins' ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
              
              {expandedSection === 'logins' && (
                <div className="mt-4 grid md:grid-cols-2 gap-6">
                  {/* By Device */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3">By Device</h3>
                    <div className="space-y-2">
                      {Object.entries(loginStats.by_device).map(([device, count]) => (
                        <div key={device} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {device === 'desktop' ? (
                              <Monitor className="w-4 h-4 text-gray-400" />
                            ) : device === 'mobile' ? (
                              <Smartphone className="w-4 h-4 text-gray-400" />
                            ) : (
                              <Globe className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-gray-300 capitalize">{device || 'Unknown'}</span>
                          </div>
                          <span className="text-primary-400 font-medium">{formatNumber(count)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* By Country */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3">By Country</h3>
                    {loginStats.by_country.length > 0 ? (
                      <div className="space-y-2">
                        {loginStats.by_country.slice(0, 5).map((item) => (
                          <div key={item.country} className="flex items-center justify-between">
                            <span className="text-gray-300">{item.country}</span>
                            <span className="text-primary-400 font-medium">{formatNumber(item.count)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No country data yet</p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Generate Reports */}
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary-400" />
              Download Report
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { id: 'overview', name: 'Overview', icon: BarChart3 },
                { id: 'users', name: 'Users', icon: Users },
                { id: 'cases', name: 'Cases', icon: Briefcase },
                { id: 'logins', name: 'Logins', icon: LogIn },
                { id: 'activity', name: 'Activity', icon: Activity },
                { id: 'features', name: 'Features', icon: TrendingUp },
              ].map((report) => (
                <Button
                  key={report.id}
                  variant="secondary"
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={() => handleExport(report.id)}
                  disabled={exporting === report.id}
                >
                  {exporting === report.id ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <report.icon className="w-5 h-5" />
                  )}
                  <span className="text-xs">{report.name}</span>
                  <Download className="w-3 h-3 text-gray-500" />
                </Button>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export { SystemReports as SystemReportsPage };
