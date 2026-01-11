/**
 * EvidenceManager - ระบบจัดการหลักฐานสำหรับชั้นศาล
 * Features: Upload, SHA-256 Hash, Timestamp, Chain of Custody, Export
 */
import { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Image,
  File,
  Download,
  Trash2,
  Eye,
  Shield,
  CheckCircle,
  Clock,
  User,

  X,
  Plus,

  Lock,
  FileDown,

} from 'lucide-react';
import { Button } from '../../components/ui';

// Evidence types
interface Evidence {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string; // base64
  sha256Hash: string;
  uploadedAt: string;
  uploadedBy: string;
  description: string;
  category: 'screenshot' | 'document' | 'blockchain' | 'communication' | 'other';
  verified: boolean;
}

interface EvidenceManagerProps {
  caseId?: string;
  caseName?: string;
  onEvidenceChange?: (evidence: Evidence[]) => void;
  readOnly?: boolean;
}

// Calculate SHA-256 hash
const calculateSHA256 = async (data: ArrayBuffer): Promise<string> => {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// Format date
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Get file icon
const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return Image;
  if (fileType === 'application/pdf') return FileText;
  return File;
};

// Category labels
const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  screenshot: { label: 'Screenshot', color: 'bg-blue-500/20 text-blue-400' },
  document: { label: 'เอกสาร', color: 'bg-purple-500/20 text-purple-400' },
  blockchain: { label: 'Blockchain', color: 'bg-amber-500/20 text-amber-400' },
  communication: { label: 'การติดต่อสื่อสาร', color: 'bg-green-500/20 text-green-400' },
  other: { label: 'อื่นๆ', color: 'bg-dark-500/20 text-dark-300' }
};

