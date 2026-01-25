/**
 * Cases - Case Management with Table View & Soft Delete
 * Features:
 * 1. Table & Grid view toggle
 * 2. Case List with filters
 * 3. Case Detail Modal
 * 4. Create/Edit case
 * 5. Soft Delete with confirmation
 */
import { useState, useEffect } from 'react';
import {
  Plus,
  Minus,
  Search,
  Briefcase,
  Calendar,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  X,
  MoreVertical,
  Grid3X3,
  List,
  AlertTriangle,
  CheckCircle,
  FileText,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Button, Input } from '../../components/ui';
import { casesAPI, type Case } from '../../services/api';

// ============================================
// CONSTANTS
// ============================================

const CASE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'online_gambling', label: 'Online Gambling' },
  { value: 'money_laundering', label: 'Money Laundering' },
  { value: 'fraud', label: 'Fraud' },
  { value: 'call_center_scam', label: 'Call Center Scam' },
  { value: 'romance_scam', label: 'Romance Scam' },
  { value: 'investment_scam', label: 'Investment Scam' },
  { value: 'other', label: 'Other' }
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' }
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priority' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    draft: 'bg-gray-500/20 text-gray-400',
    open: 'bg-blue-500/20 text-blue-400',
    in_progress: 'bg-yellow-500/20 text-yellow-400',
    pending_review: 'bg-orange-500/20 text-orange-400',
    closed: 'bg-green-500/20 text-green-400',
    archived: 'bg-purple-500/20 text-purple-400'
  };
  const labels: Record<string, string> = {
    draft: 'Draft',
    open: 'Open',
    in_progress: 'In Progress',
    pending_review: 'Pending Review',
    closed: 'Closed',
    archived: 'Archived'
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${styles[status] || styles.draft}`}>
      {labels[status] || status}
    </span>
  );
};

const getPriorityBadge = (priority: string) => {
  const styles: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400',
    high: 'bg-orange-500/20 text-orange-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-gray-500/20 text-gray-400'
  };
  const labels: Record<string, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low'
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${styles[priority] || styles.medium}`}>
      {labels[priority] || priority}
    </span>
  );
};

const getCaseTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    online_gambling: 'Online Gambling',
    money_laundering: 'Money Laundering',
    fraud: 'Fraud',
    call_center_scam: 'Call Center Scam',
    romance_scam: 'Romance Scam',
    investment_scam: 'Investment Scam',
    other: 'Other'
  };
  return labels[type] || type;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0
  }).format(amount);
};

// ============================================
// DELETE CONFIRMATION MODAL
// ============================================

