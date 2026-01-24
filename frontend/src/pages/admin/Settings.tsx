/**
 * Settings Page
 * Complete user settings with Profile, Notifications, Security, Appearance, Language
 * All features working with real API
 */
import { useState, useEffect, useRef } from 'react';
import { 
  User, Bell, Shield, Palette, Globe, Save, Loader2, 
  Check, Moon, Sun, Monitor, Camera, X, Eye, EyeOff,
  AlertCircle
} from 'lucide-react';
import { Button, Input, Card } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import type { Theme, Language, DateFormat } from '../../store/settingsStore';
import { settingsAPI, authAPI } from '../../services/api';
import { useTranslation } from '../../utils/translations';
import TwoFactorSetup from '../../components/TwoFactorSetup';

type TabType = 'profile' | 'notifications' | 'security' | 'appearance' | 'language';

// Toggle Switch Component
const Toggle = ({ checked, onChange, disabled = false }: { 
  checked: boolean; 
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) => (
  <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
    <input
      type="checkbox"
      className="sr-only peer"
      checked={checked}
      onChange={(e) => !disabled && onChange(e.target.checked)}
      disabled={disabled}
    />
    <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
  </label>
);

// Notification Item Component
const NotificationItem = ({ 
  label, 
  description, 
  checked, 
  onChange 
}: { 
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
    <div>
      <p className="font-medium">{label}</p>
      <p className="text-sm text-dark-400">{description}</p>
    </div>
    <Toggle checked={checked} onChange={onChange} />
  </div>
);

// Theme Option Component
const ThemeOption = ({ 
  id: _id, 
  label, 
  icon: Icon, 
  selected, 
  onSelect 
}: { 
  id: Theme;
  label: string;
  icon: React.ElementType;
  selected: boolean;
  onSelect: () => void;
}) => (
  <button
    onClick={onSelect}
    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
      selected
        ? 'border-primary-500 bg-primary-500/10'
        : 'border-dark-600 hover:border-dark-500'
    }`}
  >
    <Icon size={24} />
    <span className="text-sm">{label}</span>
  </button>
);

export const Settings = () => {
  const { user, updateUser } = useAuthStore();
  const settings = useSettingsStore();
  const { language } = settings;
  const tr = useTranslation(language);
  
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Profile state
  const [profile, setProfile] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Avatar state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(settings.avatar_data);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Load settings on mount
  useEffect(() => {
    settings.loadSettings();
  }, []);

  // Update avatar preview when settings change
  useEffect(() => {
    setAvatarPreview(settings.avatar_data);
  }, [settings.avatar_data]);

  // Update profile when user changes
  useEffect(() => {
    if (user) {
      setProfile({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const tabs = [
    { id: 'profile' as TabType, label: tr.t('profile'), icon: User },
    { id: 'notifications' as TabType, label: tr.t('notifications'), icon: Bell },
    { id: 'security' as TabType, label: tr.t('securitySettings').split(' ')[0], icon: Shield },
    { id: 'appearance' as TabType, label: tr.t('appearanceSettings'), icon: Palette },
    { id: 'language' as TabType, label: tr.t('language'), icon: Globe },
  ];

  // Handle profile save
  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);
    try {
      const updatedUser = await authAPI.updateProfile({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
      });
      
      updateUser(updatedUser);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle notifications save
  const handleSaveNotifications = async () => {
    setSaving(true);
    setError(null);
    try {
      await settings.saveNotifications();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save notifications');
    } finally {
      setSaving(false);
    }
  };

  // Handle appearance save
  const handleSaveAppearance = async () => {
    setSaving(true);
    setError(null);
    try {
      await settings.saveAppearance();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save appearance');
    } finally {
      setSaving(false);
    }
  };

  // Handle language save
  const handleSaveLanguage = async () => {
    setSaving(true);
    setError(null);
    try {
      await settings.saveLanguage();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save language settings');
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    // Validate
    if (passwordForm.new_password.length < 8) {
      setPasswordError(tr.t('passwordTooShort'));
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError(tr.t('passwordMismatch'));
      return;
    }

    setSaving(true);
    try {
      await settingsAPI.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password,
      });
      setPasswordSuccess(true);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (detail?.includes('incorrect') || detail?.includes('wrong')) {
        setPasswordError(tr.t('currentPasswordWrong'));
      } else {
        setPasswordError(detail || 'Failed to change password');
      }
    } finally {
      setSaving(false);
    }
  };

  // Handle avatar upload
  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }

    setUploadingAvatar(true);
    setError(null);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        setAvatarPreview(base64);
        
        try {
          await settings.uploadAvatar(base64, file.name);
        } catch (err: any) {
          setError(err.response?.data?.detail || 'Failed to upload avatar');
          setAvatarPreview(settings.avatar_data);
        }
        setUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadingAvatar(false);
      setError('Failed to read image file');
    }
  };

  // Handle avatar delete
  const handleDeleteAvatar = async () => {
    setUploadingAvatar(true);
    try {
      await settings.deleteAvatar();
      setAvatarPreview(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Get save handler for current tab
  const getSaveHandler = () => {
    switch (activeTab) {
      case 'profile': return handleSaveProfile;
      case 'notifications': return handleSaveNotifications;
      case 'appearance': return handleSaveAppearance;
      case 'language': return handleSaveLanguage;
      default: return handleSaveProfile;
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">{tr.t('settingsTitle')}</h1>
          <p className="text-dark-400 mt-1">{tr.t('settingsSubtitle')}</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}

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
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">{tr.t('profileSettings')}</h2>
                  <div className="space-y-4">
                    {/* Avatar */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative">
                        <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center overflow-hidden">
                          {avatarPreview ? (
                            <img 
                              src={avatarPreview} 
                              alt="Avatar" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-3xl text-primary-500 font-medium">
                              {profile.first_name?.charAt(0) || 'U'}
                            </span>
                          )}
                        </div>
                        {uploadingAvatar && (
                          <div className="absolute inset-0 bg-dark-900/50 rounded-full flex items-center justify-center">
                            <Loader2 className="animate-spin" size={24} />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                          >
                            <Camera size={14} className="mr-1" />
                            {tr.t('changeAvatar')}
                          </Button>
                          {avatarPreview && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={handleDeleteAvatar}
                              disabled={uploadingAvatar}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X size={14} className="mr-1" />
                              {tr.t('removeAvatar')}
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-dark-400">{tr.t('avatarHint')}</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">{tr.t('firstName')}</label>
                        <Input
                          value={profile.first_name}
                          onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">{tr.t('lastName')}</label>
                        <Input
                          value={profile.last_name}
                          onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Email (Read-only) */}
                    <div>
                      <label className="block text-sm font-medium mb-1">{tr.t('email')}</label>
                      <Input
                        type="email"
                        value={profile.email}
                        disabled
                        className="opacity-50"
                      />
                      <p className="text-xs text-dark-400 mt-1">{tr.t('emailCannotChange')}</p>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium mb-1">{tr.t('phone')}</label>
                      <Input
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder={tr.t('optional')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">{tr.t('notificationSettings')}</h2>
                <div className="space-y-4">
                  <NotificationItem
                    label={tr.t('emailNotifications')}
                    description={tr.t('emailNotificationsDesc')}
                    checked={settings.notifications.email_notifications}
                    onChange={(v) => settings.setNotificationPreference('email_notifications', v)}
                  />
                  <NotificationItem
                    label={tr.t('pushNotifications')}
                    description={tr.t('pushNotificationsDesc')}
                    checked={settings.notifications.push_notifications}
                    onChange={(v) => settings.setNotificationPreference('push_notifications', v)}
                  />
                  <NotificationItem
                    label={tr.t('caseUpdates')}
                    description={tr.t('caseUpdatesDesc')}
                    checked={settings.notifications.case_updates}
                    onChange={(v) => settings.setNotificationPreference('case_updates', v)}
                  />
                  <NotificationItem
                    label={tr.t('weeklyReport')}
                    description={tr.t('weeklyReportDesc')}
                    checked={settings.notifications.weekly_report}
                    onChange={(v) => settings.setNotificationPreference('weekly_report', v)}
                  />
                  <NotificationItem
                    label={tr.t('ticketUpdates')}
                    description={tr.t('ticketUpdatesDesc')}
                    checked={settings.notifications.ticket_updates}
                    onChange={(v) => settings.setNotificationPreference('ticket_updates', v)}
                  />
                  <NotificationItem
                    label={tr.t('systemAnnouncements')}
                    description={tr.t('systemAnnouncementsDesc')}
                    checked={settings.notifications.system_announcements}
                    onChange={(v) => settings.setNotificationPreference('system_announcements', v)}
                  />
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">{tr.t('securitySettings')}</h2>
                
                {/* Password Change Form */}
                <div className="space-y-4">
                  {passwordError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                      {passwordError}
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm flex items-center gap-2">
                      <Check size={16} />
                      {tr.t('passwordChanged')}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">{tr.t('currentPassword')}</label>
                    <div className="relative">
                      <Input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
                      >
                        {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">{tr.t('newPassword')}</label>
                    <div className="relative">
                      <Input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
                      >
                        {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">{tr.t('confirmPassword')}</label>
                    <div className="relative">
                      <Input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordForm.confirm_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
                      >
                        {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <Button 
                    variant="secondary" 
                    onClick={handleChangePassword}
                    disabled={saving || !passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password}
                  >
                    {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                    {tr.t('changePassword')}
                  </Button>
                </div>
                
                {/* 2FA Section */}
                <div className="border-t border-dark-700 pt-6">
                  <TwoFactorSetup language={settings.language} />
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">{tr.t('appearanceSettings')}</h2>
                <div>
                  <label className="block text-sm font-medium mb-3">{tr.t('theme')}</label>
                  <div className="flex gap-3">
                    <ThemeOption
                      id="light"
                      label={tr.t('themeLight')}
                      icon={Sun}
                      selected={settings.theme === 'light'}
                      onSelect={() => settings.setTheme('light')}
                    />
                    <ThemeOption
                      id="dark"
                      label={tr.t('themeDark')}
                      icon={Moon}
                      selected={settings.theme === 'dark'}
                      onSelect={() => settings.setTheme('dark')}
                    />
                    <ThemeOption
                      id="system"
                      label={tr.t('themeSystem')}
                      icon={Monitor}
                      selected={settings.theme === 'system'}
                      onSelect={() => settings.setTheme('system')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Language Tab */}
            {activeTab === 'language' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">{tr.t('languageSettings')}</h2>
                <div>
                  <label className="block text-sm font-medium mb-1">{tr.t('language')}</label>
                  <select
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                    value={settings.language}
                    onChange={(e) => settings.setLanguage(e.target.value as Language)}
                  >
                    <option value="th">ไทย (Thai)</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{tr.t('timezone')}</label>
                  <select 
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                    value={settings.timezone}
                    onChange={(e) => settings.setTimezone(e.target.value)}
                  >
                    <option value="Asia/Bangkok">(UTC+07:00) Bangkok</option>
                    <option value="Asia/Singapore">(UTC+08:00) Singapore</option>
                    <option value="Asia/Tokyo">(UTC+09:00) Tokyo</option>
                    <option value="UTC">(UTC+00:00) UTC</option>
                    <option value="America/New_York">(UTC-05:00) New York</option>
                    <option value="America/Los_Angeles">(UTC-08:00) Los Angeles</option>
                    <option value="Europe/London">(UTC+00:00) London</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{tr.t('dateFormat')}</label>
                  <select 
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                    value={settings.date_format}
                    onChange={(e) => settings.setDateFormat(e.target.value as DateFormat)}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2026-12-31)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Save Button - Show for all tabs except security (which has its own save) */}
            {activeTab !== 'security' && (
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-dark-700">
                <Button variant="ghost">{tr.t('cancel')}</Button>
                <Button onClick={getSaveHandler()} disabled={saving}>
                  {saving ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : saved ? (
                    <Check size={16} className="mr-2" />
                  ) : (
                    <Save size={16} className="mr-2" />
                  )}
                  {saved ? tr.t('saved') : tr.t('save')}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export { Settings as SettingsPage };
export default Settings;
