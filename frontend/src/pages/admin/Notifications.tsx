/**
 * Notifications Page (Admin)
 * Manage system notifications with real API
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  Bell, Plus, Send, Users, CheckCircle, Trash2, Edit2,
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
  system: 'System',
  welcome: 'Welcome',
  subscription: 'Subscription',
  case: 'Case',
  ticket: 'Ticket',
  alert: 'Alert',
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
      
      setNotifications(notifsRes.items || []);
      setTemplates(Array.isArray(templatesRes) ? templatesRes : (templatesRes.templates || []));
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
      alert('Cannot create notification');
    } finally {
      setCreating(false);
    }
  };

  const handleSend = async (id: number) => {
    if (!confirm('Do you want to send this notification to selected users?')) return;
    
    setSending(id);
    try {
      await notificationsAPI.send(id);
      loadData();
    } catch (err) {
      console.error('Failed to send notification:', err);
      alert('Cannot send notification');
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
    if (!confirm('Do you want to delete this notification?')) return;
    
    try {
      await notificationsAPI.delete(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete notification:', err);
      alert('Cannot delete notification');
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
          <p className="text-gray-400 mt-1">Send notifications to users</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create New
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
                <p className="text-2xl font-bold text-white">{stats.sent_count || 0}</p>
                <p className="text-sm text-gray-400">Sent</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.active || 0}</p>
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
                <p className="text-2xl font-bold text-white">{Math.round((stats.sent_count || 0) * (stats.read_rate || 0) / 100)}</p>
                <p className="text-sm text-gray-400">Read</p>
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
                <p className="text-sm text-gray-400">Read Rate</p>
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
              Create New Notification
            </h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
              <Input
                type="text"
                placeholder="Notification title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Message *</label>
              <textarea
                placeholder="Notification content..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 h-24 resize-none"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                <select
                  value={formData.notification_type}
                  onChange={(e) => setFormData({ ...formData, notification_type: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                >
                  <option value="system">System</option>
                  <option value="welcome">Welcome</option>
                  <option value="subscription">Subscription</option>
                  <option value="alert">Alert</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Sendto</label>
                <select
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active Users Only</option>
                  <option value="expiring">Subscription expiring</option>
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
                Create (Save as Draft)
              </Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Templates */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary-400" />
          Templates
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
                    <span>→ {notif.target_audience === 'all' ? 'Everyone' : notif.target_audience}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.created_at).toLocaleDateString('en-US')}
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
          Sent ({sentNotifications.length})
        </h2>
        
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary-400" />
            <p className="text-gray-400 mt-2">Loading...</p>
          </div>
        ) : sentNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 mx-auto text-gray-600" />
            <p className="text-gray-400 mt-2">No notifications sent yet</p>
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
                        Deactivate
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 truncate">{notif.message}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {notif.recipients_count} users
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {notif.read_count} read
                    </span>
                    <span>{notif.sent_at ? new Date(notif.sent_at).toLocaleString('en-US') : '-'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => handleToggleActive(notif)}
                    title={notif.is_active ? 'Deactivate' : 'เDeactivate'}
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
