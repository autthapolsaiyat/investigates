/**
 * Notifications Page (Admin)
 * Manage system notifications with real API
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  Bell, Plus, Send, Users, Mail, AlertCircle, CheckCircle, Trash2, Edit2,
  RefreshCw, Eye, EyeOff, X, Clock, TrendingUp, MessageSquare
} from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import { 
  notificationsAPI, 
  type NotificationItem, 
  type NotificationTemplate, 
  type NotificationStats 
} from '../../services/api';

const priorityColors: Record<string, string> = {
  low: 'bg-gray-500/20 text-gray-400',
  normal: 'bg-blue-500/20 text-blue-400',
  high: 'bg-orange-500/20 text-orange-400',
  urgent: 'bg-red-500/20 text-red-400',
};

const typeLabels: Record<string, string> = {
  system: 'ระบบ',
  welcome: 'ต้อนรับ',
  subscription: 'Subscription',
  case: 'คดี',
  ticket: 'Ticket',
  alert: 'แจ้งเตือน',
};

export const Notifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<number | null>(null);
  
  // Create form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    notification_type: 'system',
    priority: 'normal',
    target_audience: 'all',
  });
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [notifsRes, templatesRes, statsRes] = await Promise.all([
        notificationsAPI.list({ page: 1, page_size: 50 }),
        notificationsAPI.getTemplates(),
        notificationsAPI.getStats(),
      ]);
      
      setNotifications(notifsRes.items);
      setTemplates(templatesRes.templates);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async () => {
    if (!formData.title || !formData.message) return;
    
    setCreating(true);
    try {
      await notificationsAPI.create(formData);
      setFormData({
        title: '',
        message: '',
        notification_type: 'system',
        priority: 'normal',
        target_audience: 'all',
      });
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error('Failed to create notification:', err);
      alert('ไม่สามารถสร้างการแจ้งเตือนได้');
    } finally {
      setCreating(false);
    }
  };

  const handleSend = async (id: number) => {
    if (!confirm('ต้องการส่งการแจ้งเตือนนี้ไปยังผู้ใช้ที่เลือกหรือไม่?')) return;
    
    setSending(id);
    try {
      await notificationsAPI.send(id);
      loadData();
    } catch (err) {
      console.error('Failed to send notification:', err);
      alert('ไม่สามารถส่งการแจ้งเตือนได้');
    } finally {
      setSending(null);
    }
  };

  const handleToggleActive = async (notif: NotificationItem) => {
    try {
      await notificationsAPI.update(notif.id, { is_active: !notif.is_active });
      loadData();
    } catch (err) {
      console.error('Failed to toggle notification:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('ต้องการลบการแจ้งเตือนนี้หรือไม่?')) return;
    
    try {
      await notificationsAPI.delete(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete notification:', err);
      alert('ไม่สามารถลบการแจ้งเตือนได้');
    }
  };

  const useTemplate = (template: NotificationTemplate) => {
    setFormData({
      ...formData,
      title: template.title,
      message: template.message,
      notification_type: template.notification_type,
    });
    setShowForm(true);
  };

  const sentNotifications = notifications.filter(n => n.sent_at);
  const draftNotifications = notifications.filter(n => !n.sent_at);

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
        <div className="flex gap-2">
          <Button variant="secondary" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            สร้างใหม่
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Send className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total_sent}</p>
                <p className="text-sm text-gray-400">ส่งแล้ว</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total_active}</p>
                <p className="text-sm text-gray-400">Active</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total_read}</p>
                <p className="text-sm text-gray-400">อ่านแล้ว</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.read_rate}%</p>
                <p className="text-sm text-gray-400">อัตราอ่าน</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Create Form Modal */}
      {showForm && (
        <Card className="p-5 border-primary-500/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary-400" />
              สร้างการแจ้งเตือนใหม่
            </h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">หัวข้อ *</label>
              <Input
                type="text"
                placeholder="หัวข้อการแจ้งเตือน"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">ข้อความ *</label>
              <textarea
                placeholder="เนื้อหาการแจ้งเตือน..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 h-24 resize-none"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">ประเภท</label>
                <select
                  value={formData.notification_type}
                  onChange={(e) => setFormData({ ...formData, notification_type: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                >
                  <option value="system">ระบบ</option>
                  <option value="welcome">ต้อนรับ</option>
                  <option value="subscription">Subscription</option>
                  <option value="alert">แจ้งเตือน</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">ความสำคัญ</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                >
                  <option value="low">ต่ำ</option>
                  <option value="normal">ปกติ</option>
                  <option value="high">สูง</option>
                  <option value="urgent">ด่วน</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">ส่งถึง</label>
                <select
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                >
                  <option value="all">ผู้ใช้ทั้งหมด</option>
                  <option value="active">เฉพาะผู้ใช้ Active</option>
                  <option value="expiring">Subscription ใกล้หมด</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleCreate}
                disabled={!formData.title || !formData.message || creating}
              >
                {creating ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                สร้าง (บันทึกเป็น Draft)
              </Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                ยกเลิก
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Templates */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary-400" />
          เทมเพลต
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => useTemplate(template)}
              className="p-4 bg-dark-800 rounded-lg text-left hover:bg-dark-700 transition-colors border border-dark-700 hover:border-primary-500/50"
            >
              <h3 className="text-white font-medium mb-1 text-sm">{template.title}</h3>
              <p className="text-xs text-gray-400 line-clamp-2">{template.message}</p>
              <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-dark-600 rounded text-gray-300">
                {typeLabels[template.notification_type] || template.notification_type}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Draft Notifications */}
      {draftNotifications.length > 0 && (
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-yellow-400" />
            Draft ({draftNotifications.length})
          </h2>
          
          <div className="divide-y divide-dark-700">
            {draftNotifications.map((notif) => (
              <div key={notif.id} className="py-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-medium">{notif.title}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded ${priorityColors[notif.priority]}`}>
                      {notif.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 truncate">{notif.message}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{typeLabels[notif.notification_type] || notif.notification_type}</span>
                    <span>→ {notif.target_audience === 'all' ? 'ทุกคน' : notif.target_audience}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.created_at).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleSend(notif.id)}
                    disabled={sending === notif.id}
                  >
                    {sending === notif.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(notif.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sent Notifications */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          ส่งแล้ว ({sentNotifications.length})
        </h2>
        
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary-400" />
            <p className="text-gray-400 mt-2">กำลังโหลด...</p>
          </div>
        ) : sentNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 mx-auto text-gray-600" />
            <p className="text-gray-400 mt-2">ยังไม่มีการแจ้งเตือนที่ส่งแล้ว</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-700">
            {sentNotifications.map((notif) => (
              <div key={notif.id} className="py-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-medium">{notif.title}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded ${priorityColors[notif.priority]}`}>
                      {notif.priority}
                    </span>
                    {!notif.is_active && (
                      <span className="px-2 py-0.5 text-xs rounded bg-gray-500/20 text-gray-400">
                        ปิดใช้งาน
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 truncate">{notif.message}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {notif.recipients_count} คน
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {notif.read_count} อ่าน
                    </span>
                    <span>{notif.sent_at ? new Date(notif.sent_at).toLocaleString('th-TH') : '-'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => handleToggleActive(notif)}
                    title={notif.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                  >
                    {notif.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(notif.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export { Notifications as NotificationsPage };
