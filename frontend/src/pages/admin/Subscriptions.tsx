/**
 * Subscriptions Page (Admin)
 * Manage user subscriptions - Renew, Cancel, View
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
  ChevronRight,
  X,
  Plus,
  Ban,
  Loader2
} from 'lucide-react';
import { Card, Input, Button } from '../../components/ui';
import { usersAPI } from '../../services/api';
import type { User as UserType } from '../../services/api';

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

const Modal = ({ isOpen, onClose, children, title }: ModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-dark-800 rounded-xl p-6 w-full max-w-md mx-4 border border-dark-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Subscription Duration Options
const DURATION_OPTIONS = [
  { label: '7 days (Trial)', days: 7, price: 'Free' },
  { label: '1 month', days: 30, price: '฿2,500' },
  { label: '3 months', days: 90, price: '฿6,000' },
  { label: '6 months', days: 180, price: '฿10,000' },
  { label: '1 year', days: 365, price: '฿18,000' },
];

export const Subscriptions = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [selectedDays, setSelectedDays] = useState(30);
  const [customDays, setCustomDays] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    if (!user.subscription_end) return { status: 'none', label: 'None', color: 'gray' };
    
    const endDate = new Date(user.subscription_end);
    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { status: 'expired', label: 'Expired', color: 'red', days: daysLeft };
    if (daysLeft <= 7) return { status: 'expiring', label: 'Expiring soon', color: 'yellow', days: daysLeft };
    return { status: 'active', label: 'Active', color: 'green', days: daysLeft };
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
        {status.days !== undefined && status.days > 0 && ` (${status.days} days)`}
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

  // Open Renew Modal
  const openRenewModal = (user: UserType) => {
    setSelectedUser(user);
    setSelectedDays(30);
    setCustomDays('');
    setSuccessMessage(null);
    setShowRenewModal(true);
  };

  // Open Cancel Modal
  const openCancelModal = (user: UserType) => {
    setSelectedUser(user);
    setShowCancelModal(true);
  };

  // Handle Renew
  const handleRenew = async () => {
    if (!selectedUser) return;
    
    const days = customDays ? parseInt(customDays) : selectedDays;
    if (!days || days < 1) {
      alert('Please enter valid number of days');
      return;
    }

    setSaving(true);
    try {
      const result = await usersAPI.renewSubscription(selectedUser.id, days);
      setSuccessMessage(`Renewed successfully! Expires on ${new Date(result.subscription_end).toLocaleDateString('en-US')}`);
      fetchUsers();
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowRenewModal(false);
        setSuccessMessage(null);
      }, 2000);
    } catch (err) {
      console.error('Error renewing subscription:', err);
      alert('Error renewing subscription');
    } finally {
      setSaving(false);
    }
  };

  // Handle Cancel
  const handleCancel = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      await usersAPI.cancelSubscription(selectedUser.id);
      setShowCancelModal(false);
      fetchUsers();
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      alert('Error cancelling subscription');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <CreditCard className="w-7 h-7 text-primary-400" />
            Subscriptions
          </h1>
          <p className="text-gray-400 mt-1">User Subscription Management</p>
        </div>
        <Button onClick={fetchUsers} variant="secondary" disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
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
              <p className="text-sm text-gray-400">Active</p>
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
              <p className="text-sm text-gray-400">Expiring soon</p>
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
              <p className="text-sm text-gray-400">Expired</p>
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
              <p className="text-sm text-gray-400">None Subscription</p>
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
              placeholder="Search users..."
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
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="expiring">Expiring soon</option>
              <option value="expired">Expired</option>
              <option value="none">None Subscription</option>
            </select>
          </div>
        </div>
      </Card>

      {/* User List */}
      <Card>
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <User className="w-12 h-12 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">No users found</p>
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
                        <p className="text-white font-medium truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-gray-400 truncate">{user.email}</p>
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
                            {new Date(user.subscription_start).toLocaleDateString('en-US')}
                          </p>
                          <p className="text-gray-500">
                            Until {new Date(user.subscription_end).toLocaleDateString('en-US')}
                          </p>
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => openRenewModal(user)}
                          title="Renew"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Renew
                        </Button>
                        {(subStatus.status === 'active' || subStatus.status === 'expiring') && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => openCancelModal(user)}
                            title="Cancel"
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
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
            <p className="text-sm text-gray-400">Page {page} of {totalPages}</p>
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

      {/* Renew Modal */}
      <Modal 
        isOpen={showRenewModal} 
        onClose={() => setShowRenewModal(false)} 
        title="Renew Subscription"
      >
        {successMessage ? (
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-green-400">{successMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* User Info */}
            <div className="p-3 bg-dark-700 rounded-lg">
              <p className="text-white font-medium">{selectedUser?.first_name} {selectedUser?.last_name}</p>
              <p className="text-sm text-gray-400">{selectedUser?.email}</p>
              {selectedUser?.subscription_end && (
                <p className="text-sm text-gray-500 mt-1">
                  Current expiry: {new Date(selectedUser.subscription_end).toLocaleDateString('en-US')}
                </p>
              )}
            </div>

            {/* Duration Options */}
            <div>
              <label className="block text-sm font-medium mb-2">Select duration</label>
              <div className="grid grid-cols-2 gap-2">
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.days}
                    onClick={() => { setSelectedDays(option.days); setCustomDays(''); }}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      selectedDays === option.days && !customDays
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dark-600 hover:border-dark-500'
                    }`}
                  >
                    <p className="font-medium text-white">{option.label}</p>
                    <p className="text-sm text-gray-400">{option.price}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Days */}
            <div>
              <label className="block text-sm font-medium mb-2">Or specify number of days</label>
              <Input
                type="number"
                placeholder="e.g. 45"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                min={1}
                max={3650}
              />
            </div>

            {/* Summary */}
            <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
              <p className="text-primary-400 text-sm">
                Will add duration: <strong>{customDays || selectedDays} days</strong>
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button 
                variant="ghost" 
                className="flex-1" 
                onClick={() => setShowRenewModal(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleRenew}
                disabled={saving}
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm Renew
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Modal */}
      <Modal 
        isOpen={showCancelModal} 
        onClose={() => setShowCancelModal(false)} 
        title="Cancel Subscription"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">Warning</p>
                <p className="text-sm text-gray-400 mt-1">
                  Cancelling subscription will immediately prevent user from using the system
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-dark-700 rounded-lg">
            <p className="text-white font-medium">{selectedUser?.first_name} {selectedUser?.last_name}</p>
            <p className="text-sm text-gray-400">{selectedUser?.email}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              variant="ghost" 
              className="flex-1" 
              onClick={() => setShowCancelModal(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              className="flex-1" 
              onClick={handleCancel}
              disabled={saving}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export { Subscriptions as SubscriptionsPage };
