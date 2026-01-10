/**
 * AddNodeModal - Modal for adding new Money Flow nodes
 */
import { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui';

interface AddNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: number;
  onSuccess: () => void;
}

const API_BASE = 'https://investigates-api.azurewebsites.net/api/v1';

const NODE_TYPES = [
  { value: 'bank_account', label: 'บัญชีธนาคาร' },
  { value: 'crypto_wallet', label: 'Crypto Wallet' },
  { value: 'person', label: 'บุคคล' },
  { value: 'company', label: 'บริษัท' },
  { value: 'exchange', label: 'Exchange' },
  { value: 'unknown', label: 'อื่นๆ' },
];

export const AddNodeModal = ({ isOpen, onClose, caseId, onSuccess }: AddNodeModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    node_type: 'bank_account',
    identifier: '',
    bank_name: '',
    account_name: '',
    is_suspect: false,
    is_victim: false,
    risk_score: 0,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.label) {
      setError('กรุณากรอกชื่อ Node');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/cases/${caseId}/money-flow/nodes`, {
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
          label: '',
          node_type: 'bank_account',
          identifier: '',
          bank_name: '',
          account_name: '',
          is_suspect: false,
          is_victim: false,
          risk_score: 0,
          notes: '',
        });
      } else {
        const data = await response.json();
        setError(data.detail || 'เกิดข้อผิดพลาดในการสร้าง Node');
      }
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
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
      <div className="relative bg-dark-800 rounded-xl shadow-2xl w-full max-w-lg border border-dark-600 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-700 sticky top-0 bg-dark-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Plus className="text-primary-400" />
            เพิ่ม Node ใหม่
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-dark-700 rounded">
            <X size={20} className="text-dark-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Label */}
          <div>
            <label className="block text-sm text-dark-400 mb-1">ชื่อ Node *</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              placeholder="เช่น บัญชี A, Wallet X"
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none"
            />
          </div>

          {/* Node Type */}
          <div>
            <label className="block text-sm text-dark-400 mb-1">ประเภท</label>
            <select
              value={formData.node_type}
              onChange={(e) => setFormData(prev => ({ ...prev, node_type: e.target.value }))}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
            >
              {NODE_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Identifier */}
          <div>
            <label className="block text-sm text-dark-400 mb-1">
              {formData.node_type === 'bank_account' ? 'เลขบัญชี' : 
               formData.node_type === 'crypto_wallet' ? 'Wallet Address' :
               'Identifier'}
            </label>
            <input
              type="text"
              value={formData.identifier}
              onChange={(e) => setFormData(prev => ({ ...prev, identifier: e.target.value }))}
              placeholder={formData.node_type === 'crypto_wallet' ? '0x...' : 'XXX-X-XXXXX-X'}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none font-mono"
            />
          </div>

          {/* Bank Name / Institution */}
          <div>
            <label className="block text-sm text-dark-400 mb-1">
              {formData.node_type === 'bank_account' ? 'ธนาคาร' : 
               formData.node_type === 'crypto_wallet' ? 'Blockchain' :
               'สถาบัน/องค์กร'}
            </label>
            <input
              type="text"
              value={formData.bank_name}
              onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
              placeholder={formData.node_type === 'crypto_wallet' ? 'Ethereum, Bitcoin' : 'ธนาคารกสิกรไทย'}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none"
            />
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-sm text-dark-400 mb-1">ชื่อบัญชี/เจ้าของ</label>
            <input
              type="text"
              value={formData.account_name}
              onChange={(e) => setFormData(prev => ({ ...prev, account_name: e.target.value }))}
              placeholder="ชื่อเจ้าของบัญชี"
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none"
            />
          </div>

          {/* Flags */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_suspect}
                onChange={(e) => setFormData(prev => ({ ...prev, is_suspect: e.target.checked }))}
                className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-red-500 focus:ring-red-500"
              />
              <span className="text-sm text-red-400">ผู้ต้องสงสัย</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_victim}
                onChange={(e) => setFormData(prev => ({ ...prev, is_victim: e.target.checked }))}
                className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-sm text-cyan-400">ผู้เสียหาย</span>
            </label>
          </div>

          {/* Risk Score */}
          <div>
            <label className="block text-sm text-dark-400 mb-1">
              ระดับความเสี่ยง: {formData.risk_score}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.risk_score}
              onChange={(e) => setFormData(prev => ({ ...prev, risk_score: parseInt(e.target.value) }))}
              className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-dark-500 mt-1">
              <span>ปลอดภัย</span>
              <span>ต่ำ</span>
              <span>ปานกลาง</span>
              <span>สูง</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-dark-400 mb-1">หมายเหตุ</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="รายละเอียดเพิ่มเติม..."
              rows={3}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none resize-none"
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
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  กำลังสร้าง...
                </>
              ) : (
                <>
                  <Plus size={18} className="mr-2" />
                  สร้าง Node
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNodeModal;
