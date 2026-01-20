/**
 * Notifications Page (Admin)
 * Manage system notifications
 */
import { useState } from 'react';
import { 
  Bell, 
  Plus, 
  Send, 
  Users, 
  Mail, 
  AlertCircle,
  CheckCircle,
  Trash2,
  Edit2
} from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';

export const Notifications = () => {
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    target: 'all', // all, specific
  });

  // Mock notification templates
  const templates = [
    { id: 1, title: 'ยินดีต้อนรับ', message: 'ยินดีต้อนรับสู่ InvestiGate! คุณสามารถเริ่มต้นใช้งานได้ทันที', type: 'welcome' },
    { id: 2, title: 'Subscription ใกล้หมดอายุ', message: 'Subscription ของคุณจะหมดอายุใน 7 วัน กรุณาต่ออายุ', type: 'warning' },
    { id: 3, title: 'อัพเดทระบบ', message: 'ระบบจะมีการปรับปรุงในวันที่...', type: 'system' },
  ];

  // Mock sent notifications
  const sentNotifications = [
    { id: 1, title: 'ระบบอัพเดท v1.1', message: 'เพิ่มฟีเจอร์ใหม่...', sentAt: new Date().toISOString(), recipients: 45 },
    { id: 2, title: 'ยินดีต้อนรับ', message: 'ยินดีต้อนรับสมาชิกใหม่', sentAt: new Date(Date.now() - 86400000).toISOString(), recipients: 3 },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Bell className="w-7 h-7 text-primary-400" />
            Notifications
          </h1>
          <p className="text-gray-400 mt-1">ส่งการแจ้งเตือนให้ผู้ใช้</p>
        </div>
      </div>

      {/* Create Notification */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary-400" />
          สร้างการแจ้งเตือนใหม่
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">หัวข้อ</label>
            <Input
              type="text"
              placeholder="หัวข้อการแจ้งเตือน"
              value={newNotification.title}
              onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">ข้อความ</label>
            <textarea
              placeholder="เนื้อหาการแจ้งเตือน..."
              value={newNotification.message}
              onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 h-24 resize-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">ส่งถึง</label>
            <select
              value={newNotification.target}
              onChange={(e) => setNewNotification({ ...newNotification, target: e.target.value })}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">ผู้ใช้ทั้งหมด</option>
              <option value="active">เฉพาะผู้ใช้ที่ Active</option>
              <option value="expiring">Subscription ใกล้หมดอายุ</option>
            </select>
          </div>
          
          <div className="flex gap-3">
            <Button disabled={!newNotification.title || !newNotification.message}>
              <Send className="w-4 h-4 mr-2" />
              ส่งการแจ้งเตือน
            </Button>
            <Button variant="secondary">
              <Mail className="w-4 h-4 mr-2" />
              ส่งอีเมล
            </Button>
          </div>
        </div>
      </Card>

      {/* Templates */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary-400" />
          เทมเพลต
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setNewNotification({ ...newNotification, title: template.title, message: template.message })}
              className="p-4 bg-dark-800 rounded-lg text-left hover:bg-dark-700 transition-colors border border-dark-700 hover:border-primary-500/50"
            >
              <h3 className="text-white font-medium mb-1">{template.title}</h3>
              <p className="text-sm text-gray-400 line-clamp-2">{template.message}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Sent Notifications */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          การแจ้งเตือนที่ส่งแล้ว
        </h2>
        
        <div className="divide-y divide-dark-700">
          {sentNotifications.map((notif) => (
            <div key={notif.id} className="py-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium">{notif.title}</h3>
                <p className="text-sm text-gray-400 truncate">{notif.message}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {notif.recipients} คน
                  </span>
                  <span>{new Date(notif.sentAt).toLocaleString('th-TH')}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="danger">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Coming Soon Notice */}
      <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg text-center">
        <p className="text-primary-400">🚧 ระบบแจ้งเตือนกำลังพัฒนา - จะเชื่อมต่อกับ Email Service ในเร็วๆ นี้</p>
      </div>
    </div>
  );
};

export { Notifications as NotificationsPage };
