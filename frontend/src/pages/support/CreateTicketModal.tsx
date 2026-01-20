/**
 * CreateTicketModal Component
 * Modal for users to create support tickets with screenshot upload
 */
import { useState, useRef, useCallback } from 'react';
import { X, Image, Trash2, Send, Bug, Lightbulb, HelpCircle, FileText, Loader2 } from 'lucide-react';
import { supportAPI, type TicketCategory } from '../../services/api';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const categories: { value: TicketCategory; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'bug', label: 'Bug / Error', icon: <Bug size={16} />, color: 'text-red-400 bg-red-500/20 border-red-500/30' },
  { value: 'feature', label: 'ขอ Feature', icon: <Lightbulb size={16} />, color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' },
  { value: 'question', label: 'คำถาม', icon: <HelpCircle size={16} />, color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
  { value: 'other', label: 'อื่นๆ', icon: <FileText size={16} />, color: 'text-gray-400 bg-gray-500/20 border-gray-500/30' },
];

export const CreateTicketModal = ({ isOpen, onClose, onSuccess }: CreateTicketModalProps) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('bug');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotFilename, setScreenshotFilename] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('ไฟล์ใหญ่เกิน 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setScreenshot(e.target?.result as string);
      setScreenshotFilename(file.name);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Handle paste from clipboard
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          handleFileSelect(file);
          e.preventDefault();
          break;
        }
      }
    }
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Remove screenshot
  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotFilename(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit ticket
  const handleSubmit = async () => {
    // Validation
    if (subject.trim().length < 5) {
      setError('หัวข้อต้องมีอย่างน้อย 5 ตัวอักษร');
      return;
    }
    
    if (description.trim().length < 10) {
      setError('รายละเอียดต้องมีอย่างน้อย 10 ตัวอักษร');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await supportAPI.create({
        subject: subject.trim(),
        description: description.trim(),
        category,
        screenshot_base64: screenshot || undefined,
        screenshot_filename: screenshotFilename || undefined,
      });

      // Success - reset form and close
      setSubject('');
      setDescription('');
      setCategory('bug');
      setScreenshot(null);
      setScreenshotFilename(null);
      
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form on close
  const handleClose = () => {
    setSubject('');
    setDescription('');
    setCategory('bug');
    setScreenshot(null);
    setScreenshotFilename(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-lg mx-4 bg-dark-800 rounded-xl shadow-2xl border border-dark-700"
        onPaste={handlePaste}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
              <Bug className="text-primary-400" size={18} />
            </div>
            <h2 className="text-lg font-semibold text-white">แจ้งปัญหา</h2>
          </div>
          <button 
            onClick={handleClose}
            className="p-1 text-dark-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-sm text-dark-300 mb-1.5">
              หัวข้อ <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="อธิบายปัญหาสั้นๆ..."
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
              maxLength={255}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm text-dark-300 mb-1.5">ประเภท</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                    category === cat.value
                      ? cat.color + ' border-current'
                      : 'bg-dark-700 border-dark-600 text-dark-400 hover:border-dark-500'
                  }`}
                >
                  {cat.icon}
                  <span className="text-sm">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-dark-300 mb-1.5">
              รายละเอียด <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="อธิบายปัญหาที่พบ ขั้นตอนที่ทำให้เกิดปัญหา..."
              rows={4}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors resize-none"
            />
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="block text-sm text-dark-300 mb-1.5">
              แนบภาพ Screenshot (ไม่บังคับ)
            </label>
            
            {screenshot ? (
              // Preview
              <div className="relative group">
                <img 
                  src={screenshot} 
                  alt="Screenshot preview" 
                  className="w-full max-h-48 object-contain rounded-lg border border-dark-600 bg-dark-900"
                />
                <button
                  onClick={removeScreenshot}
                  className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
                <div className="mt-1 text-xs text-dark-500 truncate">{screenshotFilename}</div>
              </div>
            ) : (
              // Upload Zone
              <div
                ref={dropZoneRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-dark-600 hover:border-primary-500/50 rounded-lg p-6 text-center cursor-pointer transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 bg-dark-700 rounded-lg flex items-center justify-center">
                    <Image className="text-dark-400" size={20} />
                  </div>
                  <div className="text-sm text-dark-400">
                    <span className="text-primary-400">คลิกเลือกไฟล์</span> หรือลากไฟล์มาวาง
                  </div>
                  <div className="text-xs text-dark-500">
                    หรือ Paste รูปจาก Clipboard (Ctrl+V)
                  </div>
                  <div className="text-xs text-dark-600">PNG, JPG ขนาดไม่เกิน 5MB</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-dark-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-dark-300 hover:text-white transition-colors"
            disabled={isSubmitting}
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !subject.trim() || !description.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-700 disabled:text-dark-500 text-white rounded-lg transition-colors"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            <span>ส่งแจ้งปัญหา</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTicketModal;
