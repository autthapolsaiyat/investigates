/**
 * CaseCreateModal - Create New Case
 * Enhanced with quick amount buttons
 */
import { useState } from 'react';
import { X, Plus, Minus, Loader2, FileText, DollarSign, Users, UserX } from 'lucide-react';
import { Button } from '../../components/ui';

interface CaseCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Match backend enum values exactly
const CASE_TYPES = [
  { value: 'online_gambling', label: 'Online Gambling' },
  { value: 'money_laundering', label: 'Money Laundering' },
  { value: 'fraud', label: 'Fraud' },
  { value: 'call_center_scam', label: 'Call Center Scam' },
  { value: 'romance_scam', label: 'Romance Scam' },
  { value: 'investment_scam', label: 'Investment Scam' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

// Quick amount presets (in THB)
const AMOUNT_PRESETS = [
  { value: 10000, label: '10K' },
  { value: 100000, label: '100K' },
  { value: 500000, label: '500K' },
  { value: 1000000, label: '1M' },
  { value: 10000000, label: '10M' },
  { value: 20000000, label: '20M' },
];

export const CaseCreateModal = ({ isOpen, onClose, onSuccess }: CaseCreateModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    case_type: 'fraud',
    priority: 'medium',
    total_amount: 0,
    currency: 'THB',
    victims_count: 0,
    suspects_count: 0,
  });

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  // Add to amount
  const addAmount = (add: number) => {
    setFormData(prev => ({ ...prev, total_amount: Math.max(0, prev.total_amount + add) }));
  };

  // Counter component for Victims/Suspects
  const Counter = ({ 
    label, 
    value, 
    onChange, 
    icon: Icon 
  }: { 
    label: string; 
    value: number; 
    onChange: (v: number) => void;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }) => (
    <div>
      <label className="block text-sm text-dark-400 mb-1 flex items-center gap-1">
        <Icon size={14} />
        {label}
      </label>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 10))}
          className="px-2 py-2 bg-dark-600 hover:bg-dark-500 rounded-l-lg text-dark-300 hover:text-white transition-colors"
        >
          -10
        </button>
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="px-2 py-2 bg-dark-600 hover:bg-dark-500 text-dark-300 hover:text-white transition-colors"
        >
          <Minus size={14} />
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-16 bg-dark-700 border-y border-dark-600 px-2 py-2 text-white text-center"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="px-2 py-2 bg-dark-600 hover:bg-dark-500 text-dark-300 hover:text-white transition-colors"
        >
          <Plus size={14} />
        </button>
        <button
          type="button"
          onClick={() => onChange(value + 10)}
          className="px-2 py-2 bg-dark-600 hover:bg-dark-500 rounded-r-lg text-dark-300 hover:text-white transition-colors"
        >
          +10
        </button>
      </div>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Please enter case title');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        case_type: formData.case_type,
        priority: formData.priority,
        total_amount: Number(formData.total_amount) || 0,
        currency: formData.currency,
        victims_count: Number(formData.victims_count) || 0,
        suspects_count: Number(formData.suspects_count) || 0,
      };

      const response = await fetch('https://investigates-api.azurewebsites.net/api/v1/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        onSuccess();
        onClose();
        setFormData({
          title: '',
          description: '',
          case_type: 'fraud',
          priority: 'medium',
          total_amount: 0,
          currency: 'THB',
          victims_count: 0,
          suspects_count: 0,
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
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      
      <div className="relative bg-dark-800 rounded-xl shadow-2xl w-full max-w-lg border border-dark-600 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-dark-700 sticky top-0 bg-dark-800 z-10">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="text-primary-400" />
            Create New Case
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-dark-700 rounded">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm text-dark-400 mb-1">Case Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Drug Network Investigation"
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
              rows={2}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none resize-none"
            />
          </div>

          {/* Case Type & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-400 mb-1">Case Type</label>
              <select
                value={formData.case_type}
                onChange={(e) => setFormData(prev => ({ ...prev, case_type: e.target.value }))}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
              >
                {CASE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
              >
                {PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount Section */}
          <div className="bg-dark-700/50 rounded-lg p-4 space-y-3">
            <label className="text-sm text-dark-400 flex items-center gap-1">
              <DollarSign size={14} />
              Amount (THB)
            </label>

            {/* Amount Input with Display */}
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary-400">฿</span>
              <input
                type="number"
                value={formData.total_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, total_amount: parseFloat(e.target.value) || 0 }))}
                className="flex-1 bg-dark-600 border border-dark-500 rounded-lg px-3 py-2 text-white text-xl font-bold focus:border-primary-500 focus:outline-none"
              />
            </div>

            {/* Formatted Display */}
            {formData.total_amount > 0 && (
              <div className="text-sm text-primary-400 text-right font-medium">
                ฿{formatNumber(formData.total_amount)}
              </div>
            )}

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-2">
              {AMOUNT_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, total_amount: preset.value }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    formData.total_amount === preset.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-600 text-dark-300 hover:bg-dark-500 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Increment Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-dark-600">
              <span className="text-xs text-dark-500">Adjust:</span>
              <button
                type="button"
                onClick={() => addAmount(-100000)}
                className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs"
              >
                -100K
              </button>
              <button
                type="button"
                onClick={() => addAmount(-10000)}
                className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs"
              >
                -10K
              </button>
              <button
                type="button"
                onClick={() => addAmount(10000)}
                className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-xs"
              >
                +10K
              </button>
              <button
                type="button"
                onClick={() => addAmount(100000)}
                className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-xs"
              >
                +100K
              </button>
              <button
                type="button"
                onClick={() => addAmount(1000000)}
                className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-xs"
              >
                +1M
              </button>
            </div>
          </div>

          {/* Victims & Suspects with Counters */}
          <div className="grid grid-cols-2 gap-4">
            <Counter
              label="Victims"
              value={formData.victims_count}
              onChange={(v) => setFormData(prev => ({ ...prev, victims_count: v }))}
              icon={Users}
            />
            <Counter
              label="Suspects"
              value={formData.suspects_count}
              onChange={(v) => setFormData(prev => ({ ...prev, suspects_count: v }))}
              icon={UserX}
            />
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
