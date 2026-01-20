/**
 * MyTickets Page
 * User's support tickets list with status tracking
 */
import { useState, useEffect } from 'react';
import { 
  Plus, 
  Bug, 
  Lightbulb, 
  HelpCircle, 
  FileText, 
  Image as ImageIcon,
  MessageSquare,
  Clock,
  CheckCircle,
  Circle,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  X
} from 'lucide-react';
import { supportAPI, type TicketListItem, type SupportTicket, type TicketStatus, type TicketCategory } from '../../services/api';
import { CreateTicketModal } from './CreateTicketModal';

// Status config
const statusConfig: Record<TicketStatus, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: 'รอดำเนินการ', color: 'text-blue-400 bg-blue-500/20', icon: <Circle size={14} /> },
  in_progress: { label: 'กำลังดำเนินการ', color: 'text-yellow-400 bg-yellow-500/20', icon: <Clock size={14} /> },
  resolved: { label: 'แก้ไขแล้ว', color: 'text-green-400 bg-green-500/20', icon: <CheckCircle size={14} /> },
  closed: { label: 'ปิดแล้ว', color: 'text-gray-400 bg-gray-500/20', icon: <CheckCircle size={14} /> },
};

// Category config
const categoryConfig: Record<TicketCategory, { label: string; icon: React.ReactNode; color: string }> = {
  bug: { label: 'Bug', icon: <Bug size={14} />, color: 'text-red-400' },
  feature: { label: 'Feature', icon: <Lightbulb size={14} />, color: 'text-yellow-400' },
  question: { label: 'Question', icon: <HelpCircle size={14} />, color: 'text-blue-400' },
  other: { label: 'Other', icon: <FileText size={14} />, color: 'text-gray-400' },
};

// Format relative time
const formatRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'เมื่อสักครู่';
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  if (diffHours < 24) return `${diffHours} ชม. ที่แล้ว`;
  if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
};

