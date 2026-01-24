/**
 * Two-Factor Authentication Setup Component
 * Used in Settings page for enabling/disabling 2FA
 */
import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldOff, Copy, Check, RefreshCw, AlertCircle, Key, Smartphone } from 'lucide-react';
import { Button, Input, Card } from '../../components/ui';
import { twoFactorAPI } from '../../services/api';
import type { TwoFAStatus, TwoFASetupResponse } from '../../services/api';

interface TwoFactorSetupProps {
  language?: 'th' | 'en';
}

const translations = {
  th: {
    title: 'การยืนยันตัวตนสองขั้นตอน',
    description: 'เพิ่มความปลอดภัยให้บัญชีด้วยการยืนยันตัวตนสองขั้นตอน',
    enabled: 'เปิดใช้งานแล้ว',
    disabled: 'ยังไม่ได้เปิดใช้งาน',
    enabledAt: 'เปิดใช้งานเมื่อ',
    enable: 'เปิดใช้งาน 2FA',
    disable: 'ปิดการใช้งาน 2FA',
    setup: 'ตั้งค่า 2FA',
    scanQR: 'สแกน QR Code ด้วยแอป Google Authenticator',
    orEnterManually: 'หรือใส่รหัสนี้ด้วยตนเอง',
    enterCode: 'ใส่รหัส 6 หลักจากแอป',
    verify: 'ยืนยัน',
    cancel: 'ยกเลิก',
    backupCodes: 'รหัสสำรอง',
    backupCodesDesc: 'เก็บรหัสเหล่านี้ไว้ในที่ปลอดภัย ใช้สำหรับเข้าระบบเมื่อไม่สามารถเข้าถึงแอป Authenticator ได้',
    copyAll: 'คัดลอกทั้งหมด',
    copied: 'คัดลอกแล้ว',
    done: 'เสร็จสิ้น',
    confirmDisable: 'ยืนยันการปิด 2FA',
    enterPassword: 'ใส่รหัสผ่านเพื่อยืนยัน',
    enter2FACode: 'ใส่รหัส 2FA หรือรหัสสำรอง',
    regenerateCodes: 'สร้างรหัสสำรองใหม่',
    loading: 'กำลังโหลด...',
    error: 'เกิดข้อผิดพลาด',
    success: 'สำเร็จ',
    invalidCode: 'รหัสไม่ถูกต้อง',
    step1: 'ขั้นตอนที่ 1: ติดตั้งแอป',
    step1Desc: 'ดาวน์โหลด Google Authenticator หรือ Authy บนมือถือ',
    step2: 'ขั้นตอนที่ 2: สแกน QR Code',
    step3: 'ขั้นตอนที่ 3: ใส่รหัสยืนยัน',
  },
  en: {
    title: 'Two-Factor Authentication',
    description: 'Add an extra layer of security to your account',
    enabled: 'Enabled',
    disabled: 'Not enabled',
    enabledAt: 'Enabled at',
    enable: 'Enable 2FA',
    disable: 'Disable 2FA',
    setup: 'Setup 2FA',
    scanQR: 'Scan this QR code with Google Authenticator',
    orEnterManually: 'Or enter this code manually',
    enterCode: 'Enter 6-digit code from app',
    verify: 'Verify',
    cancel: 'Cancel',
    backupCodes: 'Backup Codes',
    backupCodesDesc: 'Store these codes safely. Use them to login when you cannot access your Authenticator app.',
    copyAll: 'Copy All',
    copied: 'Copied',
    done: 'Done',
    confirmDisable: 'Confirm Disable 2FA',
    enterPassword: 'Enter your password to confirm',
    enter2FACode: 'Enter 2FA code or backup code',
    regenerateCodes: 'Regenerate Backup Codes',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    invalidCode: 'Invalid code',
    step1: 'Step 1: Install App',
    step1Desc: 'Download Google Authenticator or Authy on your phone',
    step2: 'Step 2: Scan QR Code',
    step3: 'Step 3: Enter Verification Code',
  },
};