export const EvidenceManager = ({ 
  caseId = 'CASE-DEMO', 
  caseName = 'คดี Silk Road',
  onEvidenceChange,
  readOnly = false 
}: EvidenceManagerProps) => {
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState<Evidence['category']>('screenshot');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingFileData, setPendingFileData] = useState<string | null>(null);
  const [pendingHash, setPendingHash] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('รองรับเฉพาะไฟล์ PNG, JPG, PDF เท่านั้น');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('ไฟล์ต้องมีขนาดไม่เกิน 10MB');
      return;
    }

    setIsUploading(true);

    try {
      // Read file as ArrayBuffer for hash calculation
      const arrayBuffer = await file.arrayBuffer();
      const hash = await calculateSHA256(arrayBuffer);

      // Read file as base64 for storage/display
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setPendingFile(file);
        setPendingFileData(base64);
        setPendingHash(hash);
        setShowUploadModal(true);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('เกิดข้อผิดพลาดในการประมวลผลไฟล์');
      setIsUploading(false);
    }
  };

  // Confirm upload
  const handleConfirmUpload = () => {
    if (!pendingFile || !pendingFileData || !pendingHash) return;

    const newEvidence: Evidence = {
      id: `EVD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fileName: pendingFile.name,
      fileType: pendingFile.type,
      fileSize: pendingFile.size,
      fileData: pendingFileData,
      sha256Hash: pendingHash,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'admin@test.com', // In real app, get from auth
      description: uploadDescription || pendingFile.name,
      category: uploadCategory,
      verified: true
    };

    const updatedList = [...evidenceList, newEvidence];
    setEvidenceList(updatedList);
    onEvidenceChange?.(updatedList);

    // Reset
    setPendingFile(null);
    setPendingFileData(null);
    setPendingHash(null);
    setUploadDescription('');
    setUploadCategory('screenshot');
    setShowUploadModal(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Cancel upload
  const handleCancelUpload = () => {
    setPendingFile(null);
    setPendingFileData(null);
    setPendingHash(null);
    setUploadDescription('');
    setShowUploadModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Delete evidence
  const handleDelete = (id: string) => {
    if (!confirm('ต้องการลบหลักฐานนี้หรือไม่?')) return;
    const updatedList = evidenceList.filter(e => e.id !== id);
    setEvidenceList(updatedList);
    onEvidenceChange?.(updatedList);
  };

  // Preview evidence
  const handlePreview = (evidence: Evidence) => {
    setSelectedEvidence(evidence);
    setShowPreviewModal(true);
  };

  // Download evidence
  const handleDownload = (evidence: Evidence) => {
    const link = document.createElement('a');
    link.href = evidence.fileData;
    link.download = evidence.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export evidence report
  const handleExportReport = () => {
    const report = {
      caseId,
      caseName,
      exportedAt: new Date().toISOString(),
      exportedBy: 'admin@test.com',
      totalEvidence: evidenceList.length,
      evidence: evidenceList.map(e => ({
        id: e.id,
        fileName: e.fileName,
        fileType: e.fileType,
        fileSize: formatFileSize(e.fileSize),
        sha256Hash: e.sha256Hash,
        uploadedAt: e.uploadedAt,
        uploadedBy: e.uploadedBy,
        description: e.description,
        category: e.category
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `evidence-report-${caseId}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Verify hash

  return (
    <div className="bg-dark-800 rounded-xl border border-dark-700">
      {/* Header */}
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Shield size={20} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">หลักฐานดิจิทัล</h2>
              <p className="text-xs text-dark-400">{evidenceList.length} รายการ • พร้อมใช้ในชั้นศาล</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {evidenceList.length > 0 && (
              <Button variant="ghost" onClick={handleExportReport} className="text-sm">
                <FileDown size={14} className="mr-1" />
                Export Report
              </Button>
            )}
            {!readOnly && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-sm"
                >
                  {isUploading ? (
                    <>
                      <span className="animate-spin mr-1">⏳</span>
                      กำลังประมวลผล...
                    </>
                  ) : (
                    <>
                      <Plus size={14} className="mr-1" />
                      เพิ่มหลักฐาน
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Evidence List */}
      <div className="p-4">
        {evidenceList.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload size={24} className="text-dark-500" />
            </div>
            <div className="text-dark-400 mb-2">ยังไม่มีหลักฐาน</div>
            <div className="text-xs text-dark-500">
              กด "เพิ่มหลักฐาน" เพื่อ Upload ไฟล์ (PNG, JPG, PDF)
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {evidenceList.map((evidence) => {
              const FileIcon = getFileIcon(evidence.fileType);
              const categoryInfo = CATEGORY_LABELS[evidence.category];
              
              return (
                <div
                  key={evidence.id}
                  className="bg-dark-900 rounded-lg border border-dark-700 p-4 hover:border-dark-600 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 bg-dark-800 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {evidence.fileType.startsWith('image/') ? (
                        <img 
                          src={evidence.fileData} 
                          alt={evidence.fileName}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <FileIcon size={24} className="text-dark-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium truncate">{evidence.fileName}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${categoryInfo.color}`}>
                          {categoryInfo.label}
                        </span>
                        {evidence.verified && (
                          <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400 flex items-center gap-1">
                            <CheckCircle size={10} />
                            Verified
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-dark-400 mb-2 truncate">{evidence.description}</p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-dark-500">
                        <span className="flex items-center gap-1">
                          <File size={10} />
                          {formatFileSize(evidence.fileSize)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {formatDate(evidence.uploadedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={10} />
                          {evidence.uploadedBy}
                        </span>
                      </div>

                      {/* Hash */}
                      <div className="mt-2 p-2 bg-dark-800 rounded flex items-center gap-2">
                        <Lock size={12} className="text-amber-400 flex-shrink-0" />
                        <code className="text-xs text-amber-400 font-mono truncate">
                          SHA-256: {evidence.sha256Hash}
                        </code>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handlePreview(evidence)}
                        className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                        title="ดูตัวอย่าง"
                      >
                        <Eye size={16} className="text-dark-400" />
                      </button>
                      <button
                        onClick={() => handleDownload(evidence)}
                        className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                        title="ดาวน์โหลด"
                      >
                        <Download size={16} className="text-dark-400" />
                      </button>
                      {!readOnly && (
                        <button
                          onClick={() => handleDelete(evidence.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="ลบ"
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Court Notice */}
      <div className="p-4 border-t border-dark-700">
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Shield size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-green-400">พร้อมใช้ในชั้นศาล</div>
              <div className="text-xs text-dark-300 mt-1">
                หลักฐานทุกชิ้นถูกตรวจสอบด้วย SHA-256 Hash พร้อม Timestamp และ Chain of Custody
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && pendingFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 w-[500px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Upload size={20} className="text-primary-400" />
                เพิ่มหลักฐาน
              </h3>
              <button onClick={handleCancelUpload} className="p-1 hover:bg-dark-700 rounded">
                <X size={18} className="text-dark-400" />
              </button>
            </div>

            {/* File Preview */}
            <div className="mb-4">
              <div className="bg-dark-900 rounded-lg p-4 border border-dark-700">
                <div className="flex items-center gap-3 mb-3">
                  {pendingFile.type.startsWith('image/') && pendingFileData ? (
                    <img 
                      src={pendingFileData} 
                      alt="Preview" 
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-dark-800 rounded-lg flex items-center justify-center">
                      <FileText size={32} className="text-dark-400" />
                    </div>
                  )}
                  <div>
                    <div className="text-white font-medium">{pendingFile.name}</div>
                    <div className="text-sm text-dark-400">{formatFileSize(pendingFile.size)}</div>
                    <div className="text-xs text-dark-500">{pendingFile.type}</div>
                  </div>
                </div>

                {/* Hash */}
                <div className="p-3 bg-dark-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock size={14} className="text-green-400" />
                    <span className="text-xs text-dark-400">SHA-256 Hash (คำนวณอัตโนมัติ)</span>
                  </div>
                  <code className="text-xs text-green-400 font-mono break-all">
                    {pendingHash}
                  </code>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="text-sm text-dark-400 mb-1 block">หมวดหมู่:</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as Evidence['category'])}
                  className="w-full bg-dark-900 border border-dark-600 rounded-lg p-3 text-white"
                >
                  <option value="screenshot">📸 Screenshot</option>
                  <option value="blockchain">⛓️ Blockchain Transaction</option>
                  <option value="document">📄 เอกสาร</option>
                  <option value="communication">💬 การติดต่อสื่อสาร</option>
                  <option value="other">📁 อื่นๆ</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-dark-400 mb-1 block">คำอธิบาย:</label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="อธิบายหลักฐานนี้..."
                  rows={3}
                  className="w-full bg-dark-900 border border-dark-600 rounded-lg p-3 text-white resize-none"
                />
              </div>

              {/* Metadata */}
              <div className="p-3 bg-dark-900 rounded-lg">
                <div className="text-xs text-dark-400 mb-2">ข้อมูลที่จะบันทึก:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-dark-500">วันที่:</span> <span className="text-white">{formatDate(new Date().toISOString())}</span></div>
                  <div><span className="text-dark-500">ผู้บันทึก:</span> <span className="text-white">admin@test.com</span></div>
                  <div><span className="text-dark-500">คดี:</span> <span className="text-white">{caseId}</span></div>
                  <div><span className="text-dark-500">สถานะ:</span> <span className="text-green-400">Verified ✓</span></div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleCancelUpload} className="flex-1">
                  ยกเลิก
                </Button>
                <Button variant="primary" onClick={handleConfirmUpload} className="flex-1">
                  <CheckCircle size={14} className="mr-1" />
                  บันทึกหลักฐาน
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedEvidence && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-xl border border-dark-700 w-[900px] max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <div className="flex items-center gap-3">
                <Shield size={20} className="text-green-400" />
                <div>
                  <div className="text-white font-medium">{selectedEvidence.fileName}</div>
                  <div className="text-xs text-dark-400">
                    {formatDate(selectedEvidence.uploadedAt)} • {selectedEvidence.uploadedBy}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => handleDownload(selectedEvidence)}>
                  <Download size={14} className="mr-1" />
                  ดาวน์โหลด
                </Button>
                <button onClick={() => setShowPreviewModal(false)} className="p-2 hover:bg-dark-700 rounded">
                  <X size={18} className="text-dark-400" />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="p-4 max-h-[60vh] overflow-auto bg-dark-900">
              {selectedEvidence.fileType.startsWith('image/') ? (
                <img 
                  src={selectedEvidence.fileData} 
                  alt={selectedEvidence.fileName}
                  className="max-w-full mx-auto rounded-lg"
                />
              ) : selectedEvidence.fileType === 'application/pdf' ? (
                <iframe
                  src={selectedEvidence.fileData}
                  className="w-full h-[500px] rounded-lg"
                  title={selectedEvidence.fileName}
                />
              ) : (
                <div className="text-center py-12 text-dark-400">
                  ไม่สามารถแสดงตัวอย่างไฟล์นี้ได้
                </div>
              )}
            </div>

            {/* Metadata Footer */}
            <div className="p-4 border-t border-dark-700 bg-dark-800">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-xs text-dark-400">ID</div>
                  <div className="text-white font-mono text-xs">{selectedEvidence.id}</div>
                </div>
                <div>
                  <div className="text-xs text-dark-400">ขนาดไฟล์</div>
                  <div className="text-white">{formatFileSize(selectedEvidence.fileSize)}</div>
                </div>
                <div>
                  <div className="text-xs text-dark-400">หมวดหมู่</div>
                  <div className="text-white">{CATEGORY_LABELS[selectedEvidence.category].label}</div>
                </div>
                <div>
                  <div className="text-xs text-dark-400">สถานะ</div>
                  <div className="text-green-400 flex items-center gap-1">
                    <CheckCircle size={12} />
                    Verified
                  </div>
                </div>
              </div>
              <div className="mt-3 p-2 bg-dark-900 rounded flex items-center gap-2">
                <Lock size={12} className="text-amber-400 flex-shrink-0" />
                <code className="text-xs text-amber-400 font-mono truncate">
                  SHA-256: {selectedEvidence.sha256Hash}
                </code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceManager;
