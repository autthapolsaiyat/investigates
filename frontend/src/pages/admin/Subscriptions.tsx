/**
 * Subscriptions Page (Admin)
 * Manage user subscriptions
 */
import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  RefreshCw, 
  User, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, Input, Button, Badge } from '../../components/ui';
import { usersAPI } from '../../services/api';
import type { User as UserType } from '../../services/api';

export const Subscriptions = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await usersAPI.list({ page, page_size: 20, search: search || undefined });
      setUsers(response.items);
      setTotalPages(response.pages);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const getSubscriptionStatus = (user: UserType) => {
    if (!user.subscription_end) return { status: 'none', label: 'ไม่มี', color: 'gray' };
    
    const endDate = new Date(user.subscription_end);
    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { status: 'expired', label: 'หมดอายุ', color: 'red', days: daysLeft };
    if (daysLeft <= 7) return { status: 'expiring', label: 'ใกล้หมดอายุ', color: 'yellow', days: daysLeft };
    return { status: 'active', label: 'ใช้งานได้', color: 'green', days: daysLeft };
  };

  const getStatusBadge = (status: { status: string; label: string; color: string; days?: number }) => {
    const colors: Record<string, string> = {
      green: 'bg-green-500/20 text-green-400 border-green-500/30',
      yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      red: 'bg-red-500/20 text-red-400 border-red-500/30',
      gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${colors[status.color]}`}>
        {status.status === 'active' && <CheckCircle className="w-3 h-3" />}
        {status.status === 'expiring' && <AlertTriangle className="w-3 h-3" />}
        {status.status === 'expired' && <XCircle className="w-3 h-3" />}
        {status.status === 'none' && <Clock className="w-3 h-3" />}
        {status.label}
        {status.days !== undefined && status.days > 0 && ` (${status.days} วัน)`}
      </span>
    );
  };

  // Filter users based on subscription status
  const filteredUsers = users.filter(user => {
    if (!filter) return true;
    const status = getSubscriptionStatus(user);
    return status.status === filter;
  });

  // Count by status
  const statusCounts = users.reduce((acc, user) => {
    const status = getSubscriptionStatus(user).status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <CreditCard className="w-7 h-7 text-primary-400" />
            Subscriptions
          </h1>
          <p className="text-gray-400 mt-1">จัดการ Subscription ของผู้ใช้</p>
        </div>
        <Button onClick={fetchUsers} variant="secondary" disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          รีเฟรช
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{statusCounts['active'] || 0}</p>
              <p className="text-sm text-gray-400">ใช้งานได้</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{statusCounts['expiring'] || 0}</p>
              <p className="text-sm text-gray-400">ใกล้หมดอายุ</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{statusCounts['expired'] || 0}</p>
              <p className="text-sm text-gray-400">หมดอายุ</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{statusCounts['none'] || 0}</p>
              <p className="text-sm text-gray-400">ไม่มี Subscription</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="ค้นหาผู้ใช้..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
            >
              <option value="">ทั้งหมด</option>
              <option value="active">ใช้งานได้</option>
              <option value="expiring">ใกล้หมดอายุ</option>
              <option value="expired">หมดอายุ</option>
              <option value="none">ไม่มี Subscription</option>
            </select>
          </div>
        </div>
      </Card>

      {/* User List */}
      <Card>
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-400">กำลังโหลด...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <User className="w-12 h-12 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">ไม่พบผู้ใช้</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-700">
            {filteredUsers.map((user) => {
              const subStatus = getSubscriptionStatus(user);
              return (
                <div key={user.id} className="p-4 hover:bg-dark-800/50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center text-primary-400 font-bold">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{user.email}</p>
                        <p className="text-sm text-gray-400 truncate">
                          {user.organization_name || 'ไม่ระบุหน่วยงาน'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Subscription Status */}
                      {getStatusBadge(subStatus)}
                      
                      {/* Subscription Dates */}
                      {user.subscription_start && user.subscription_end && (
                        <div className="text-right text-sm hidden md:block">
                          <p className="text-gray-500">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(user.subscription_start).toLocaleDateString('th-TH')}
                          </p>
                          <p className="text-gray-500">
                            ถึง {new Date(user.subscription_end).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                      )}
                      
                      {/* Actions */}
                      <Button size="sm" variant="secondary">
                        ต่ออายุ
                      </Button>
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
            <p className="text-sm text-gray-400">หน้า {page} จาก {totalPages}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Coming Soon Notice */}
      <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg text-center">
        <p className="text-primary-400">🚧 ฟังก์ชันต่ออายุ/ปรับ Subscription กำลังพัฒนา</p>
      </div>
    </div>
  );
};

export { Subscriptions as SubscriptionsPage };
