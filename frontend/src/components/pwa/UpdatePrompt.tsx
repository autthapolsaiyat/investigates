/**
 * UpdatePrompt - Shows notification when new version is available
 * Also provides manual update check button
 */
import { useState, useEffect } from 'react';
import { RefreshCw, X, Download, CheckCircle } from 'lucide-react';
import { swManager } from '../../utils/swManager';

interface UpdatePromptProps {
  showCheckButton?: boolean;
}

export const UpdatePrompt = ({ showCheckButton = false }: UpdatePromptProps) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<'none' | 'found' | 'uptodate' | null>(null);

  useEffect(() => {
    const handleUpdate = (event: CustomEvent<ServiceWorkerRegistration>) => {
      console.log('[UpdatePrompt] New version available');
      setRegistration(event.detail);
      setShowPrompt(true);
      setCheckResult('found');
    };

    window.addEventListener('swUpdate', handleUpdate as EventListener);

    return () => {
      window.removeEventListener('swUpdate', handleUpdate as EventListener);
    };
  }, []);

  const handleUpdate = () => {
    swManager.applyUpdate();
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  const handleCheckUpdate = async () => {
    setChecking(true);
    setCheckResult(null);
    
    try {
      const hasUpdate = await swManager.checkForUpdate();
      if (hasUpdate) {
        setCheckResult('found');
        setShowPrompt(true);
      } else {
        setCheckResult('uptodate');
        setTimeout(() => setCheckResult(null), 3000);
      }
    } catch (err) {
      console.error('Update check failed:', err);
      setCheckResult('none');
    } finally {
      setChecking(false);
    }
  };

  const handleForceRefresh = async () => {
    setChecking(true);
    await swManager.forceRefresh();
  };

  return (
    <>
      {/* Manual Check Button (optional) */}
      {showCheckButton && (
        <button
          onClick={handleCheckUpdate}
          disabled={checking}
          className="flex items-center gap-2 px-3 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-sm transition-colors disabled:opacity-50"
          title="ตรวจสอบอัพเดท"
        >
          {checking ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : checkResult === 'uptodate' ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>
            {checking 
              ? 'กำลังตรวจสอบ...' 
              : checkResult === 'uptodate' 
                ? 'เวอร์ชันล่าสุดแล้ว' 
                : 'ตรวจสอบอัพเดท'
            }
          </span>
        </button>
      )}

      {/* Update Available Banner */}
      {showPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-2xl p-4 border border-primary-500">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold">มีเวอร์ชันใหม่!</h4>
                <p className="text-primary-100 text-sm mt-1">
                  กดอัพเดทเพื่อรับฟีเจอร์และการแก้ไขล่าสุด
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleDismiss}
                    className="px-3 py-1.5 text-sm text-primary-200 hover:text-white transition-colors"
                  >
                    ภายหลัง
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="px-4 py-1.5 bg-white text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    อัพเดทเลย
                  </button>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-primary-200 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Standalone Check Update Button for Admin Settings
export const CheckUpdateButton = () => {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<'none' | 'found' | 'uptodate' | null>(null);

  const handleCheck = async () => {
    setChecking(true);
    setResult(null);
    
    try {
      const hasUpdate = await swManager.checkForUpdate();
      setResult(hasUpdate ? 'found' : 'uptodate');
      
      if (!hasUpdate) {
        setTimeout(() => setResult(null), 5000);
      }
    } catch (err) {
      console.error('Check failed:', err);
      setResult('none');
    } finally {
      setChecking(false);
    }
  };

  const handleForceRefresh = async () => {
    setChecking(true);
    await swManager.forceRefresh();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleCheck}
          disabled={checking}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 rounded-lg text-white font-medium transition-colors"
        >
          {checking ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
          {checking ? 'กำลังตรวจสอบ...' : 'ตรวจสอบอัพเดท'}
        </button>

        <button
          onClick={handleForceRefresh}
          disabled={checking}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-dark-700 hover:bg-dark-600 disabled:bg-dark-800 rounded-lg text-white font-medium transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Force Refresh
        </button>
      </div>

      {/* Result message */}
      {result === 'uptodate' && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
          <CheckCircle className="w-5 h-5" />
          <span>คุณใช้เวอร์ชันล่าสุดแล้ว!</span>
        </div>
      )}

      {result === 'found' && (
        <div className="flex items-center gap-2 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg text-primary-400">
          <Download className="w-5 h-5" />
          <span>พบเวอร์ชันใหม่! รีเฟรชหน้าเพื่ออัพเดท</span>
        </div>
      )}
    </div>
  );
};

export default UpdatePrompt;
