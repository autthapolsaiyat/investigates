/**
 * Pending Registrations Page (Admin)
 * List and approve/reject registration requests
 */
import { useState, useEffect } from 'react';
import { 
  UserPlus, Check, X, Clock, Search, RefreshCw, 
  ChevronLeft, ChevronRight, Filter, Calendar,
  Building2, Phone, Mail, Briefcase, AlertCircle
} from 'lucide-react';
import { Button, Input, Card, Badge } from '../../components/ui';
import { registrationAPI } from '../../services/api';
import type { 
  RegistrationRequest, 
  RegistrationStatus, 
  RegistrationStats 
} from '../../services/api';

interface ApproveModalProps {
  registration: RegistrationRequest;
  onClose: () => void;
  onApprove: (id: number, days: number, role: string) => void;
  isLoading: boolean;
}

function ApproveModal({ registration, onClose, onApprove, isLoading }: ApproveModalProps) {
  const [days, setDays] = useState(30);
  const [role, setRole] = useState('viewer');
  const [customDays, setCustomDays] = useState('');

  const presetDays = [
    { label: '30 วัน (ทดลองใช้)', value: 30 },
    { label: '90 วัน (3 เดือน)', value: 90 },
    { label: '365 วัน (1 ปี)', value: 365 },
    { label: 'กำหนดเอง', value: -1 },
  ];

  const roles = [
    { label: 'Viewer (ดูอย่างเดียว)', value: 'viewer' },
    { label: 'Analyst (วิเคราะห์)', value: 'analyst' },
    { label: 'Investigator (สืบสวน)', value: 'investigator' },
  ];

  const handleApprove = () => {
    const finalDays = days === -1 ? parseInt(customDays) || 30 : days;
    onApprove(registration.id, finalDays, role);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Check className="w-5 h-5 text-green-400" />
          อนุมัติการลงทะเบียน
        </h3>

        {/* User Info */}
        <div className="p-3 bg-dark-800 rounded-lg mb-4">
          <p className="text-white font-medium">{registration.first_name} {registration.last_name}</p>
          <p className="text-gray-400 text-sm">{registration.email}</p>
          {registration.organization_name && (
            <p className="text-gray-500 text-sm">{registration.organization_name}</p>
          )}
        </div>

        {/* Subscription Duration */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            ระยะเวลาใช้งาน
          </label>
          <div className="grid grid-cols-2 gap-2">
            {presetDays.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setDays(preset.value)}
                className={`p-2 rounded-lg text-sm transition-colors ${
                  days === preset.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {days === -1 && (
            <Input
              type="number"
              placeholder="จำนวนวัน"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              className="mt-2"
              min={1}
              max={3650}
            />
          )}
        </div>

        {/* Role Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            สิทธิ์การใช้งาน
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {roles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={isLoading}>
            ยกเลิก
          </Button>
          <Button className="flex-1" onClick={handleApprove} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                กำลังอนุมัติ...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                อนุมัติ
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}

interface RejectModalProps {
  registration: RegistrationRequest;
  onClose: () => void;
  onReject: (id: number, reason: string) => void;
  isLoading: boolean;
}

function RejectModal({ registration, onClose, onReject, isLoading }: RejectModalProps) {
  const [reason, setReason] = useState('');

  const quickReasons = [
    'ข้อมูลไม่ครบถ้วน',
    'ไม่สามารถยืนยันตัวตนได้',
    'ไม่ได้รับอนุญาตจากหน่วยงาน',
    'หน่วยงานไม่อยู่ในเงื่อนไข',
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <X className="w-5 h-5 text-red-400" />
          ปฏิเสธการลงทะเบียน
        </h3>

        {/* User Info */}
        <div className="p-3 bg-dark-800 rounded-lg mb-4">
          <p className="text-white font-medium">{registration.first_name} {registration.last_name}</p>
          <p className="text-gray-400 text-sm">{registration.email}</p>
        </div>

        {/* Quick Reasons */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            เลือกเหตุผล
          </label>
          <div className="flex flex-wrap gap-2">
            {quickReasons.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  reason === r
                    ? 'bg-red-600 text-white'
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Reason */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            หรือระบุเหตุผล
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="ระบุเหตุผลในการปฏิเสธ..."
            className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 h-24 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={isLoading}>
            ยกเลิก
          </Button>
          <Button 
            variant="danger" 
            className="flex-1" 
            onClick={() => onReject(registration.id, reason)}
            disabled={isLoading || !reason.trim()}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                กำลังปฏิเสธ...
              </>
            ) : (
              <>
                <X className="w-4 h-4 mr-2" />
                ปฏิเสธ
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function PendingRegistrations() {
  const [registrations, setRegistrations] = useState<RegistrationRequest[]>([]);
  const [stats, setStats] = useState<RegistrationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | ''>('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modals
  const [approveModal, setApproveModal] = useState<RegistrationRequest | null>(null);
  const [rejectModal, setRejectModal] = useState<RegistrationRequest | null>(null);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, page_size: 20 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      
      const response = await registrationAPI.list(params);
      setRegistrations(response.items);
      setTotalPages(response.pages);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await registrationAPI.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchRegistrations();
    fetchStats();
  }, [statusFilter, search, page]);

  const handleApprove = async (id: number, days: number, role: string) => {
    setIsActionLoading(true);
    try {
      await registrationAPI.approve(id, { subscription_days: days, role });
      setApproveModal(null);
      fetchRegistrations();
      fetchStats();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'เกิดข้อผิดพลาด');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async (id: number, reason: string) => {
    setIsActionLoading(true);
    try {
      await registrationAPI.reject(id, { reason });
      setRejectModal(null);
      fetchRegistrations();
      fetchStats();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'เกิดข้อผิดพลาด');
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusBadge = (status: RegistrationStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">รอการอนุมัติ</Badge>;
      case 'approved':
        return <Badge variant="success">อนุมัติแล้ว</Badge>;
      case 'rejected':
        return <Badge variant="danger">ปฏิเสธ</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <UserPlus className="w-7 h-7 text-primary-400" />
            คำขอลงทะเบียน
          </h1>
          <p className="text-gray-400 mt-1">จัดการคำขอลงทะเบียนจากผู้ใช้ใหม่</p>
        </div>
        <Button onClick={() => { fetchRegistrations(); fetchStats(); }}>
          <RefreshCw className="w-4 h-4 mr-2" />
          รีเฟรช
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
                <p className="text-sm text-gray-400">รอการอนุมัติ</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.approved}</p>
                <p className="text-sm text-gray-400">อนุมัติแล้ว</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <X className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.rejected}</p>
                <p className="text-sm text-gray-400">ปฏิเสธ</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.today}</p>
                <p className="text-sm text-gray-400">วันนี้</p>
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="ค้นหาชื่อ, อีเมล, หน่วยงาน..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
              className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">ทั้งหมด</option>
              <option value="pending">รอการอนุมัติ</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="rejected">ปฏิเสธ</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Registration List */}
      <Card>
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-400">กำลังโหลด...</p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="p-8 text-center">
            <UserPlus className="w-12 h-12 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">ไม่พบคำขอลงทะเบียน</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-700">
            {registrations.map((reg) => (
              <div key={reg.id} className="p-4 hover:bg-dark-800/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-medium">
                        {reg.first_name} {reg.last_name}
                      </h3>
                      {getStatusBadge(reg.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{reg.email}</span>
                      </div>
                      {reg.phone && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Phone className="w-4 h-4" />
                          <span>{reg.phone}</span>
                        </div>
                      )}
                      {reg.organization_name && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Building2 className="w-4 h-4" />
                          <span className="truncate">{reg.organization_name}</span>
                        </div>
                      )}
                      {reg.position && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Briefcase className="w-4 h-4" />
                          <span className="truncate">{reg.position}</span>
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <p className="text-xs text-gray-500 mt-2">
                      ส่งคำขอเมื่อ {new Date(reg.created_at).toLocaleString('th-TH')}
                    </p>

                    {/* Rejection reason */}
                    {reg.status === 'rejected' && reg.rejection_reason && (
                      <p className="text-sm text-red-400 mt-2">
                        เหตุผล: {reg.rejection_reason}
                      </p>
                    )}

                    {/* Approval info */}
                    {reg.status === 'approved' && reg.subscription_days && (
                      <p className="text-sm text-green-400 mt-2">
                        อนุมัติ {reg.subscription_days} วัน
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {reg.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setApproveModal(reg)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setRejectModal(reg)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-dark-700 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              หน้า {page} จาก {totalPages}
            </p>
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

      {/* Modals */}
      {approveModal && (
        <ApproveModal
          registration={approveModal}
          onClose={() => setApproveModal(null)}
          onApprove={handleApprove}
          isLoading={isActionLoading}
        />
      )}

      {rejectModal && (
        <RejectModal
          registration={rejectModal}
          onClose={() => setRejectModal(null)}
          onReject={handleReject}
          isLoading={isActionLoading}
        />
      )}
    </div>
  );
}

export { PendingRegistrations as PendingRegistrationsPage };