export const MyTickets = () => {
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Fetch tickets
  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, page_size: 10 };
      if (statusFilter) params.status = statusFilter;
      
      const response = await supportAPI.list(params);
      setTickets(response.items);
      setTotalPages(response.pages);
      setUnreadCount(response.unread_count);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [page, statusFilter]);

  // View ticket detail
  const viewTicket = async (ticket: TicketListItem) => {
    setIsLoadingDetail(true);
    setIsViewModalOpen(true);
    
    try {
      const detail = await supportAPI.get(ticket.id);
      setSelectedTicket(detail);
      
      // Mark as read if unread
      if (ticket.is_unread) {
        await supportAPI.markAsRead(ticket.id);
        fetchTickets(); // Refresh list
      }
    } catch (error) {
      console.error('Error fetching ticket detail:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Close view modal
  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedTicket(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🎫 Tickets ของฉัน
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                {unreadCount} ใหม่
              </span>
            )}
          </h1>
          <p className="text-dark-400 text-sm mt-1">ติดตามสถานะการแจ้งปัญหาของคุณ</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          <span>แจ้งปัญหาใหม่</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as TicketStatus | '');
            setPage(1);
          }}
          className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:border-primary-500 outline-none"
        >
          <option value="">ทุกสถานะ</option>
          <option value="open">รอดำเนินการ</option>
          <option value="in_progress">กำลังดำเนินการ</option>
          <option value="resolved">แก้ไขแล้ว</option>
          <option value="closed">ปิดแล้ว</option>
        </select>

        <button
          onClick={fetchTickets}
          disabled={isLoading}
          className="p-2 text-dark-400 hover:text-white transition-colors"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tickets List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-primary-500" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 bg-dark-800 rounded-xl border border-dark-700">
          <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bug className="text-dark-500" size={32} />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">ยังไม่มี Ticket</h3>
          <p className="text-dark-400 text-sm mb-4">พบปัญหา? แจ้งเราได้เลย!</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            <Plus size={18} />
            <span>แจ้งปัญหาใหม่</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const status = statusConfig[ticket.status];
            const category = categoryConfig[ticket.category];
            
            return (
              <div
                key={ticket.id}
                onClick={() => viewTicket(ticket)}
                className={`p-4 bg-dark-800 rounded-xl border transition-all cursor-pointer hover:border-primary-500/50 ${
                  ticket.is_unread ? 'border-primary-500/50 bg-primary-500/5' : 'border-dark-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Ticket Number & Status */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </span>
                      <span className="text-xs text-dark-500">{ticket.ticket_number}</span>
                      {ticket.is_unread && (
                        <span className="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded">NEW</span>
                      )}
                    </div>

                    {/* Subject */}
                    <h3 className="font-medium text-white truncate">{ticket.subject}</h3>

                    {/* Meta info */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-dark-400">
                      <span className={`flex items-center gap-1 ${category.color}`}>
                        {category.icon}
                        {category.label}
                      </span>
                      {ticket.has_screenshot && (
                        <span className="flex items-center gap-1">
                          <ImageIcon size={12} />
                          มีภาพ
                        </span>
                      )}
                      {ticket.has_admin_response && (
                        <span className="flex items-center gap-1 text-green-400">
                          <MessageSquare size={12} />
                          มีคำตอบ
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatRelativeTime(ticket.created_at)}
                      </span>
                    </div>
                  </div>

                  <button className="p-2 text-dark-400 hover:text-white transition-colors">
                    <Eye size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 text-dark-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm text-dark-400">
            หน้า {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 text-dark-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Create Modal */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchTickets}
      />

      {/* View Ticket Modal */}
      {isViewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeViewModal} />
          <div className="relative w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto bg-dark-800 rounded-xl shadow-2xl border border-dark-700">
            {isLoadingDetail ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-primary-500" />
              </div>
            ) : selectedTicket && (
              <>
                {/* Header */}
                <div className="sticky top-0 flex items-center justify-between p-4 border-b border-dark-700 bg-dark-800">
                  <div>
                    <span className="text-xs text-dark-500">{selectedTicket.ticket_number}</span>
                    <h2 className="text-lg font-semibold text-white">{selectedTicket.subject}</h2>
                  </div>
                  <button onClick={closeViewModal} className="p-1 text-dark-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4">
                  {/* Status & Category */}
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${statusConfig[selectedTicket.status].color}`}>
                      {statusConfig[selectedTicket.status].icon}
                      {statusConfig[selectedTicket.status].label}
                    </span>
                    <span className={`flex items-center gap-1 text-sm ${categoryConfig[selectedTicket.category].color}`}>
                      {categoryConfig[selectedTicket.category].icon}
                      {categoryConfig[selectedTicket.category].label}
                    </span>
                    <span className="text-xs text-dark-500">
                      {new Date(selectedTicket.created_at).toLocaleString('th-TH')}
                    </span>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-medium text-dark-300 mb-2">รายละเอียด</h4>
                    <div className="p-3 bg-dark-700 rounded-lg text-white whitespace-pre-wrap">
                      {selectedTicket.description}
                    </div>
                  </div>

                  {/* Screenshot */}
                  {selectedTicket.screenshot_data && (
                    <div>
                      <h4 className="text-sm font-medium text-dark-300 mb-2">Screenshot</h4>
                      <img
                        src={selectedTicket.screenshot_data}
                        alt="Screenshot"
                        className="max-w-full rounded-lg border border-dark-600"
                      />
                    </div>
                  )}

                  {/* Admin Response */}
                  {selectedTicket.admin_response && (
                    <div className="border-t border-dark-700 pt-4">
                      <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                        <MessageSquare size={16} />
                        คำตอบจาก Admin
                      </h4>
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-white whitespace-pre-wrap">
                        {selectedTicket.admin_response}
                      </div>
                      {selectedTicket.resolved_at && (
                        <p className="text-xs text-dark-500 mt-2">
                          ตอบเมื่อ {new Date(selectedTicket.resolved_at).toLocaleString('th-TH')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTickets;
