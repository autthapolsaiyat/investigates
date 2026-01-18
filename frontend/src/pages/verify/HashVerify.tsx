/**
 * HashVerify v2 - หน้ายืนยัน Hash จาก QR Code
 * รองรับ 2 modes:
 * 1. ?hash=xxx - ตรวจสอบหลักฐานเดียว
 * 2. ?case=xxx - แสดงหลักฐานทั้งหมดของคดี
 */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Shield, CheckCircle, Copy, FileText, Clock, AlertTriangle, 
  Fingerprint, Lock, User, Database, Loader2
} from 'lucide-react';
import axios from 'axios';

const API_URL = 'https://investigates-api.azurewebsites.net/api/v1';

interface EvidenceData {
  file_name: string;
  file_type?: string;
  file_size?: number;
  sha256_hash: string;
  evidence_type: string;
  evidence_source: string;
  records_count?: number;
  collected_at: string;
  collector_name: string;
}

interface CaseEvidencesData {
  case_number: string;
  case_title: string;
  evidences_count: number;
  evidences: EvidenceData[];
}

interface SingleVerifyData {
  verified: boolean;
  file_name: string;
  sha256_hash: string;
  case_number: string;
  case_title: string;
  collected_at: string;
  collector_name: string;
  message: string;
}

export const HashVerify = () => {
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [singleEvidence, setSingleEvidence] = useState<SingleVerifyData | null>(null);
  const [caseEvidences, setCaseEvidences] = useState<CaseEvidencesData | null>(null);
  
  const hash = searchParams.get('hash');
  const caseNumber = searchParams.get('case');
  const mode = caseNumber ? 'case' : hash ? 'hash' : 'none';

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (mode === 'hash' && hash) {
          const response = await axios.get(`${API_URL}/evidences/public/verify/${hash}`);
          setSingleEvidence(response.data);
        } else if (mode === 'case' && caseNumber) {
          const response = await axios.get(`${API_URL}/evidences/public/case/${caseNumber}`);
          setCaseEvidences(response.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'ไม่สามารถโหลดข้อมูลได้');
      } finally {
        setLoading(false);
      }
    };
    
    if (mode !== 'none') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [mode, hash, caseNumber]);

  const copyHash = (hashValue: string) => {
    navigator.clipboard.writeText(hashValue);
    setCopied(hashValue);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('th-TH', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900/20 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 size={48} className="text-primary-400 animate-spin mx-auto mb-4" />
          <p className="text-dark-400">กำลังตรวจสอบหลักฐาน...</p>
        </div>
      </div>
    );
  }

  // Error or No params state
  if (error || mode === 'none') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-red-900/20 flex items-center justify-center p-4">
        <div className="bg-dark-800/90 backdrop-blur-xl rounded-2xl border border-red-500/30 p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={40} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {error || 'ไม่พบข้อมูล'}
          </h1>
          <p className="text-dark-400">
            {mode === 'none' 
              ? 'QR Code ไม่ถูกต้องหรือไม่มีข้อมูล'
              : 'กรุณาลองใหม่อีกครั้ง'}
          </p>
        </div>
      </div>
    );
  }

  // Case mode - แสดงหลักฐานทั้งหมดของคดี
  if (mode === 'case' && caseEvidences) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-green-900/20 p-4">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Header */}
          <div className={`bg-dark-800/90 backdrop-blur-xl rounded-2xl border border-green-500/30 shadow-2xl overflow-hidden mb-6 transition-all duration-700 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <div className="p-6 bg-gradient-to-r from-green-500/20 to-primary-500/20 border-b border-green-500/30">
              <div className="flex items-center justify-center gap-3">
                <div className="relative">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Shield size={32} className="text-green-400" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle size={14} className="text-white" />
                  </div>
                </div>
                <div className="text-left">
                  <h1 className="text-xl font-bold text-white">หลักฐานดิจิทัล</h1>
                  <p className="text-green-400 text-sm">Chain of Custody</p>
                </div>
              </div>
            </div>
            
            {/* Case Info */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <Lock size={20} className="text-red-400" />
                </div>
                <div>
                  <div className="text-xs text-dark-400">เลขที่คดี</div>
                  <div className="text-white font-bold">{caseEvidences.case_number}</div>
                </div>
              </div>
              <div className="text-dark-300 text-sm mb-4">{caseEvidences.case_title}</div>
              <div className="flex items-center gap-2 text-green-400">
                <Database size={16} />
                <span className="text-sm font-medium">{caseEvidences.evidences_count} หลักฐาน</span>
              </div>
            </div>
          </div>

          {/* Evidences List */}
          <div className="space-y-4">
            {caseEvidences.evidences.map((evidence, index) => (
              <div
                key={evidence.sha256_hash}
                className={`bg-dark-800/90 backdrop-blur-xl rounded-xl border border-dark-700 overflow-hidden transition-all duration-500`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="p-4">
                  {/* File Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                      <FileText size={20} className="text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm truncate">{evidence.file_name}</div>
                      <div className="text-xs text-dark-400 flex items-center gap-2">
                        <span>{evidence.evidence_type}</span>
                        <span>•</span>
                        <span>{formatFileSize(evidence.file_size)}</span>
                        {evidence.records_count && (
                          <>
                            <span>•</span>
                            <span>{evidence.records_count} records</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hash */}
                  <div className="bg-dark-900/50 rounded-lg p-3 border border-amber-500/30 mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Fingerprint size={14} className="text-amber-400" />
                        <span className="text-xs text-dark-400">SHA-256</span>
                      </div>
                      <button
                        onClick={() => copyHash(evidence.sha256_hash)}
                        className="p-1 hover:bg-dark-700 rounded"
                      >
                        {copied === evidence.sha256_hash ? (
                          <CheckCircle size={14} className="text-green-400" />
                        ) : (
                          <Copy size={14} className="text-dark-400" />
                        )}
                      </button>
                    </div>
                    <code className="text-xs text-amber-400 font-mono break-all">
                      {evidence.sha256_hash}
                    </code>
                  </div>

                  {/* Collector Info */}
                  <div className="flex items-center justify-between text-xs text-dark-400">
                    <div className="flex items-center gap-2">
                      <User size={12} />
                      <span>{evidence.collector_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={12} />
                      <span>{formatDate(evidence.collected_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className={`mt-6 text-center text-xs text-dark-400 transition-all duration-700 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield size={12} />
              <span>InvestiGate Investigation Platform</span>
            </div>
            <p>วิธีตรวจสอบ: นำไฟล์ต้นฉบับไปคำนวณ SHA-256 หากค่าตรงกัน = ไฟล์ไม่ถูกแก้ไข ✓</p>
          </div>
        </div>
      </div>
    );
  }

  // Hash mode - แสดงหลักฐานเดียว
  if (mode === 'hash' && singleEvidence) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-green-900/20 flex items-center justify-center p-4">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative z-10 w-full max-w-lg">
          {/* Main Card */}
          <div className="bg-dark-800/90 backdrop-blur-xl rounded-2xl border border-green-500/30 shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className={`p-6 bg-gradient-to-r from-green-500/20 to-primary-500/20 border-b border-green-500/30 transition-all duration-700 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
              <div className="flex items-center justify-center gap-3">
                <div className="relative">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Shield size={32} className="text-green-400" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle size={14} className="text-white" />
                  </div>
                </div>
                <div className="text-left">
                  <h1 className="text-xl font-bold text-white">หลักฐานถูกต้อง</h1>
                  <p className="text-green-400 text-sm">Evidence Verified ✓</p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className={`p-4 bg-green-500/10 border-b border-green-500/20 transition-all duration-700 delay-200 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
              <div className="flex items-center justify-center gap-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium">ผ่านการตรวจสอบความถูกต้อง</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* File Info */}
              <div className={`bg-dark-900/50 rounded-xl p-4 border border-dark-700 transition-all duration-500 delay-300 ${isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                    <FileText size={20} className="text-primary-400" />
                  </div>
                  <div>
                    <div className="text-xs text-dark-400">ชื่อไฟล์</div>
                    <div className="text-white font-medium text-sm">{singleEvidence.file_name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <Clock size={20} className="text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs text-dark-400">วันที่บันทึก</div>
                    <div className="text-white font-medium text-sm">{formatDate(singleEvidence.collected_at)}</div>
                  </div>
                </div>
              </div>

              {/* Hash */}
              <div className={`bg-dark-900/50 rounded-xl p-4 border border-dark-700 transition-all duration-500 delay-400 ${isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Fingerprint size={18} className="text-amber-400" />
                  <span className="text-sm font-semibold text-white">ลายนิ้วมือดิจิทัล (SHA-256)</span>
                </div>
                <div className="relative">
                  <div className="bg-dark-800 rounded-lg p-3 border border-amber-500/30">
                    <code className="text-xs text-amber-400 font-mono break-all leading-relaxed">
                      {singleEvidence.sha256_hash}
                    </code>
                  </div>
                  <button
                    onClick={() => copyHash(singleEvidence.sha256_hash)}
                    className="absolute top-2 right-2 p-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
                  >
                    {copied === singleEvidence.sha256_hash ? (
                      <CheckCircle size={16} className="text-green-400" />
                    ) : (
                      <Copy size={16} className="text-dark-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Case Info */}
              <div className={`bg-dark-900/50 rounded-xl p-4 border border-dark-700 transition-all duration-500 delay-500 ${isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <Lock size={20} className="text-red-400" />
                  </div>
                  <div>
                    <div className="text-xs text-dark-400">เลขที่คดี</div>
                    <div className="text-white font-medium">{singleEvidence.case_number}</div>
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div className={`bg-green-500/10 border border-green-500/30 rounded-xl p-4 transition-all duration-500 delay-600 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                <h3 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                  <Shield size={14} />
                  นี่คืออะไร?
                </h3>
                <p className="text-xs text-dark-300 leading-relaxed">
                  <strong>SHA-256 Hash</strong> คือ "ลายนิ้วมือดิจิทัล" ของไฟล์ 
                  ใช้ยืนยันว่าหลักฐานไม่ถูกแก้ไขหรือปลอมแปลง 
                  หากไฟล์ถูกเปลี่ยนแปลงแม้เพียง 1 ตัวอักษร ค่า Hash จะเปลี่ยนทั้งหมด
                </p>
              </div>

              <div className={`text-center text-xs text-dark-400 transition-all duration-500 delay-700 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
                <p>วิธีตรวจสอบ: นำไฟล์ต้นฉบับไปคำนวณ SHA-256</p>
                <p>หากค่าตรงกัน = ไฟล์ไม่ถูกแก้ไข ✓</p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-dark-900/50 border-t border-dark-700 text-center">
              <div className="flex items-center justify-center gap-2 text-dark-400 text-xs">
                <Shield size={12} />
                <span>InvestiGate Investigation Platform</span>
              </div>
            </div>
          </div>

          {/* Floating Badge */}
          <div className={`absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg transition-all duration-700 ${isAnimating ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}>
            ✓ VERIFIED
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default HashVerify;
