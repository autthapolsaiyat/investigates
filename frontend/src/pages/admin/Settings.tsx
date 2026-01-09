/**
 * Settings Page
 * User and application settings
 */
import { useState } from 'react';
import { 
  User, Bell, Shield, Palette, Globe, Save, Loader2, 
  Check, Moon, Sun, Monitor
} from 'lucide-react';
import { Button, Input, Card } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';

type TabType = 'profile' | 'notifications' | 'security' | 'appearance' | 'language';

export const Settings = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [profile, setProfile] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [notifications, setNotifications] = useState({
    email_notifications: true,
    push_notifications: true,
    case_updates: true,
    weekly_report: false,
  });

  const [appearance, setAppearance] = useState({
    theme: 'dark',
    language: 'th',
  });

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'profile' as TabType, label: 'Profile', icon: User },
    { id: 'notifications' as TabType, label: 'Notifications', icon: Bell },
    { id: 'security' as TabType, label: 'Security', icon: Shield },
    { id: 'appearance' as TabType, label: 'Appearance', icon: Palette },
    { id: 'language' as TabType, label: 'Language', icon: Globe },
  ];

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-dark-400 mt-1">Manage your account and application preferences</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-48 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-primary-500/20 text-primary-400' 
                    : 'text-dark-400 hover:text-white hover:bg-dark-700'
                }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <Card className="flex-1 p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center">
                        <span className="text-3xl text-primary-500 font-medium">
                          {profile.first_name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <Button variant="secondary" size="sm">Change Avatar</Button>
                        <p className="text-sm text-dark-400 mt-1">JPG, PNG up to 2MB</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">First Name</label>
                        <Input
                          value={profile.first_name}
                          onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Last Name</label>
                        <Input
                          value={profile.last_name}
                          onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <Input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        disabled
                        className="opacity-50"
                      />
                      <p className="text-xs text-dark-400 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone</label>
                      <Input
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>
                <div className="space-y-4">
                  {[
                    { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                    { key: 'push_notifications', label: 'Push Notifications', desc: 'Receive browser push notifications' },
                    { key: 'case_updates', label: 'Case Updates', desc: 'Get notified when cases are updated' },
                    { key: 'weekly_report', label: 'Weekly Report', desc: 'Receive weekly summary report' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-dark-400">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notifications[item.key as keyof typeof notifications]}
                          onChange={(e) => setNotifications({ 
                            ...notifications, 
                            [item.key]: e.target.checked 
                          })}
                        />
                        <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">Security Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Current Password</label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">New Password</label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                  <Button variant="secondary">Change Password</Button>
                </div>
                <div className="border-t border-dark-700 pt-6">
                  <h3 className="font-medium mb-4">Two-Factor Authentication</h3>
                  <p className="text-dark-400 text-sm mb-4">
                    Add an extra layer of security to your account by enabling two-factor authentication.
                  </p>
                  <Button variant="secondary">Enable 2FA</Button>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">Appearance</h2>
                <div>
                  <label className="block text-sm font-medium mb-3">Theme</label>
                  <div className="flex gap-3">
                    {[
                      { id: 'light', label: 'Light', icon: Sun },
                      { id: 'dark', label: 'Dark', icon: Moon },
                      { id: 'system', label: 'System', icon: Monitor },
                    ].map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => setAppearance({ ...appearance, theme: theme.id })}
                        className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                          appearance.theme === theme.id
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-dark-600 hover:border-dark-500'
                        }`}
                      >
                        <theme.icon size={24} />
                        <span className="text-sm">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'language' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">Language & Region</h2>
                <div>
                  <label className="block text-sm font-medium mb-1">Language</label>
                  <select
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
                    value={appearance.language}
                    onChange={(e) => setAppearance({ ...appearance, language: e.target.value })}
                  >
                    <option value="th">ไทย (Thai)</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Timezone</label>
                  <select className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white">
                    <option value="Asia/Bangkok">(UTC+07:00) Bangkok</option>
                    <option value="UTC">(UTC+00:00) UTC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date Format</label>
                  <select className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white">
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-dark-700">
              <Button variant="ghost">Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : saved ? (
                  <Check size={16} className="mr-2" />
                ) : (
                  <Save size={16} className="mr-2" />
                )}
                {saved ? 'Saved!' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export { Settings as SettingsPage };
export default Settings;
