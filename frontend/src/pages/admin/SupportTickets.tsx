/**
 * Admin Support Tickets Page
 * Admin panel for managing support tickets
 */
import { useState, useEffect } from 'react';
import {
  Bug,
  Lightbulb,
  HelpCircle,
  FileText,
  Clock,
  CheckCircle,
  Circle,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Search,
  Send,
  AlertCircle,
  User
} from 'lucide-react';
import {
  supportAPI,
  type SupportTicket,
  type TicketStats,
  type TicketStatus,
  type TicketPriority,
  type TicketCategory
} from '../../services/api';

// Status config
const statusConfig: Record<TicketStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  open: { label: 'Open', color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: <Circle size={14} /> },
  in_progress: { label: 'In Progress', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', icon: <Clock size={14} /> },
  resolved: { label: 'Resolved', color: 'text-green-400', bgColor: 'bg-green-500/20', icon: <CheckCircle size={14} /> },
  closed: { label: 'Closed', color: 'text-gray-400', bgColor: 'bg-gray-500/20', icon: <CheckCircle size={14} /> },
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

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

export const SupportTickets = () => {
  // State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Detail modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  
  // Edit state
  const [editStatus, setEditStatus] = useState<TicketStatus>('open');
  const [editPriority, setEditPriority] = useState<TicketPriority>('medium');
  const [editResponse, setEditResponse] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const data = await supportAPI.adminGetStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch tickets
  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, page_size: 15 };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (searchQuery) params.search = searchQuery;

      const response = await supportAPI.adminList(params);
      setTickets(response.items);
      setTotalPages(response.pages);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [page, statusFilter, categoryFilter]);

  // Handle search
  const handleSearch = () => {
    setPage(1);
    fetchTickets();
  };

  // Open detail modal
  const openDetail = async (ticket: SupportTicket) => {
    setIsDetailModalOpen(true);
    setIsLoadingDetail(true);

    try {
      const detail = await supportAPI.adminGet(ticket.id);
      setSelectedTicket(detail);
      setEditStatus(detail.status);
      setEditPriority(detail.priority);
      setEditResponse(detail.admin_response || '');
    } catch (error) {
      console.error('Error fetching ticket detail:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Close detail modal
  const closeDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedTicket(null);
    setEditResponse('');
  };

  // Save changes
  const saveChanges = async () => {
    if (!selectedTicket) return;

    setIsSaving(true);
    try {
      await supportAPI.adminUpdate(selectedTicket.id, {
        status: editStatus,
        priority: editPriority,
        admin_response: editResponse || undefined,
      });

      // Refresh data
      fetchTickets();
      fetchStats();
      closeDetail();
    } catch (error) {
      console.error('Error updating ticket:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          🎫 Support Tickets
        </h1>
        <p className="text-dark-400 text-sm mt-1">Manage tickets from users</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-dark-800 rounded-xl border border-dark-700">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-dark-400">Total</div>
          </div>
          <div className="p-4 bg-dark-800 rounded-xl border border-blue-500/30">
            <div className="text-2xl font-bold text-blue-400">{stats.open}</div>
            <div className="text-sm text-dark-400">Open</div>
          </div>
          <div className="p-4 bg-dark-800 rounded-xl border border-yellow-500/30">
            <div className="text-2xl font-bold text-yellow-400">{stats.in_progress}</div>
            <div className="text-sm text-dark-400">In Progress</div>
          </div>
          <div className="p-4 bg-dark-800 rounded-xl border border-green-500/30">
            <div className="text-2xl font-bold text-green-400">{stats.resolved}</div>
            <div className="text-sm text-dark-400">Resolved</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as TicketStatus | '');
            setPage(1);
          }}
          className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:border-primary-500 outline-none"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value as TicketCategory | '');
            setPage(1);
          }}
          className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:border-primary-500 outline-none"
        >
          <option value="">All Types</option>
          <option value="bug">Bug</option>
          <option value="feature">Feature</option>
          <option value="question">Question</option>
          <option value="other">Other</option>
        </select>

        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search Ticket..."
            className="flex-1 max-w-xs px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm placeholder-dark-500 focus:border-primary-500 outline-none"
          />
          <button
            onClick={handleSearch}
            className="p-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
          >
            <Search size={18} />
          </button>
        </div>

        <button
          onClick={() => {
            fetchTickets();
            fetchStats();
          }}
          disabled={isLoading}
          className="p-2 text-dark-400 hover:text-white transition-colors"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tickets Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-primary-500" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 bg-dark-800 rounded-xl border border-dark-700">
          <AlertCircle className="mx-auto text-dark-500 mb-3" size={48} />
          <h3 className="text-lg font-medium text-white">No tickets found</h3>
          <p className="text-dark-400 text-sm">Try changing filter or keyword</p>
        </div>
      ) : (
        <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Ticket</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Created</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-dark-400 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b border-dark-700 hover:bg-dark-700/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-xs text-dark-500 font-mono">{ticket.ticket_number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white text-sm truncate max-w-[200px]">{ticket.subject}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-dark-600 rounded-full flex items-center justify-center">
                        <User size={12} className="text-dark-400" />
                      </div>
                      <span className="text-sm text-dark-300 truncate max-w-[120px]">
                        {ticket.user?.email || `User ${ticket.user_id}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-sm ${categoryConfig[ticket.category].color}`}>
                      {categoryConfig[ticket.category].icon}
                      {categoryConfig[ticket.category].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${statusConfig[ticket.status].color} ${statusConfig[ticket.status].bgColor}`}>
                      {statusConfig[ticket.status].icon}
                      {statusConfig[ticket.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-dark-400">{formatRelativeTime(ticket.created_at)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => openDetail(ticket)}
                      className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-600 rounded transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 text-dark-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm text-dark-400">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 text-dark-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeDetail} />
          <div className="relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto bg-dark-800 rounded-xl shadow-2xl border border-dark-700">
            {isLoadingDetail ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-primary-500" />
              </div>
            ) : selectedTicket && (
              <>
                {/* Header */}
                <div className="sticky top-0 flex items-center justify-between p-4 border-b border-dark-700 bg-dark-800 z-10">
                  <div>
                    <span className="text-xs text-dark-500">{selectedTicket.ticket_number}</span>
                    <h2 className="text-lg font-semibold text-white">{selectedTicket.subject}</h2>
                  </div>
                  <button onClick={closeDetail} className="p-1 text-dark-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3 p-3 bg-dark-700 rounded-lg">
                    <div className="w-10 h-10 bg-dark-600 rounded-full flex items-center justify-center">
                      <User size={20} className="text-dark-400" />
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">{selectedTicket.user?.email}</div>
                      <div className="text-xs text-dark-400">
                        {selectedTicket.user?.first_name} {selectedTicket.user?.last_name}
                      </div>
                    </div>
                    <div className="ml-auto text-xs text-dark-500">
                      {new Date(selectedTicket.created_at).toLocaleString('en-US')}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-medium text-dark-300 mb-2">Details</h4>
                    <div className="p-3 bg-dark-700 rounded-lg text-white whitespace-pre-wrap text-sm">
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

                  {/* Edit Section */}
                  <div className="border-t border-dark-700 pt-4 space-y-4">
                    <h4 className="text-sm font-medium text-primary-400">Manage Ticket</h4>

                    {/* Status & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-dark-400 mb-1">Status</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as TicketStatus)}
                          className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:border-primary-500 outline-none"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-dark-400 mb-1">Priority</label>
                        <select
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value as TicketPriority)}
                          className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:border-primary-500 outline-none"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>

                    {/* Response */}
                    <div>
                      <label className="block text-xs text-dark-400 mb-1">Reply</label>
                      <textarea
                        value={editResponse}
                        onChange={(e) => setEditResponse(e.target.value)}
                        placeholder="Type reply to user..."
                        rows={4}
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm placeholder-dark-500 focus:border-primary-500 outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 flex items-center justify-end gap-3 p-4 border-t border-dark-700 bg-dark-800">
                  <button
                    onClick={closeDetail}
                    className="px-4 py-2 text-dark-300 hover:text-white transition-colors"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveChanges}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-700 disabled:text-dark-500 text-white rounded-lg transition-colors"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    <span>Save</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTickets;
