/**
 * User Settings Page
 * Settings for regular users: Profile, Security (2FA), Appearance, Language
 */
import { useState, useEffect, useRef } from 'react';
import { 
  User, Shield, Palette, Globe, Save, Loader2, 
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

type TabType = 'profile' | 'security' | 'appearance' | 'language';

interface TabInfo {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

export default function UserSettings() {
  const { user, updateUser } = useAuthStore();
  const settings = useSettingsStore();
  const tr = useTranslation(settings.language);
  
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Profile form
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    department: '',
    position: '',
  });
  
  // Password form
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
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        department: user.department || '',
        position: user.position || '',
      });
      if (user.avatar_url) {
        setAvatarPreview(user.avatar_url);
      }
    }
  }, [user]);

  // Load settings from API
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsAPI.get();
      if (data.theme) settings.setTheme(data.theme as Theme);
      if (data.language) settings.setLanguage(data.language as Language);
      if (data.timezone) settings.setTimezone(data.timezone);
      if (data.date_format) settings.setDateFormat(data.date_format as DateFormat);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const tabs: TabInfo[] = [
    { id: 'profile', label: tr.t('profile'), icon: <User size={18} /> },
    { id: 'security', label: tr.t('security'), icon: <Shield size={18} /> },
    { id: 'appearance', label: tr.t('appearance'), icon: <Palette size={18} /> },
    { id: 'language', label: tr.t('language'), icon: <Globe size={18} /> },
  ];

  // Save profile
  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);
    try {
      const updatedUser = await authAPI.updateProfile(profileForm);
      updateUser(updatedUser);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    setPasswordError(null);
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError(tr.t('passwordMismatch'));
      return;
    }
    
    if (passwordForm.new_password.length < 8) {
      setPasswordError(tr.t('passwordTooShort'));
      return;
    }
    
    setSaving(true);
    try {
      await settingsAPI.changePassword(passwordForm.current_password, passwordForm.new_password);
      setPasswordSuccess(true);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  // Avatar upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarPreview || avatarPreview === user?.avatar_url) return;
    
    setSaving(true);
    try {
      const result = await settingsAPI.uploadAvatar(avatarPreview);
      updateUser({ avatar_url: result.avatar_url });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload avatar');
    } finally {
      setSaving(false);
    }
  };

  // Theme change
  const handleThemeChange = async (theme: Theme) => {
    settings.setTheme(theme);
    settings.applyTheme();
    try {
      await settingsAPI.update({ theme });
    } catch (err) {
      console.error('Failed to save theme:', err);
    }
  };

  // Language change
  const handleLanguageChange = async (language: Language) => {
    settings.setLanguage(language);
    try {
      await settingsAPI.update({ language });
    } catch (err) {
      console.error('Failed to save language:', err);
    }
  };

  // Timezone change
  const handleTimezoneChange = async (timezone: string) => {
    settings.setTimezone(timezone);
    try {
      await settingsAPI.update({ timezone });
    } catch (err) {
      console.error('Failed to save timezone:', err);
    }
  };

  // Date format change
  const handleDateFormatChange = async (dateFormat: DateFormat) => {
    settings.setDateFormat(dateFormat);
    try {
      await settingsAPI.update({ date_format: dateFormat });
    } catch (err) {
      console.error('Failed to save date format:', err);
    }
  };

  const ThemeOption = ({ id: _id, theme, icon, label, selected }: { id: string; theme: Theme; icon: React.ReactNode; label: string; selected: boolean }) => (
    <button
      onClick={() => handleThemeChange(theme)}
      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
        selected 
          ? 'border-primary-500 bg-primary-500/10' 
          : 'border-dark-700 hover:border-dark-600'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
      {selected && <Check size={16} className="text-primary-400" />}
    </button>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{tr.t('settings')}</h1>
      <p className="text-dark-400 mb-6">{tr.t('settingsDescription')}</p>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="md:w-64 flex-shrink-0">
          <Card className="p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'hover:bg-dark-800 text-dark-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          <Card className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">{tr.t('profileSettings')}</h2>
                
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
                
                {saveSuccess && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm flex items-center gap-2">
                    <Check size={16} />
                    {tr.t('changesSaved')}
                  </div>
                )}

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-dark-700 flex items-center justify-center overflow-hidden">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User size={32} className="text-dark-500" />
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center hover:bg-primary-600"
                    >
                      <Camera size={14} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  {avatarPreview && avatarPreview !== user?.avatar_url && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAvatarUpload} disabled={saving}>
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {tr.t('save')}
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setAvatarPreview(user?.avatar_url || null)}>
                        <X size={14} />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{tr.t('firstName')}</label>
                    <Input
                      value={profileForm.first_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{tr.t('lastName')}</label>
                    <Input
                      value={profileForm.last_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{tr.t('email')}</label>
                    <Input value={user?.email || ''} disabled className="bg-dark-800" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{tr.t('phone')}</label>
                    <Input
                      value={profileForm.phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{tr.t('department')}</label>
                    <Input
                      value={profileForm.department}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileForm({ ...profileForm, department: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{tr.t('position')}</label>
                    <Input
                      value={profileForm.position}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileForm({ ...profileForm, position: e.target.value })}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                  {tr.t('saveChanges')}
                </Button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">{tr.t('securitySettings')}</h2>
                
                {/* Change Password */}
                <div className="space-y-4">
                  <h3 className="font-medium">{tr.t('changePassword')}</h3>
                  
                  {passwordError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                      <AlertCircle size={16} />
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
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
                  <h3 className="font-medium mb-4">{tr.t('theme')}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <ThemeOption
                      id="theme-light"
                      theme="light"
                      icon={<Sun size={24} className="text-yellow-400" />}
                      label={tr.t('lightTheme')}
                      selected={settings.theme === 'light'}
                    />
                    <ThemeOption
                      id="theme-dark"
                      theme="dark"
                      icon={<Moon size={24} className="text-blue-400" />}
                      label={tr.t('darkTheme')}
                      selected={settings.theme === 'dark'}
                    />
                    <ThemeOption
                      id="theme-system"
                      theme="system"
                      icon={<Monitor size={24} className="text-gray-400" />}
                      label={tr.t('systemTheme')}
                      selected={settings.theme === 'system'}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Language Tab */}
            {activeTab === 'language' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">{tr.t('languageSettings')}</h2>
                
                {/* Language Selection */}
                <div>
                  <h3 className="font-medium mb-3">{tr.t('selectLanguage')}</h3>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleLanguageChange('th')}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                        settings.language === 'th' 
                          ? 'border-primary-500 bg-primary-500/10' 
                          : 'border-dark-700 hover:border-dark-600'
                      }`}
                    >
                      <span className="text-2xl">🇹🇭</span>
                      <span>ภาษาไทย</span>
                      {settings.language === 'th' && <Check size={16} className="text-primary-400" />}
                    </button>
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                        settings.language === 'en' 
                          ? 'border-primary-500 bg-primary-500/10' 
                          : 'border-dark-700 hover:border-dark-600'
                      }`}
                    >
                      <span className="text-2xl">🇺🇸</span>
                      <span>English</span>
                      {settings.language === 'en' && <Check size={16} className="text-primary-400" />}
                    </button>
                  </div>
                </div>

                {/* Timezone */}
                <div>
                  <h3 className="font-medium mb-3">{tr.t('timezone')}</h3>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleTimezoneChange(e.target.value)}
                    className="w-full md:w-64 bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
                  >
                    <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                    <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                    <option value="UTC">UTC (GMT+0)</option>
                    <option value="America/New_York">America/New_York (GMT-5)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (GMT-8)</option>
                    <option value="Europe/London">Europe/London (GMT+0)</option>
                  </select>
                </div>

                {/* Date Format */}
                <div>
                  <h3 className="font-medium mb-3">{tr.t('dateFormat')}</h3>
                  <div className="flex flex-wrap gap-3">
                    {(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as DateFormat[]).map((format) => (
                      <button
                        key={format}
                        onClick={() => handleDateFormatChange(format)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          settings.dateFormat === format
                            ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                            : 'border-dark-700 hover:border-dark-600'
                        }`}
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