interface DeleteModalProps {
  case_: Case;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

const DeleteConfirmModal = ({ case_, isOpen, onClose, onConfirm, isDeleting }: DeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-dark-800 rounded-xl shadow-2xl w-full max-w-md border border-dark-600">
        {/* Header */}
        <div className="p-6 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/20 rounded-full">
              <AlertTriangle className="text-red-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Confirm Delete Case</h2>
              <p className="text-sm text-dark-400">Are you sure you want to delete this case?</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-dark-700 rounded-lg p-4 mb-4">
            <p className="text-sm text-primary-400 font-mono">{case_.case_number}</p>
            <p className="text-white font-medium mt-1">{case_.title}</p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex gap-3">
              <CheckCircle className="text-blue-400 flex-shrink-0" size={20} />
              <div className="text-sm text-blue-300">
                <p className="font-medium">Data will be hidden from the system</p>
                <p className="text-blue-400 mt-1">but can be recovered by Admin</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-dark-700 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            className="flex-1 bg-red-600 hover:bg-red-700"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={18} className="mr-2" />
                Delete Case
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CASE DETAIL MODAL
// ============================================

interface DetailModalProps {
  case_: Case;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const CaseDetailModal = ({ case_, onClose, onEdit, onDelete }: DetailModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-dark-800 rounded-xl shadow-2xl w-full max-w-2xl border border-dark-600 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-dark-700 flex items-start justify-between">
          <div>
            <p className="text-sm text-primary-400 font-mono">{case_.case_number}</p>
            <h2 className="text-xl font-semibold text-white mt-1">{case_.title}</h2>
            <div className="flex gap-2 mt-2">
              {getStatusBadge(case_.status)}
              {getPriorityBadge(case_.priority)}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dark-700 rounded-lg">
            <X size={20} className="text-dark-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Description */}
          {case_.description && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-dark-400 mb-2">Description</h3>
              <p className="text-white">{case_.description}</p>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-dark-700 rounded-lg p-4">
              <p className="text-dark-400 text-sm">Case Type</p>
              <p className="text-white font-medium mt-1">{getCaseTypeLabel(case_.case_type)}</p>
            </div>
            <div className="bg-dark-700 rounded-lg p-4">
              <p className="text-dark-400 text-sm">Damage Amount</p>
              <p className="text-white font-medium mt-1">{formatCurrency(case_.total_amount)}</p>
            </div>
            <div className="bg-dark-700 rounded-lg p-4">
              <p className="text-dark-400 text-sm">Victims</p>
              <p className="text-white font-medium mt-1">{case_.victims_count} people</p>
            </div>
            <div className="bg-dark-700 rounded-lg p-4">
              <p className="text-dark-400 text-sm">Suspects</p>
              <p className="text-white font-medium mt-1">{case_.suspects_count} people</p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-dark-400 text-sm">Created Date</p>
              <p className="text-white mt-1">{formatDate(case_.created_at)}</p>
            </div>
            <div>
              <p className="text-dark-400 text-sm">Last Updated</p>
              <p className="text-white mt-1">{formatDate(case_.updated_at)}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-dark-700 flex gap-3">
          <Button variant="ghost" onClick={onDelete} className="text-red-400 hover:bg-red-500/10">
            <Trash2 size={18} className="mr-2" />
            Delete
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" onClick={onClose}>
            Closed
          </Button>
          <Button variant="primary" onClick={onEdit}>
            <Edit size={18} className="mr-2" />
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CREATE/EDIT MODAL
// ============================================

interface CreateModalProps {
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  editingCase?: Case | null;
}

// Quick amount presets (in THB)
const AMOUNT_PRESETS = [
  { value: 10000, label: '10K' },
  { value: 100000, label: '100K' },
  { value: 500000, label: '500K' },
  { value: 1000000, label: '1M' },
  { value: 10000000, label: '10M' },
  { value: 20000000, label: '20M' },
];

const CreateCaseModal = ({ onClose, onSave, editingCase }: CreateModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: editingCase?.title || '',
    description: editingCase?.description || '',
    case_type: editingCase?.case_type || 'fraud',
    priority: editingCase?.priority || 'medium',
    total_amount: editingCase?.total_amount || 0,
    victims_count: editingCase?.victims_count || 0,
    suspects_count: editingCase?.suspects_count || 0
  });

  const formatNumber = (num: number) => num.toLocaleString('en-US');
  
  const addAmount = (add: number) => {
    setFormData(prev => ({ ...prev, total_amount: Math.max(0, prev.total_amount + add) }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert('Please enter case title');
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        ...formData,
        total_amount: formData.total_amount || 0,
        victims_count: formData.victims_count || 0,
        suspects_count: formData.suspects_count || 0
      });
      onClose();
    } catch (error) {
      console.error('Error saving case:', error);
      alert('An error occurred. Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  // Counter component
  const Counter = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div>
      <label className="text-sm text-dark-400 mb-1 block">{label}</label>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => onChange(Math.max(0, value - 10))}
          className="px-2 py-2 bg-dark-700 hover:bg-dark-600 rounded-l-lg text-dark-300 hover:text-white text-xs">-10</button>
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))}
          className="px-2 py-2 bg-dark-700 hover:bg-dark-600 text-dark-300 hover:text-white">
          <Minus size={12} />
        </button>
        <input type="number" value={value} onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-14 bg-dark-900 border-y border-dark-700 px-2 py-2 text-white text-center text-sm" />
        <button type="button" onClick={() => onChange(value + 1)}
          className="px-2 py-2 bg-dark-700 hover:bg-dark-600 text-dark-300 hover:text-white">
          <Plus size={12} />
        </button>
        <button type="button" onClick={() => onChange(value + 10)}
          className="px-2 py-2 bg-dark-700 hover:bg-dark-600 rounded-r-lg text-dark-300 hover:text-white text-xs">+10</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-dark-800 rounded-xl shadow-2xl w-full max-w-lg border border-dark-600 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-dark-700 flex items-center justify-between sticky top-0 bg-dark-800 z-10">
          <h2 className="text-xl font-semibold text-white">
            {editingCase ? 'Edit Case' : 'Create New Case'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-dark-700 rounded-lg">
            <X size={20} className="text-dark-400" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm text-dark-400 mb-1 block">Case Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Crypto Money Laundering Case"
            />
          </div>

          <div>
            <label className="text-sm text-dark-400 mb-1 block">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Case description..."
              rows={2}
              className="w-full bg-dark-900 border border-dark-700 rounded-lg p-3 text-white resize-none focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-dark-400 mb-1 block">Case Type</label>
              <select
                value={formData.case_type}
                onChange={(e) => setFormData({ ...formData, case_type: e.target.value })}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary-500"
              >
                {CASE_TYPES.filter(t => t.value).map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-dark-400 mb-1 block">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary-500"
              >
                {PRIORITY_OPTIONS.filter(p => p.value).map(priority => (
                  <option key={priority.value} value={priority.value}>{priority.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount Section with Quick Buttons */}
          <div className="bg-dark-700/50 rounded-lg p-4 space-y-3">
            <label className="text-sm text-dark-400 flex items-center gap-1">
              <DollarSign size={14} />
              Amount (THB)
            </label>
            
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary-400">฿</span>
              <input
                type="number"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                className="flex-1 bg-dark-600 border border-dark-500 rounded-lg px-3 py-2 text-white text-xl font-bold focus:border-primary-500 focus:outline-none"
              />
            </div>

            {formData.total_amount > 0 && (
              <div className="text-sm text-primary-400 text-right font-medium">
                ฿{formatNumber(formData.total_amount)}
              </div>
            )}

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-2">
              {AMOUNT_PRESETS.map(preset => (
                <button key={preset.value} type="button"
                  onClick={() => setFormData(prev => ({ ...prev, total_amount: preset.value }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    formData.total_amount === preset.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-600 text-dark-300 hover:bg-dark-500 hover:text-white'
                  }`}>
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Increment Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-dark-600">
              <span className="text-xs text-dark-500">Adjust:</span>
              <button type="button" onClick={() => addAmount(-100000)}
                className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs">-100K</button>
              <button type="button" onClick={() => addAmount(-10000)}
                className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs">-10K</button>
              <button type="button" onClick={() => addAmount(10000)}
                className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-xs">+10K</button>
              <button type="button" onClick={() => addAmount(100000)}
                className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-xs">+100K</button>
              <button type="button" onClick={() => addAmount(1000000)}
                className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-xs">+1M</button>
            </div>
          </div>

          {/* Victims & Suspects Counters */}
          <div className="grid grid-cols-2 gap-4">
            <Counter label="Victims" value={formData.victims_count}
              onChange={(v) => setFormData(prev => ({ ...prev, victims_count: v }))} />
            <Counter label="Suspects" value={formData.suspects_count}
              onChange={(v) => setFormData(prev => ({ ...prev, suspects_count: v }))} />
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-dark-700 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus size={18} className="mr-2" />
                {editingCase ? 'Save' : 'Create Case'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CASE CARD (Grid View)
// ============================================

interface CaseCardProps {
  case_: Case;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const CaseCard = ({ case_, onView, onEdit, onDelete }: CaseCardProps) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-5 hover:border-dark-600 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-primary-400 font-mono">{case_.case_number}</p>
          <h3 className="text-white font-medium mt-1 line-clamp-2">{case_.title}</h3>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 hover:bg-dark-700 rounded-lg"
          >
            <MoreVertical size={18} className="text-dark-400" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 bg-dark-700 border border-dark-600 rounded-lg shadow-xl z-10 py-1 min-w-[140px]">
                <button
                  onClick={() => { setShowMenu(false); onView(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-dark-600"
                >
                  <Eye size={16} /> View Details
                </button>
                <button
                  onClick={() => { setShowMenu(false); onEdit(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-dark-600"
                >
                  <Edit size={16} /> Edit
                </button>
                <hr className="border-dark-600 my-1" />
                <button
                  onClick={() => { setShowMenu(false); onDelete(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-dark-600"
                >
                  <Trash2 size={16} /> Delete Case
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="flex gap-2 mb-4">
        {getStatusBadge(case_.status)}
        {getPriorityBadge(case_.priority)}
      </div>

      {/* Info */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-dark-400">
          <FileText size={14} />
          <span>{getCaseTypeLabel(case_.case_type)}</span>
        </div>
        <div className="flex items-center gap-2 text-dark-400">
          <DollarSign size={14} />
          <span>{formatCurrency(case_.total_amount)}</span>
        </div>
        <div className="flex items-center gap-2 text-dark-400">
          <Calendar size={14} />
          <span>{formatDate(case_.created_at)}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const Cases = () => {
  // State
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Modals
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [deletingCase, setDeletingCase] = useState<Case | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Fetch cases
  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await casesAPI.list({
        page,
        page_size: 20,
        search: searchQuery || undefined,
        case_type: selectedType || undefined,
        status: selectedStatus || undefined,
        priority: selectedPriority || undefined
      });
      setCases(response.items);
      setTotal(response.total);
      setTotalPages(response.pages);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [page, searchQuery, selectedType, selectedStatus, selectedPriority]);

  // Handlers
  const handleCreateCase = async (data: any) => {
    if (editingCase) {
      await casesAPI.update(editingCase.id, data);
    } else {
      await casesAPI.create(data);
    }
    fetchCases();
    setEditingCase(null);
  };

  const handleDeleteCase = async () => {
    if (!deletingCase) return;

    setIsDeleting(true);
    try {
      await casesAPI.delete(deletingCase.id);
      setDeletingCase(null);
      setSelectedCase(null);
      fetchCases();
    } catch (error) {
      console.error('Error deleting case:', error);
      alert('Error deleting case');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-dark-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">All Cases</h1>
          <p className="text-dark-400 mt-1">{total} Cases</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={fetchCases} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </Button>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} className="mr-2" />
            Create New Case
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={20} />
          <Input
            placeholder="Search cases..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
          className="bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white text-sm"
        >
          {CASE_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
          className="bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white text-sm"
        >
          {STATUS_OPTIONS.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>

        <select
          value={selectedPriority}
          onChange={(e) => { setSelectedPriority(e.target.value); setPage(1); }}
          className="bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white text-sm"
        >
          {PRIORITY_OPTIONS.map(priority => (
            <option key={priority.value} value={priority.value}>{priority.label}</option>
          ))}
        </select>

        {/* View Toggle */}
        <div className="flex bg-dark-800 border border-dark-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded ${viewMode === 'table' ? 'bg-primary-500/20 text-primary-400' : 'text-dark-400'}`}
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-500/20 text-primary-400' : 'text-dark-400'}`}
          >
            <Grid3X3 size={18} />
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={40} className="text-primary-500 animate-spin" />
        </div>
      ) : cases.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20">
          <Briefcase size={64} className="text-dark-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No cases found</h3>
          <p className="text-dark-400 mb-6">
            {searchQuery ? 'Try different search terms' : 'Create New Case to get started'}
          </p>
          {!searchQuery && (
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={18} className="mr-2" />
              Create New Case
            </Button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left px-4 py-3 text-xs text-dark-400 font-medium uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-3 text-xs text-dark-400 font-medium uppercase tracking-wider">Case Number</th>
                <th className="text-left px-4 py-3 text-xs text-dark-400 font-medium uppercase tracking-wider">Case Title</th>
                <th className="text-left px-4 py-3 text-xs text-dark-400 font-medium uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs text-dark-400 font-medium uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs text-dark-400 font-medium uppercase tracking-wider">Priority</th>
                <th className="text-right px-4 py-3 text-xs text-dark-400 font-medium uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 text-xs text-dark-400 font-medium uppercase tracking-wider">Created Date</th>
                <th className="text-center px-4 py-3 text-xs text-dark-400 font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((case_, index) => (
                <tr key={case_.id} className="border-b border-dark-700 hover:bg-dark-700/50 transition-colors">
                  <td className="px-4 py-3 text-dark-400 text-sm">{(page - 1) * 20 + index + 1}</td>
                  <td className="px-4 py-3">
                    <span className="text-primary-400 font-mono text-sm">{case_.case_number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white text-sm font-medium truncate max-w-[200px]" title={case_.title}>
                      {case_.title}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-dark-300 text-sm">{getCaseTypeLabel(case_.case_type)}</td>
                  <td className="px-4 py-3">{getStatusBadge(case_.status)}</td>
                  <td className="px-4 py-3">{getPriorityBadge(case_.priority)}</td>
                  <td className="px-4 py-3 text-right text-white text-sm">{formatCurrency(case_.total_amount)}</td>
                  <td className="px-4 py-3 text-dark-400 text-sm">{formatDate(case_.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setSelectedCase(case_)}
                        className="p-1.5 hover:bg-dark-600 rounded text-dark-400 hover:text-white"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => { setEditingCase(case_); setShowCreateModal(true); }}
                        className="p-1.5 hover:bg-dark-600 rounded text-dark-400 hover:text-white"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setDeletingCase(case_)}
                        className="p-1.5 hover:bg-red-500/20 rounded text-dark-400 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-dark-700">
              <p className="text-sm text-dark-400">
                Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of {total} items
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm bg-dark-700 text-white rounded disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = page <= 3 ? i + 1 : page - 2 + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1 text-sm rounded ${
                        page === pageNum ? 'bg-primary-500 text-white' : 'bg-dark-700 text-white hover:bg-dark-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm bg-dark-700 text-white rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {cases.map(case_ => (
            <CaseCard
              key={case_.id}
              case_={case_}
              onView={() => setSelectedCase(case_)}
              onEdit={() => { setEditingCase(case_); setShowCreateModal(true); }}
              onDelete={() => setDeletingCase(case_)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedCase && (
        <CaseDetailModal
          case_={selectedCase}
          onClose={() => setSelectedCase(null)}
          onEdit={() => {
            setEditingCase(selectedCase);
            setSelectedCase(null);
            setShowCreateModal(true);
          }}
          onDelete={() => {
            setDeletingCase(selectedCase);
            setSelectedCase(null);
          }}
        />
      )}

      {showCreateModal && (
        <CreateCaseModal
          onClose={() => { setShowCreateModal(false); setEditingCase(null); }}
          onSave={handleCreateCase}
          editingCase={editingCase}
        />
      )}

      {deletingCase && (
        <DeleteConfirmModal
          case_={deletingCase}
          isOpen={true}
          onClose={() => setDeletingCase(null)}
          onConfirm={handleDeleteCase}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};

export { Cases as CasesPage };
export default Cases;
