/**
 * CaseCreateModal - Create New Case
 */
import { useState } from 'react';
import { X, Plus, Loader2, FileText } from 'lucide-react';
import { Button } from '../../components/ui';

interface CaseCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CaseCreateModal = ({ isOpen, onClose, onSuccess }: CaseCreateModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    case_number: '',
    title: '',
    description: '',
    status: 'open',
    priority: 'medium',
    case_type: 'fraud'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.case_number || !formData.title) {
      setError('Please enter case number and case title');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('https://investigates-api.azurewebsites.net/api/v1/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSuccess();
        onClose();
        setFormData({
          case_number: '',
          title: '',
          description: '',
          status: 'open',
          priority: 'medium',
          case_type: 'fraud'
        });
      } else {
        const data = await response.json();
        setError(data.detail || 'Error creating case');
      }
    } catch (err) {
      setError('Unable to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-dark-800 rounded-xl shadow-2xl w-full max-w-lg border border-dark-600">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-700">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="text-primary-400" />
            Create New Case
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-dark-700 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Case Number */}
          <div>
            <label className="block text-sm text-dark-400 mb-1">Case Number *</label>
            <input
              type="text"
              value={formData.case_number}
              onChange={(e) => setFormData(prev => ({ ...prev, case_number: e.target.value }))}
              placeholder="e.g. CRYPTO-001"
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm text-dark-400 mb-1">Case Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Crypto Fraud Case"
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-dark-400 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Case description..."
              rows={3}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none resize-none"
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-400 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Case Type */}
          <div>
            <label className="block text-sm text-dark-400 mb-1">Case Type</label>
            <select
              value={formData.case_type}
              onChange={(e) => setFormData(prev => ({ ...prev, case_type: e.target.value }))}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="fraud">Fraud</option>
              <option value="money_laundering">Money Laundering</option>
              <option value="cybercrime">Cybercrime</option>
              <option value="theft">Theft</option>
              <option value="corruption">Corruption</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={18} className="mr-2" />
                  Create Case
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CaseCreateModal;
