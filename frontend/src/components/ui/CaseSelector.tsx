/**
 * CaseSelector Component
 * Reusable case selection with case info display
 * Use in: Money Flow, Crypto Tracker, Call Analysis, Location Timeline
 */
import { useEffect, useState } from 'react';
import { 
  Briefcase, ChevronDown, DollarSign, Users, AlertTriangle,
  Calendar, Tag, Loader2
} from 'lucide-react';
import { casesAPI, type Case } from '../../services/api';
import { Badge } from '../ui';

interface CaseSelectorProps {
  selectedCaseId: number | null;
  onCaseChange: (caseId: number | null, caseData: Case | null) => void;
  showCaseInfo?: boolean;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  open: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  pending_review: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  closed: 'bg-green-500/20 text-green-400 border-green-500/30',
  archived: 'bg-dark-500/20 text-dark-400 border-dark-500/30',
};

const statusLabels: Record<string, string> = {
  draft: 'ร่าง',
  open: 'เปิด',
  in_progress: 'กำลังดำเนินการ',
  pending_review: 'รอตรวจสอบ',
  closed: 'ปิด',
  archived: 'เก็บถาวร',
};

const priorityColors: Record<string, string> = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
};

export const CaseSelector = ({ 
  selectedCaseId, 
  onCaseChange, 
  showCaseInfo = true 
}: CaseSelectorProps) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch cases
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await casesAPI.list({ page: 1, page_size: 100 });
        setCases(response.items);
        
        // Auto-select first case or selected case
        if (response.items.length > 0) {
          const targetCase = selectedCaseId 
            ? response.items.find(c => c.id === selectedCaseId) 
            : response.items[0];
          
          if (targetCase) {
            setSelectedCase(targetCase);
            onCaseChange(targetCase.id, targetCase);
          }
        }
      } catch (err) {
        console.error('Failed to fetch cases:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  // Update selected case when ID changes
  useEffect(() => {
    if (selectedCaseId && cases.length > 0) {
      const found = cases.find(c => c.id === selectedCaseId);
      if (found) setSelectedCase(found);
    }
  }, [selectedCaseId, cases]);

  const handleSelect = (caseItem: Case) => {
    setSelectedCase(caseItem);
    onCaseChange(caseItem.id, caseItem);
    setIsOpen(false);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `฿${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `฿${(amount / 1000).toFixed(1)}K`;
    return `฿${amount.toLocaleString()}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-dark-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>กำลังโหลดคดี...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Case Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg hover:border-primary-500/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-primary-400" />
            {selectedCase ? (
              <div className="text-left">
                <p className="text-sm font-medium text-white">{selectedCase.case_number}</p>
                <p className="text-xs text-dark-400 truncate max-w-[300px]">{selectedCase.title}</p>
              </div>
            ) : (
              <span className="text-dark-400">-- เลือกคดี --</span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-dark-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-dark-800 border border-dark-700 rounded-lg shadow-xl max-h-[400px] overflow-y-auto">
            {cases.length > 0 ? cases.map(c => (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-700 transition-colors text-left ${
                  selectedCase?.id === c.id ? 'bg-primary-500/10 border-l-2 border-primary-500' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{c.case_number}</span>
                    <Badge className={statusColors[c.status] || statusColors.draft}>
                      {statusLabels[c.status] || c.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-dark-400 truncate">{c.title}</p>
                </div>
                <div className="text-right text-xs">
                  <p className="text-primary-400 font-medium">{formatCurrency(c.total_amount || 0)}</p>
                  <p className="text-dark-500">{formatDate(c.created_at)}</p>
                </div>
              </button>
            )) : (
              <div className="p-4 text-center text-dark-400">
                ไม่มีคดีในระบบ
              </div>
            )}
          </div>
        )}
      </div>

      {/* Case Info Card */}
      {showCaseInfo && selectedCase && (
        <div className="bg-dark-800/50 border border-dark-700 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-white">{selectedCase.title}</h3>
              <p className="text-sm text-dark-400">{selectedCase.case_number}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={statusColors[selectedCase.status] || statusColors.draft}>
                {statusLabels[selectedCase.status] || selectedCase.status}
              </Badge>
              {selectedCase.priority && (
                <AlertTriangle className={`w-4 h-4 ${priorityColors[selectedCase.priority]}`} />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <div>
                <p className="text-xs text-dark-400">มูลค่า</p>
                <p className="text-sm font-medium text-white">{formatCurrency(selectedCase.total_amount || 0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-red-400" />
              <div>
                <p className="text-xs text-dark-400">ผู้เสียหาย</p>
                <p className="text-sm font-medium text-white">{selectedCase.victims_count || 0} คน</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <div>
                <p className="text-xs text-dark-400">ผู้ต้องสงสัย</p>
                <p className="text-sm font-medium text-white">{selectedCase.suspects_count || 0} คน</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-xs text-dark-400">สร้างเมื่อ</p>
                <p className="text-sm font-medium text-white">{formatDate(selectedCase.created_at)}</p>
              </div>
            </div>
          </div>

          {selectedCase.description && (
            <p className="mt-3 text-sm text-dark-400 line-clamp-2">{selectedCase.description}</p>
          )}

          {selectedCase.tags && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <Tag className="w-3 h-3 text-dark-500" />
              {selectedCase.tags.split(',').map((tag, i) => (
                <span key={i} className="px-2 py-0.5 bg-dark-700 text-dark-300 text-xs rounded">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CaseSelector;
