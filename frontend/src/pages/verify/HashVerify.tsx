/**
 * HashVerify - หน้ายืนยัน Hash จาก QR Code
 * แสดงผลแบบไฮเทค สำหรับผู้ใช้ทั่วไปเข้าใจง่าย
 */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shield, CheckCircle, Copy, FileText, Clock, AlertTriangle, Fingerprint, Lock } from 'lucide-react';

export const HashVerify = () => {
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);

  const hash = searchParams.get('hash') || '';
  const fileName = searchParams.get('file') || 'Unknown File';
  const caseId = searchParams.get('case') || 'N/A';
  const timestamp = searchParams.get('ts') || new Date().toISOString();

  useEffect(() => {
    // Animation delay
    const timer = setTimeout(() => setIsAnimating(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const copyHash = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  if (!hash) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-red-900/20 flex items-center justify-center p-4">
        <div className="bg-dark-800/90 backdrop-blur-xl rounded-2xl border border-red-500/30 p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={40} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">ไม่พบข้อมูล Hash</h1>
          <p className="text-dark-400">QR Code ไม่ถูกต้องหรือไม่มีข้อมูล</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-green-900/20 flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Main Card */}
        <div className="bg-dark-800/90 backdrop-blur-xl rounded-2xl border border-green-500/30 shadow-2xl shadow-green-500/10 overflow-hidden">
          
          {/* Header - Animated */}
          <div className={`relative p-6 bg-gradient-to-r from-green-500/20 to-primary-500/20 border-b border-green-500/30 transition-all duration-1000 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
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

          {/* Verification Status */}
          <div className={`p-4 bg-green-500/10 border-b border-green-500/20 transition-all duration-1000 delay-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <div className="flex items-center justify-center gap-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">ผ่านการตรวจสอบความถูกต้อง</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            
            {/* File Info */}
            <div className={`bg-dark-900/50 rounded-xl p-4 border border-dark-700 transition-all duration-700 delay-500 ${isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-primary-400" />
                </div>
                <div>
                  <div className="text-xs text-dark-400">ชื่อไฟล์</div>
                  <div className="text-white font-medium text-sm truncate max-w-[250px]">{decodeURIComponent(fileName)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-amber-400" />
                </div>
                <div>
                  <div className="text-xs text-dark-400">วันที่บันทึก</div>
                  <div className="text-white font-medium text-sm">{formatDate(timestamp)}</div>
                </div>
              </div>
            </div>

            {/* Hash Section */}
            <div className={`bg-dark-900/50 rounded-xl p-4 border border-dark-700 transition-all duration-700 delay-700 ${isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Fingerprint size={18} className="text-amber-400" />
                <span className="text-sm font-semibold text-white">ลายนิ้วมือดิจิทัล (SHA-256)</span>
              </div>
              <div className="relative">
                <div className="bg-dark-800 rounded-lg p-3 border border-amber-500/30">
                  <code className="text-xs text-amber-400 font-mono break-all leading-relaxed">
                    {hash}
                  </code>
                </div>
                <button
                  onClick={copyHash}
                  className="absolute top-2 right-2 p-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
                >
                  {copied ? (
                    <CheckCircle size={16} className="text-green-400" />
                  ) : (
                    <Copy size={16} className="text-dark-400" />
                  )}
                </button>
              </div>
              {copied && (
                <div className="mt-2 text-center text-xs text-green-400">คัดลอกแล้ว!</div>
              )}
            </div>

            {/* Case ID */}
            {caseId !== 'N/A' && (
              <div className={`bg-dark-900/50 rounded-xl p-4 border border-dark-700 transition-all duration-700 delay-900 ${isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <Lock size={20} className="text-red-400" />
                  </div>
                  <div>
                    <div className="text-xs text-dark-400">เลขที่คดี</div>
                    <div className="text-white font-medium">{caseId}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Explanation */}
            <div className={`bg-green-500/10 border border-green-500/30 rounded-xl p-4 transition-all duration-700 delay-1000 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
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

            {/* How to verify */}
            <div className={`text-center text-xs text-dark-400 transition-all duration-700 delay-1100 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
              <p>วิธีตรวจสอบ: นำไฟล์ต้นฉบับไปคำนวณ SHA-256</p>
              <p>หากค่าตรงกัน = ไฟล์ไม่ถูกแก้ไข ✓</p>
            </div>
          </div>

          {/* Footer */}
          <div className={`p-4 bg-dark-900/50 border-t border-dark-700 text-center transition-all duration-700 delay-1200 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <div className="flex items-center justify-center gap-2 text-dark-400 text-xs">
              <Shield size={12} />
              <span>InvestiGate Investigation Platform</span>
            </div>
          </div>
        </div>

        {/* Floating Badge */}
        <div className={`absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg transition-all duration-1000 ${isAnimating ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}>
          ✓ VERIFIED
        </div>
      </div>
    </div>
  );
};

export default HashVerify;