export default function TwoFactorSetup({ language = 'th' }: TwoFactorSetupProps) {
  const t = translations[language];
  
  const [status, setStatus] = useState<TwoFAStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Setup flow state
  const [setupMode, setSetupMode] = useState(false);
  const [setupData, setSetupData] = useState<TwoFASetupResponse | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  
  // Backup codes
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Disable flow
  const [disableMode, setDisableMode] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disabling, setDisabling] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await twoFactorAPI.getStatus();
      setStatus(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load 2FA status');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSetup = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await twoFactorAPI.setup();
      setSetupData(data);
      setSetupMode(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      setError(t.invalidCode);
      return;
    }
    
    try {
      setVerifying(true);
      setError(null);
      const result = await twoFactorAPI.verify(verifyCode);
      setBackupCodes(result.backup_codes);
      setShowBackupCodes(true);
      setSetupMode(false);
      setSetupData(null);
      setVerifyCode('');
      loadStatus();
    } catch (err: any) {
      setError(err.response?.data?.detail || t.invalidCode);
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable = async () => {
    try {
      setDisabling(true);
      setError(null);
      await twoFactorAPI.disable(disablePassword, disableCode || undefined);
      setDisableMode(false);
      setDisablePassword('');
      setDisableCode('');
      loadStatus();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to disable 2FA');
    } finally {
      setDisabling(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancelSetup = () => {
    setSetupMode(false);
    setSetupData(null);
    setVerifyCode('');
    setError(null);
  };

  if (loading && !setupMode && !disableMode) {
    return (
      <div className="p-4 text-center">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary-400" />
        <p className="text-dark-400 mt-2">{t.loading}</p>
      </div>
    );
  }

  // Backup codes modal
  if (showBackupCodes) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-green-400">
          <ShieldCheck className="w-6 h-6" />
          <h3 className="text-lg font-semibold">{t.success}!</h3>
        </div>
        
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <h4 className="font-medium text-yellow-400 flex items-center gap-2 mb-2">
            <Key className="w-4 h-4" />
            {t.backupCodes}
          </h4>
          <p className="text-dark-300 text-sm mb-4">{t.backupCodesDesc}</p>
          
          <div className="grid grid-cols-2 gap-2 mb-4">
            {backupCodes.map((code, i) => (
              <div key={i} className="font-mono text-sm bg-dark-800 p-2 rounded text-center">
                {code}
              </div>
            ))}
          </div>
          
          <Button variant="secondary" size="sm" onClick={copyBackupCodes}>
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? t.copied : t.copyAll}
          </Button>
        </div>
        
        <Button onClick={() => setShowBackupCodes(false)}>
          {t.done}
        </Button>
      </div>
    );
  }

  // Setup mode
  if (setupMode && setupData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Smartphone className="w-6 h-6 text-primary-400" />
          <h3 className="text-lg font-semibold">{t.setup}</h3>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Step 1 */}
        <div className="p-4 bg-dark-800 rounded-lg">
          <h4 className="font-medium mb-2">{t.step1}</h4>
          <p className="text-dark-400 text-sm">{t.step1Desc}</p>
        </div>

        {/* Step 2 - QR Code */}
        <div className="p-4 bg-dark-800 rounded-lg">
          <h4 className="font-medium mb-4">{t.step2}</h4>
          <p className="text-dark-400 text-sm mb-4">{t.scanQR}</p>
          
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white rounded-lg">
              <img 
                src={`data:image/png;base64,${setupData.qr_code}`} 
                alt="2FA QR Code" 
                className="w-48 h-48"
              />
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-dark-400 text-sm mb-2">{t.orEnterManually}</p>
            <div className="flex items-center justify-center gap-2">
              <code className="bg-dark-700 px-3 py-1 rounded text-sm font-mono">
                {setupData.secret}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(setupData.secret)}
                className="p-1 hover:text-primary-400"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Step 3 - Verify */}
        <div className="p-4 bg-dark-800 rounded-lg">
          <h4 className="font-medium mb-4">{t.step3}</h4>
          <p className="text-dark-400 text-sm mb-4">{t.enterCode}</p>
          
          <div className="flex gap-3">
            <Input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="font-mono text-center text-lg tracking-widest"
              maxLength={6}
            />
            <Button onClick={handleVerify} disabled={verifying || verifyCode.length !== 6}>
              {verifying ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
              {t.verify}
            </Button>
          </div>
        </div>

        <Button variant="secondary" onClick={handleCancelSetup}>
          {t.cancel}
        </Button>
      </div>
    );
  }

  // Disable mode
  if (disableMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-red-400">
          <ShieldOff className="w-6 h-6" />
          <h3 className="text-lg font-semibold">{t.confirmDisable}</h3>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">{t.enterPassword}</label>
          <Input
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t.enter2FACode}</label>
          <Input
            type="text"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value)}
            placeholder="000000 หรือ XXXX-XXXX"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => { setDisableMode(false); setError(null); }}>
            {t.cancel}
          </Button>
          <Button variant="danger" onClick={handleDisable} disabled={disabling || !disablePassword}>
            {disabling ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
            {t.disable}
          </Button>
        </div>
      </div>
    );
  }

  // Main view - status
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Shield className={`w-6 h-6 ${status?.enabled ? 'text-green-400' : 'text-dark-400'}`} />
        <div>
          <h3 className="font-medium">{t.title}</h3>
          <p className="text-dark-400 text-sm">{t.description}</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="p-4 bg-dark-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {status?.enabled ? (
              <ShieldCheck className="w-8 h-8 text-green-400" />
            ) : (
              <ShieldOff className="w-8 h-8 text-dark-500" />
            )}
            <div>
              <p className={`font-medium ${status?.enabled ? 'text-green-400' : 'text-dark-300'}`}>
                {status?.enabled ? t.enabled : t.disabled}
              </p>
              {status?.enabled && status.enabled_at && (
                <p className="text-dark-500 text-sm">
                  {t.enabledAt}: {new Date(status.enabled_at).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')}
                </p>
              )}
            </div>
          </div>

          {status?.enabled ? (
            <Button variant="danger" size="sm" onClick={() => setDisableMode(true)}>
              {t.disable}
            </Button>
          ) : (
            <Button onClick={handleStartSetup} disabled={loading}>
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
              {t.enable}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
