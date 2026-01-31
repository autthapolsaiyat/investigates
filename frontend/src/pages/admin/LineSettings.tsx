/**
 * LINE Settings Page
 * Configure LINE Messaging API for admin notifications
 */
import { useState, useEffect } from 'react';
import { 
  MessageCircle, Save, Loader2, Check, AlertCircle, 
  Send, Eye, EyeOff, ExternalLink, Info, RefreshCw, Download
} from 'lucide-react';
import { Button, Input, Card } from '../../components/ui';
import { CheckUpdateButton } from '../../components/pwa';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'https://investigates-api.azurewebsites.net';

interface LineConfig {
  channel_access_token: string;
  admin_user_id: string;
  enabled: boolean;
}

export const LineSettings = () => {
  const [config, setConfig] = useState<LineConfig>({
    channel_access_token: '',
    admin_user_id: '',
    enabled: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showToken, setShowToken] = useState(false);

  // Load config from API
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/v1/settings/line`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfig({
          channel_access_token: data.channel_access_token || '',
          admin_user_id: data.admin_user_id || '',
          enabled: data.enabled || false
        });
      }
    } catch (err) {
      console.error('Failed to load LINE config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaved(false);
      setError(null);
      
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/v1/settings/line`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfig({
          channel_access_token: data.channel_access_token || '',
          admin_user_id: data.admin_user_id || '',
          enabled: data.enabled || false
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to save settings');
      }
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config.channel_access_token) {
      setTestResult({ success: false, message: 'กรุณาใส่ Channel Access Token ก่อน' });
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);
      
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/v1/settings/line/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel_access_token: config.channel_access_token,
          admin_user_id: config.admin_user_id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTestResult({ success: true, message: 'ส่งข้อความทดสอบสำเร็จ! เช็ค LINE ของคุณ' });
      } else {
        setTestResult({ 
          success: false, 
          message: data.detail || 'ส่งไม่สำเร็จ กรุณาตรวจสอบ Token' 
        });
      }
    } catch (err) {
      setTestResult({ success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-green-400" />
          </div>
          LINE Notification Settings
        </h1>
        <p className="text-dark-400 mt-2">
          ตั้งค่าการแจ้งเตือนผ่าน LINE เมื่อมีผู้สมัครใหม่
        </p>
      </div>

      {/* Instructions */}
      <Card className="p-4 bg-blue-500/10 border-blue-500/20">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-400 mb-2">วิธีตั้งค่า LINE Messaging API:</p>
            <ol className="list-decimal list-inside space-y-1 text-dark-300">
              <li>ไปที่ <a href="https://developers.line.biz/console/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">LINE Developers Console <ExternalLink size={12} /></a></li>
              <li>สร้าง Provider และ Messaging API Channel (หรือใช้ที่มีอยู่)</li>
              <li>Copy <strong>Channel Access Token</strong> (Long-lived) มาใส่ด้านล่าง</li>
              <li>เพิ่ม LINE Official Account เป็นเพื่อน</li>
              <li>(Optional) ใส่ User ID ถ้าต้องการส่งหา Admin คนเดียว</li>
            </ol>
          </div>
        </div>
      </Card>

      {/* Settings Form */}
      <Card className="p-6 space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
          <div>
            <p className="font-medium">เปิดใช้งานการแจ้งเตือน LINE</p>
            <p className="text-sm text-dark-400">เมื่อมีผู้สมัครใหม่จะส่งแจ้งเตือนไปยัง LINE</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            />
            <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>

        {/* Channel Access Token */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Channel Access Token (Long-lived) <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Input
              type={showToken ? 'text' : 'password'}
              value={config.channel_access_token}
              onChange={(e) => setConfig({ ...config, channel_access_token: e.target.value })}
              placeholder="ใส่ Channel Access Token จาก LINE Developers"
              className="pr-10 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
            >
              {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Admin User ID */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Admin User ID <span className="text-dark-500">(Optional)</span>
          </label>
          <Input
            value={config.admin_user_id}
            onChange={(e) => setConfig({ ...config, admin_user_id: e.target.value })}
            placeholder="U1234567890abcdef... (เริ่มด้วย U)"
            className="font-mono text-sm"
          />
          <p className="text-xs text-dark-500 mt-1">
            ถ้าไม่ใส่ จะส่ง broadcast หาทุกคนที่เป็นเพื่อนกับ OA
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Test Result */}
        {testResult && (
          <div className={`p-3 rounded-lg flex items-center gap-2 ${
            testResult.success 
              ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {testResult.success ? <Check size={18} /> : <AlertCircle size={18} />}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            onClick={handleTest}
            disabled={testing || !config.channel_access_token}
            variant="secondary"
            className="flex-1"
          >
            {testing ? (
              <Loader2 size={18} className="animate-spin mr-2" />
            ) : (
              <Send size={18} className="mr-2" />
            )}
            ทดสอบส่งข้อความ
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin mr-2" />
            ) : saved ? (
              <Check size={18} className="mr-2" />
            ) : (
              <Save size={18} className="mr-2" />
            )}
            {saved ? 'บันทึกแล้ว!' : 'บันทึกการตั้งค่า'}
          </Button>
        </div>
      </Card>

      {/* What notifications */}
      <Card className="p-6">
        <h3 className="font-medium mb-4">การแจ้งเตือนที่จะได้รับ:</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-dark-700 rounded-lg">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🆕</span>
            </div>
            <div>
              <p className="font-medium">ผู้สมัครใหม่</p>
              <p className="text-sm text-dark-400">แจ้งเตือนทันทีเมื่อมีคนสมัครสมาชิกใหม่ พร้อมข้อมูลชื่อ อีเมล หน่วยงาน</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-dark-700 rounded-lg opacity-50">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🎫</span>
            </div>
            <div>
              <p className="font-medium">Support Ticket ใหม่ <span className="text-xs text-dark-500">(เร็วๆ นี้)</span></p>
              <p className="text-sm text-dark-400">แจ้งเตือนเมื่อมี Support Ticket ใหม่เข้ามา</p>
            </div>
          </div>
        </div>
      </Card>

      {/* App Update Section */}
      <Card className="p-6">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-primary-400" />
          ตรวจสอบอัพเดทแอป
        </h3>
        <p className="text-sm text-dark-400 mb-4">
          ตรวจสอบและอัพเดทแอปเป็นเวอร์ชันล่าสุด
        </p>
        <CheckUpdateButton />
      </Card>
    </div>
  );
};

export default LineSettings;
