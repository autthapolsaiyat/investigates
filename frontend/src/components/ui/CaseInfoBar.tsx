/**
 * CaseInfoBar Component
 * Read-only display of currently selected case
 * Use in: Money Flow, Crypto Tracker, Call Analysis, Location Timeline
 */
import { 
  Briefcase, DollarSign, Users, AlertTriangle, Calendar
} from 'lucide-react';
import { useCaseStore } from '../../store/caseStore';

interface CaseInfoBarProps {
  compact?: boolean;
}

export const CaseInfoBar = ({ compact = false }: CaseInfoBarProps) => {
  const { selectedCase } = useCaseStore();

  const formatCurrency = (amount?: number) => {
    if (!amount) return '฿0';
    if (amount >= 1000000) return `฿${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `฿${(amount / 1000).toFixed(1)}K`;
    return `฿${amount.toLocaleString()}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!selectedCase) {
    return (
      <div className="bg-dark-800/50 border border-dark-700 rounded-lg p-3 text-center text-dark-400 text-sm">
        <Briefcase className="inline-block w-4 h-4 mr-2" />
        Please select a case from the left menu
      </div>
    );
  }

  // Compact version - for headers
  if (compact) {
    return (
      <div className="flex items-center gap-4 px-3 py-1.5 bg-dark-700/50 rounded-lg text-sm">
        <div className="flex items-center gap-2">
          <Briefcase size={14} className="text-primary-400" />
          <span className="text-primary-400 font-medium">{selectedCase.case_number}</span>
        </div>
        <span className="text-white font-medium truncate max-w-[200px]" title={selectedCase.title}>
          {selectedCase.title}
        </span>
        <div className="flex items-center gap-3 text-dark-400">
          <span className="flex items-center gap-1">
            <DollarSign size={14} className="text-green-400" />
            {formatCurrency(selectedCase.total_amount)}
          </span>
          <span className="flex items-center gap-1">
            <Users size={14} className="text-red-400" />
            {selectedCase.victims_count || 0}
          </span>
          <span className="flex items-center gap-1">
            <AlertTriangle size={14} className="text-orange-400" />
            {selectedCase.suspects_count || 0}
          </span>
        </div>
      </div>
    );
  }

  // Full version - card style
  return (
    <div className="bg-dark-800/50 border border-dark-700 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Briefcase size={16} className="text-primary-400" />
            <span className="text-sm text-primary-400 font-medium">{selectedCase.case_number}</span>
          </div>
          <h3 className="text-lg font-semibold text-white">{selectedCase.title}</h3>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-400" />
          <div>
            <p className="text-xs text-dark-400">Amount</p>
            <p className="text-sm font-medium text-white">{formatCurrency(selectedCase.total_amount)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-red-400" />
          <div>
            <p className="text-xs text-dark-400">Victims</p>
            <p className="text-sm font-medium text-white">{selectedCase.victims_count || 0} people</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-400" />
          <div>
            <p className="text-xs text-dark-400">Suspects</p>
            <p className="text-sm font-medium text-white">{selectedCase.suspects_count || 0} people</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <div>
            <p className="text-xs text-dark-400">Created</p>
            <p className="text-sm font-medium text-white">{formatDate(selectedCase.created_at)}</p>
          </div>
        </div>
      </div>

      {selectedCase.description && (
        <p className="mt-3 text-sm text-dark-400 line-clamp-2">{selectedCase.description}</p>
      )}
    </div>
  );
};

export default CaseInfoBar;
