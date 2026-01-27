/**
 * UpdatePrompt - Shows notification when new version is available
 */
import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

export const UpdatePrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const handleUpdate = (event: CustomEvent<ServiceWorkerRegistration>) => {
      console.log('[UpdatePrompt] New version available');
      setRegistration(event.detail);
      setShowPrompt(true);
    };

    window.addEventListener('swUpdate', handleUpdate as EventListener);

    return () => {
      window.removeEventListener('swUpdate', handleUpdate as EventListener);
    };
  }, []);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      // Tell SW to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload page after SW takes over
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    } else {
      // Fallback: just reload
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
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
  );
};

export default UpdatePrompt;
