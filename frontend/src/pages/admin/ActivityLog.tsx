/**
 * Activity Log Page (Admin)
 * View system activity logs with real API
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  Activity, Search, Filter, RefreshCw, User, Clock, 
  ChevronLeft, ChevronRight, TrendingUp, Users, Calendar,
  LogIn, FileText, Ticket, Building, Settings, Shield
} from 'lucide-react';
import { Card, Input, Button } from '../../components/ui';
import { activityLogAPI, type ActivityLogItem, type ActivityLogStats } from '../../services/api';

// Activity type icons
const activityIcons: Record<string, typeof Activity> = {
  auth_login: LogIn,
  auth_logout: LogIn,
  auth_failed_login: Shield,
  case_create: FileText,
  case_update: FileText,
  case_delete: FileText,
  ticket_create: Ticket,
  ticket_update: Ticket,
  registration_approve: Users,
  registration_reject: Users,
  org_create: Building,
  org_update: Building,
  user_create: User,
  user_update: User,
  system_settings_update: Settings,
};

// Activity type colors
const activityColors: Record<string, string> = {
  auth_login: 'bg-green-500/20 text-green-400',
  auth_logout: 'bg-gray-500/20 text-gray-400',
  auth_failed_login: 'bg-red-500/20 text-red-400',
  case_create: 'bg-blue-500/20 text-blue-400',
  case_update: 'bg-blue-500/20 text-blue-400',
  case_delete: 'bg-red-500/20 text-red-400',
  ticket_create: 'bg-purple-500/20 text-purple-400',
  ticket_update: 'bg-purple-500/20 text-purple-400',
  registration_approve: 'bg-green-500/20 text-green-400',
  registration_reject: 'bg-red-500/20 text-red-400',
  org_create: 'bg-cyan-500/20 text-cyan-400',
  org_update: 'bg-cyan-500/20 text-cyan-400',
  user_create: 'bg-yellow-500/20 text-yellow-400',
  user_update: 'bg-yellow-500/20 text-yellow-400',
  subscription_renew: 'bg-green-500/20 text-green-400',
  license_activate: 'bg-green-500/20 text-green-400',
};

const activityTypeLabels: Record<string, string> = {
  auth_login: 'เข้าสู่ระบบ',
  auth_logout: 'ออกจากระบบ',
  auth_failed_login: 'เข้าสู่ระบบล้มเหลว',
  auth_password_change: 'เปลี่ยนรหัสผ่าน',
  auth_password_reset: 'รีเซ็ตรหัสผ่าน',
  user_create: 'สร้างผู้ใช้',
  user_update: 'แก้ไขผู้ใช้',
  user_delete: 'ลบผู้ใช้',
  registration_submit: 'ส่งคำขอสมัคร',
  registration_approve: 'อนุมัติการสมัคร',
  registration_reject: 'ปฏิเสธการสมัคร',
  subscription_renew: 'ต่ออายุ Subscription',
  subscription_cancel: 'ยกเลิก Subscription',
  license_activate: 'เปิดใช้งาน License',
  case_create: 'สร้างคดี',
  case_update: 'แก้ไขคดี',
  case_delete: 'ลบคดี',
  case_restore: 'กู้คืนคดี',
  evidence_upload: 'อัพโหลดหลักฐาน',
  evidence_delete: 'ลบหลักฐาน',
  ticket_create: 'สร้าง Ticket',
  ticket_update: 'แก้ไข Ticket',
  ticket_resolve: 'ปิด Ticket',
  org_create: 'สร้างองค์กร',
  org_update: 'แก้ไของค์กร',
};

export const ActivityLog = () => {
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [stats, setStats] = useState<ActivityLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [activityType, setActivityType] = useState('');
  const [days, setDays] = useState(7);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await activityLogAPI.list({
        page,
        page_size: pageSize,
        activity_type: activityType || undefined,
        search: search || undefined,
        days,
      });
      
      setActivities(response.items);
      setTotalPages(response.pages);
      setTotal(response.total);
    } catch (err) {
      console.error('Failed to load activities:', err);
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  }, [page, activityType, search, days]);

  const loadStats = useCallback(async () => {
    try {
      const response = await activityLogAPI.getStats();
      setStats(response);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  useEffect(() => {
    loadActivities();
    loadStats();
  }, [loadActivities, loadStats]);

  const handleRefresh = () => {
    loadActivities();
    loadStats();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadActivities();
  };

  const getActivityIcon = (type: string) => {
    const Icon = activityIcons[type] || Activity;
    return Icon;
  };

  const getActivityColor = (type: string) => {
    return activityColors[type] || 'bg-dark-700 text-gray-400';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'เมื่อสักครู่';
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    if (days < 7) return `${days} วันที่แล้ว`;
    return date.toLocaleDateString('th-TH');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="w-7 h-7 text-primary-400" />
            Activity Log
          </h1>
          <p className="text-gray-400 mt-1">บันทึกกิจกรรมในระบบ</p>
        </div>
        <Button variant="secondary" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          รีเฟรช
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total_today}</p>
                <p className="text-sm text-gray-400">วันนี้</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total_week}</p>
                <p className="text-sm text-gray-400">สัปดาห์นี้</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total_month}</p>
                <p className="text-sm text-gray-400">เดือนนี้</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.top_users.length}</p>
                <p className="text-sm text-gray-400">ผู้ใช้งานหลัก</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="ค้นหากิจกรรม..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select 
              className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
              value={activityType}
              onChange={(e) => { setActivityType(e.target.value); setPage(1); }}
            >
              <option value="">ทุกประเภท</option>
              <option value="auth_login">เข้าสู่ระบบ</option>
              <option value="auth_failed_login">เข้าสู่ระบบล้มเหลว</option>
              <option value="case_create">สร้างคดี</option>
              <option value="case_update">แก้ไขคดี</option>
              <option value="case_delete">ลบคดี</option>
              <option value="registration_approve">อนุมัติการสมัคร</option>
              <option value="registration_reject">ปฏิเสธการสมัคร</option>
              <option value="ticket_create">สร้าง Ticket</option>
              <option value="subscription_renew">ต่ออายุ Subscription</option>
              <option value="license_activate">เปิดใช้งาน License</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <select 
              className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
              value={days}
              onChange={(e) => { setDays(Number(e.target.value)); setPage(1); }}
            >
              <option value={1}>วันนี้</option>
              <option value={7}>7 วัน</option>
              <option value={30}>30 วัน</option>
              <option value={90}>90 วัน</option>
            </select>
          </div>
          
          <Button type="submit" variant="primary">ค้นหา</Button>
        </form>
      </Card>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
          <p className="text-red-400">{error}</p>
          <Button variant="secondary" size="sm" className="mt-2" onClick={handleRefresh}>
            ลองใหม่
          </Button>
        </div>
      )}

      {/* Activity List */}
      <Card>
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary-400" />
            <p className="text-gray-400 mt-2">กำลังโหลด...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-12 h-12 mx-auto text-gray-600" />
            <p className="text-gray-400 mt-2">ไม่พบกิจกรรม</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-700">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.activity_type);
              const colorClass = getActivityColor(activity.activity_type);
              
              return (
                <div key={activity.id} className="p-4 hover:bg-dark-800/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-white font-medium">
                          {activity.user_name || activity.user_email || 'ระบบ'}
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-primary-400">
                          {activityTypeLabels[activity.activity_type] || activity.action}
                        </span>
                        {activity.target_name && (
                          <>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-300">{activity.target_name}</span>
                          </>
                        )}
                      </div>
                      {activity.details && (
                        <p className="text-sm text-gray-400 mb-1">{activity.details}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(activity.created_at)}
                        </div>
                        {activity.ip_address && (
                          <span>IP: {activity.ip_address}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-dark-700 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              แสดง {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} จาก {total} รายการ
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-gray-400 text-sm">
                หน้า {page} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Top Users & Recent Actions */}
      {stats && (stats.top_users.length > 0 || stats.recent_actions.length > 0) && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Users */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-400" />
              ผู้ใช้งานมากที่สุด (7 วัน)
            </h3>
            <div className="space-y-3">
              {stats.top_users.map((user, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-dark-700 rounded-full flex items-center justify-center text-sm font-medium text-white">
                      {i + 1}
                    </div>
                    <span className="text-gray-300 truncate">{user.user_email}</span>
                  </div>
                  <span className="text-primary-400 font-medium">{user.count}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Actions */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-400" />
              กิจกรรมยอดนิยม (7 วัน)
            </h3>
            <div className="space-y-3">
              {stats.recent_actions.map((action, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-gray-300">{activityTypeLabels[action.action] || action.action}</span>
                  <span className="text-primary-400 font-medium">{action.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export { ActivityLog as ActivityLogPage };
