/**
 * License Management Page
 * Admin interface for creating and managing license keys
 */
import { useState, useEffect } from 'react';
import { 
  Key, 
  Plus, 
  Search, 
  Copy, 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw,
  Filter,
  Trash2,
  Eye
} from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';

// Types
interface License {
  id: number;
  license_key: string;
  plan_type: 'basic' | 'professional' | 'enterprise';
  plan_name: string;
  days_valid: number;
  max_users: number;
  status: 'unused' | 'activated' | 'expired' | 'revoked';
  customer_name?: string;
  customer_contact?: string;
  notes?: string;
  organization_name?: string;
  activated_by_email?: string;
  activated_at?: string;
  expires_at?: string;
  days_remaining?: number;
  created_by_email?: string;
  created_at: string;
}

interface LicenseStats {
  total_unused: number;
  total_activated: number;
  total_expired: number;
  total_revoked: number;
}

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'https://investigates-api.azurewebsites.net/api/v1';

export const LicenseManagement = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [stats, setStats] = useState<LicenseStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [planFilter, setPlanFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Create form
  const [createForm, setCreateForm] = useState({
    plan_type: 'professional',
    days_valid: 365,
    max_users: 5,
    customer_name: '',
    customer_contact: '',
    notes: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  });

  const fetchLicenses = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '20'
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (planFilter) params.append('plan_type', planFilter);

      const response = await fetch(`${API_URL}/licenses?${params}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setLicenses(data.items);
        setTotalPages(data.pages);
        setStats({
          total_unused: data.total_unused,
          total_activated: data.total_activated,
          total_expired: data.total_expired,
          total_revoked: data.total_revoked
        });
      }
    } catch (error) {
      console.error('Failed to fetch licenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, [page, statusFilter, planFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchLicenses();
  };

  const handleCreateLicense = async () => {
    setIsCreating(true);
    setCreateError(null);
    
    try {
      const response = await fetch(`${API_URL}/licenses/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(createForm)
      });
      
      if (response.ok) {
        const newLicense = await response.json();
        setLicenses([newLicense, ...licenses]);
        setIsCreateModalOpen(false);
        setCreateForm({
          plan_type: 'professional',
          days_valid: 365,
          max_users: 5,
          customer_name: '',
          customer_contact: '',
          notes: ''
        });
        // Auto copy new key
        copyToClipboard(newLicense.license_key);
      } else {
        const error = await response.json();
        setCreateError(error.detail || 'Failed to create license');
      }
    } catch (error) {
      setCreateError('Network error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (licenseId: number) => {
    if (!confirm('Confirm revoking this License Key??')) return;
    
    try {
      const response = await fetch(`${API_URL}/licenses/${licenseId}/revoke`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        fetchLicenses();
      }
    } catch (error) {
      console.error('Failed to revoke license:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any; text: string }> = {
      unused: { color: 'bg-green-500/20 text-green-400', icon: CheckCircle, text: 'Available' },
      activated: { color: 'bg-blue-500/20 text-blue-400', icon: Key, text: 'Activated' },
      expired: { color: 'bg-yellow-500/20 text-yellow-400', icon: Clock, text: 'Expired' },
      revoked: { color: 'bg-red-500/20 text-red-400', icon: XCircle, text: 'Revoked' }
    };
    const badge = badges[status] || badges.unused;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
        <Icon size={12} />
        {badge.text}
      </span>
    );
  };

  const getPlanBadge = (plan: string) => {
    const plans: Record<string, { color: string; text: string }> = {
      basic: { color: 'bg-gray-500/20 text-gray-400', text: 'Basic' },
      professional: { color: 'bg-purple-500/20 text-purple-400', text: 'Professional' },
      enterprise: { color: 'bg-orange-500/20 text-orange-400', text: 'Enterprise' }
    };
    const p = plans[plan] || plans.basic;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${p.color}`}>
        {p.text}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">License Key Managements</h1>
          <p className="text-dark-400 mt-1">Create and manage licenses for customers</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={18} className="mr-2" />
          Generate License Key
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="text-green-400" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total_unused}</p>
                <p className="text-xs text-dark-400">Available</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Key className="text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total_activated}</p>
                <p className="text-xs text-dark-400">Activated</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="text-yellow-400" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total_expired}</p>
                <p className="text-xs text-dark-400">Expired</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <XCircle className="text-red-400" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total_revoked}</p>
                <p className="text-xs text-dark-400">Revoked</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <Input
                placeholder="Search Key, Customer Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white"
          >
            <option value="">StatusAll</option>
            <option value="unused">Available</option>
            <option value="activated">Activated</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
          </select>
          
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white"
          >
            <option value="">All Packages</option>
            <option value="basic">Basic</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
          
          <Button variant="secondary" onClick={handleSearch}>
            <Filter size={18} className="mr-2" />
            Filter
          </Button>
          
          <Button variant="ghost" onClick={fetchLicenses}>
            <RefreshCw size={18} />
          </Button>
        </div>
      </Card>

      {/* License Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">License Key</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Package</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Created Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Expired</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-dark-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-dark-400">
                    <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                    Loading...
                  </td>
                </tr>
              ) : licenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-dark-400">
                    Not found License Keys
                  </td>
                </tr>
              ) : (
                licenses.map((license) => (
                  <tr key={license.id} className="hover:bg-dark-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-primary-400">{license.license_key}</code>
                        <button
                          onClick={() => copyToClipboard(license.license_key)}
                          className="p-1 hover:bg-dark-700 rounded"
                          title="Copy"
                        >
                          {copiedKey === license.license_key ? (
                            <CheckCircle size={14} className="text-green-400" />
                          ) : (
                            <Copy size={14} className="text-dark-400" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getPlanBadge(license.plan_type)}
                      <span className="ml-2 text-xs text-dark-400">{license.days_valid} days</span>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(license.status)}</td>
                    <td className="px-4 py-3">
                      {license.customer_name ? (
                        <div>
                          <p className="text-sm text-white">{license.customer_name}</p>
                          {license.customer_contact && (
                            <p className="text-xs text-dark-400">{license.customer_contact}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-dark-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-300">
                      {formatDate(license.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {license.expires_at ? (
                        <div>
                          <p className="text-dark-300">{formatDate(license.expires_at)}</p>
                          {license.days_remaining !== undefined && license.days_remaining > 0 && (
                            <p className="text-xs text-green-400">remaining {license.days_remaining} days</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-dark-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedLicense(license);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-dark-700 rounded text-dark-400 hover:text-white"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {license.status === 'unused' && (
                          <button
                            onClick={() => handleRevoke(license.id)}
                            className="p-1.5 hover:bg-red-500/20 rounded text-dark-400 hover:text-red-400"
                            title="Revoked"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-700">
            <p className="text-sm text-dark-400">Page {page} from {totalPages}</p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md p-6 m-4">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Key size={20} />
              Generate License Key
            </h2>
            
            {createError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {createError}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-dark-400 mb-1">Package</label>
                <select
                  value={createForm.plan_type}
                  onChange={(e) => setCreateForm({ ...createForm, plan_type: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white"
                >
                  <option value="basic">Basic - ฿30,000/year</option>
                  <option value="professional">Professional - ฿60,000/year</option>
                  <option value="enterprise">Enterprise - ฿120,000/year</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-dark-400 mb-1">Number of days</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, days_valid: Math.max(1, createForm.days_valid - 30) })}
                    className="px-3 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
                  >
                    -30
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    value={createForm.days_valid}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      setCreateForm({ ...createForm, days_valid: Math.min(3650, Math.max(1, value)) });
                    }}
                    className="flex-1 px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white text-center"
                  />
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, days_valid: Math.min(3650, createForm.days_valid + 30) })}
                    className="px-3 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
                  >
                    +30
                  </button>
                </div>
                <div className="flex justify-center gap-2 mt-2">
                  {[30, 90, 180, 365, 730].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, days_valid: days })}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        createForm.days_valid === days
                          ? 'bg-primary-500 text-white'
                          : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                      }`}
                    >
                      {days === 30 ? '1month' : days === 90 ? '3month' : days === 180 ? '6month' : days === 365 ? '1year' : '2year'}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-dark-400 mb-1">Customer Name</label>
                <Input
                  value={createForm.customer_name}
                  onChange={(e) => setCreateForm({ ...createForm, customer_name: e.target.value })}
                  placeholder="Name-Surname or Organization"
                />
              </div>
              
              <div>
                <label className="block text-sm text-dark-400 mb-1">Contact Channel</label>
                <Input
                  value={createForm.customer_contact}
                  onChange={(e) => setCreateForm({ ...createForm, customer_contact: e.target.value })}
                  placeholder="LINE ID / Phone"
                />
              </div>
              
              <div>
                <label className="block text-sm text-dark-400 mb-1">Notes</label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                  className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white resize-none h-20"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
                Revoked
              </Button>
              <Button onClick={handleCreateLicense} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <RefreshCw className="animate-spin mr-2" size={16} />
                    LoadingCreate...
                  </>
                ) : (
                  <>
                    <Key size={16} className="mr-2" />
                    Create Key
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">License Details</h2>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 hover:bg-dark-700 rounded"
              >
                <XCircle size={20} className="text-dark-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 bg-dark-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <code className="text-lg font-mono text-primary-400">{selectedLicense.license_key}</code>
                  <button
                    onClick={() => copyToClipboard(selectedLicense.license_key)}
                    className="p-2 hover:bg-dark-700 rounded"
                  >
                    {copiedKey === selectedLicense.license_key ? (
                      <CheckCircle size={18} className="text-green-400" />
                    ) : (
                      <Copy size={18} className="text-dark-400" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-dark-400">Package</p>
                  <p className="text-white">{getPlanBadge(selectedLicense.plan_type)}</p>
                </div>
                <div>
                  <p className="text-xs text-dark-400">Status</p>
                  <p className="text-white">{getStatusBadge(selectedLicense.status)}</p>
                </div>
                <div>
                  <p className="text-xs text-dark-400">Duration</p>
                  <p className="text-white">{selectedLicense.days_valid} days</p>
                </div>
                <div>
                  <p className="text-xs text-dark-400">Max Users</p>
                  <p className="text-white">{selectedLicense.max_users}</p>
                </div>
              </div>
              
              {selectedLicense.customer_name && (
                <div>
                  <p className="text-xs text-dark-400">Customer</p>
                  <p className="text-white">{selectedLicense.customer_name}</p>
                  {selectedLicense.customer_contact && (
                    <p className="text-sm text-dark-400">{selectedLicense.customer_contact}</p>
                  )}
                </div>
              )}
              
              {selectedLicense.activated_by_email && (
                <div>
                  <p className="text-xs text-dark-400">Activated by</p>
                  <p className="text-white">{selectedLicense.activated_by_email}</p>
                  {selectedLicense.activated_at && (
                    <p className="text-sm text-dark-400">at {formatDate(selectedLicense.activated_at)}</p>
                  )}
                </div>
              )}
              
              {selectedLicense.expires_at && (
                <div>
                  <p className="text-xs text-dark-400">Expired</p>
                  <p className="text-white">{formatDate(selectedLicense.expires_at)}</p>
                  {selectedLicense.days_remaining !== undefined && selectedLicense.days_remaining > 0 && (
                    <p className="text-sm text-green-400">remaining {selectedLicense.days_remaining} days</p>
                  )}
                </div>
              )}
              
              {selectedLicense.notes && (
                <div>
                  <p className="text-xs text-dark-400">Notes</p>
                  <p className="text-white">{selectedLicense.notes}</p>
                </div>
              )}
              
              <div className="pt-4 border-t border-dark-700">
                <p className="text-xs text-dark-400">Created by: {selectedLicense.created_by_email}</p>
                <p className="text-xs text-dark-400">at: {formatDate(selectedLicense.created_at)}</p>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
