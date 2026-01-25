/**
 * DeletedCases - Admin Page for Managing Deleted Cases
 * Features:
 * 1. List all soft-deleted cases
 * 2. Restore cases
 * 3. Permanent delete (Super Admin only)
 */
import { useState, useEffect } from 'react';
import {
  Trash2,
  RotateCcw,
  Search,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Calendar,
  User,
  FileText,
  XCircle
} from 'lucide-react';
import { Button, Input } from '../../components/ui';
import { casesAPI, type DeletedCase } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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

// ============================================
// RESTORE MODAL
// ============================================

interface RestoreModalProps {
  case_: DeletedCase;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const RestoreModal = ({ case_, onClose, onConfirm, isLoading }: RestoreModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-dark-800 rounded-xl shadow-2xl w-full max-w-md border border-dark-600">
        {/* Header */}
        <div className="p-6 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 rounded-full">
              <RotateCcw className="text-green-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Restore Case</h2>
              <p className="text-sm text-dark-400">Do you want to restore this case?</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-dark-700 rounded-lg p-4 mb-4">
            <p className="text-sm text-primary-400 font-mono">{case_.case_number}</p>
            <p className="text-white font-medium mt-1">{case_.title}</p>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex gap-3">
              <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
              <div className="text-sm text-green-300">
                <p className="font-medium">Case will be visible in the system again</p>
                <p className="text-green-400 mt-1">Users will be able to access it again</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-dark-700 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <RotateCcw size={18} className="mr-2" />
                Restore
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// PERMANENT DELETE MODAL
// ============================================

interface PermanentDeleteModalProps {
  case_: DeletedCase;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const PermanentDeleteModal = ({ case_, onClose, onConfirm, isLoading }: PermanentDeleteModalProps) => {
  const [confirmText, setConfirmText] = useState('');
  const canDelete = confirmText === 'DELETE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-dark-800 rounded-xl shadow-2xl w-full max-w-md border border-red-500/50">
        {/* Header */}
        <div className="p-6 border-b border-dark-700 bg-red-500/10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/20 rounded-full">
              <AlertTriangle className="text-red-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-400">Permanently Delete</h2>
              <p className="text-sm text-red-300">This action cannot be undone!</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-dark-700 rounded-lg p-4 mb-4">
            <p className="text-sm text-primary-400 font-mono">{case_.case_number}</p>
            <p className="text-white font-medium mt-1">{case_.title}</p>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
            <div className="flex gap-3">
              <XCircle className="text-red-400 flex-shrink-0" size={20} />
              <div className="text-sm text-red-300">
                <p className="font-medium">Data will be permanently deleted from the system</p>
                <p className="text-red-400 mt-1">Cannot be restored</p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-dark-400 mb-2 block">
              Type <span className="text-red-400 font-mono">DELETE</span> to confirm
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="border-red-500/50 focus:border-red-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-dark-700 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed"
            onClick={onConfirm}
            disabled={!canDelete || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={18} className="mr-2" />
                Permanently Delete
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const DeletedCases = () => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';

  // State
  const [cases, setCases] = useState<DeletedCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletedCount, setDeletedCount] = useState(0);

  // Modals
  const [restoringCase, setRestoringCase] = useState<DeletedCase | null>(null);
  const [deletingCase, setDeletingCase] = useState<DeletedCase | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch deleted cases
  const fetchDeletedCases = async () => {
    try {
      setLoading(true);
      const [casesData, countData] = await Promise.all([
        casesAPI.listDeleted({ search: searchQuery || undefined }),
        casesAPI.countDeleted()
      ]);
      setCases(casesData);
      setDeletedCount(countData.deleted_count);
    } catch (error) {
      console.error('Error fetching deleted cases:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedCases();
  }, [searchQuery]);

  // Handlers
  const handleRestore = async () => {
    if (!restoringCase) return;

    setIsProcessing(true);
    try {
      await casesAPI.restore(restoringCase.id);
      setRestoringCase(null);
      fetchDeletedCases();
    } catch (error) {
      console.error('Error restoring case:', error);
      alert('Error restoring case');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!deletingCase) return;

    setIsProcessing(true);
    try {
      await casesAPI.permanentDelete(deletingCase.id);
      setDeletingCase(null);
      fetchDeletedCases();
    } catch (error) {
      console.error('Error permanently deleting case:', error);
      alert('Error permanently deleting case');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Deleted Cases</h1>
          <p className="text-dark-400 mt-1">
            {deletedCount} cases deleted (can be restored)
          </p>
        </div>
        <Button variant="ghost" onClick={fetchDeletedCases} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={20} />
        <Input
          placeholder="Search deleted cases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={40} className="text-primary-500 animate-spin" />
        </div>
      ) : cases.length === 0 ? (
        <div className="text-center py-20 bg-dark-800 rounded-xl border border-dark-700">
          <Trash2 size={64} className="text-dark-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No deleted cases</h3>
          <p className="text-dark-400">
            {searchQuery ? 'Try different search terms' : 'No cases have been deleted yet'}
          </p>
        </div>
      ) : (
        <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700 bg-dark-700/50">
                <th className="text-left px-4 py-3 text-xs text-dark-400 font-medium uppercase tracking-wider">
                  Case Number
                </th>
                <th className="text-left px-4 py-3 text-xs text-dark-400 font-medium uppercase tracking-wider">
                  Case Title
                </th>
                <th className="text-left px-4 py-3 text-xs text-dark-400 font-medium uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-xs text-dark-400 font-medium uppercase tracking-wider">
                  Deleted By
                </th>
                <th className="text-left px-4 py-3 text-xs text-dark-400 font-medium uppercase tracking-wider">
                  Deleted Date
                </th>
                <th className="text-center px-4 py-3 text-xs text-dark-400 font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {cases.map((case_) => (
                <tr key={case_.id} className="border-b border-dark-700 hover:bg-dark-700/30 transition-colors">
                  <td className="px-4 py-4">
                    <span className="text-primary-400 font-mono text-sm">{case_.case_number}</span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-white text-sm font-medium truncate max-w-[250px]" title={case_.title}>
                      {case_.title}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-dark-300 text-sm">
                      <FileText size={14} />
                      {getCaseTypeLabel(case_.case_type)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-dark-400 text-sm">
                      <User size={14} />
                      <span className="truncate max-w-[150px]">{case_.deleted_by_email || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-dark-400 text-sm">
                      <Calendar size={14} />
                      {formatDate(case_.deleted_at)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {/* Restore Button */}
                      <button
                        onClick={() => setRestoringCase(case_)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
                        title="Restore"
                      >
                        <RotateCcw size={14} />
                        Restore
                      </button>

                      {/* Permanent Delete Button (Super Admin Only) */}
                      {isSuperAdmin && (
                        <button
                          onClick={() => setDeletingCase(case_)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                          title="Permanently Delete"
                        >
                          <Trash2 size={14} />
                          Permanently Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
        <h3 className="text-white font-medium mb-2">ℹ️ About deleted cases</h3>
        <ul className="space-y-1 text-sm text-dark-400">
          <li>• Deleted cases are hidden from users but data remains in the system</li>
          <li>• Admin can restore cases anytime and they will be visible again</li>
          {isSuperAdmin && (
            <li className="text-red-400">• Super Admin can permanently delete cases which cannot be restored</li>
          )}
        </ul>
      </div>

      {/* Modals */}
      {restoringCase && (
        <RestoreModal
          case_={restoringCase}
          onClose={() => setRestoringCase(null)}
          onConfirm={handleRestore}
          isLoading={isProcessing}
        />
      )}

      {deletingCase && (
        <PermanentDeleteModal
          case_={deletingCase}
          onClose={() => setDeletingCase(null)}
          onConfirm={handlePermanentDelete}
          isLoading={isProcessing}
        />
      )}
    </div>
  );
};

export default DeletedCases;
