/**
 * User Settings Page
 * Settings for regular users: Profile, Security (2FA), Appearance, Language, Storage
 */
import { useState, useEffect, useRef } from 'react';
import { 
  User, Shield, Palette, Globe, Save, Loader2, 
  Check, Moon, Sun, Monitor, Camera, X, Eye, EyeOff,
  AlertCircle, HardDrive, Trash2, RefreshCw
} from 'lucide-react';
import { Button, Input, Card } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import type { Theme, Language, DateFormat } from '../../store/settingsStore';
import { settingsAPI, authAPI } from '../../services/api';
import TwoFactorSetup from '../../components/TwoFactorSetup';

type TabType = 'profile' | 'security' | 'appearance' | 'language' | 'storage';

interface TabInfo {
  id: TabType;
  labelTh: string;
  labelEn: string;
  icon: React.ReactNode;
}

// Inline translations
const translations = {
  th: {
    settings: 'Settings',
    settingsDesc: 'Manage account and application settings',
    profile: 'Profile',
    security: 'Security',
    appearance: 'Appearance',
    language: 'Language',
    profileSettings: 'DataProfile',
    firstName: 'Name',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    department: 'Department',
    position: 'Position',
    save: 'Save',
    saveChanges: 'Save Changes',
    changesSaved: 'SaveSuccess',
    securitySettings: 'Security',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'ConfirmNew Password',
    passwordChanged: 'Change PasswordSuccess',
    passwordMismatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 8 characters',
    appearanceSettings: 'Appearance',
    theme: 'Theme',
    lightTheme: 'Light',
    darkTheme: 'Dark',
    systemTheme: 'System',
    languageSettings: 'Language and Region',
    selectLanguage: 'SelectLanguage',
    timezone: 'Timezone',
    dateFormat: 'Date Format',
    storage: 'Storage',
    storageSettings: 'Storage & Cache',
    clearCache: 'Clear Cache',
    clearCacheDesc: 'Clear cached data to fix issues',
    clearCacheSuccess: 'Cache cleared',
    clearing: 'Clearing...',
    appVersion: 'App Version',
    checkUpdate: 'Check Updates',
  },
  en: {
    settings: 'Settings',
    settingsDesc: 'Manage your account and application settings',
    profile: 'Profile',
    security: 'Security',
    appearance: 'Appearance',
    language: 'Language',
    profileSettings: 'Profile Settings',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    department: 'Department',
    position: 'Position',
    save: 'Save',
    saveChanges: 'Save Changes',
    changesSaved: 'Changes Saved',
    securitySettings: 'Security Settings',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    passwordChanged: 'Password Changed Successfully',
    passwordMismatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 8 characters',
    appearanceSettings: 'Appearance Settings',
    theme: 'Theme',
    lightTheme: 'Light',
    darkTheme: 'Dark',
    systemTheme: 'System',
    languageSettings: 'Language & Region',
    selectLanguage: 'Select Language',
    timezone: 'Timezone',
    dateFormat: 'Date Format',
    storage: 'Storage',
    storageSettings: 'Storage & Cache',
    clearCache: 'Clear Cache',
    clearCacheDesc: 'Clear cached data to fix display issues or free up space',
    clearCacheSuccess: 'Cache cleared successfully',
    clearing: 'Clearing...',
    appVersion: 'App Version',
    checkUpdate: 'Check for Updates',
  },
};

export default function UserSettings() {
  const { user, updateUser } = useAuthStore();
  const settings = useSettingsStore();
  const lang = settings.language || 'th';
  const t = translations[lang];
  
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

  // Cache clearing
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

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
      const data = await settingsAPI.getSettings();
      if (data.theme) settings.setTheme(data.theme as Theme);
      if (data.language) settings.setLanguage(data.language as Language);
      if (data.timezone) settings.setTimezone(data.timezone);
      if (data.date_format) settings.setDateFormat(data.date_format as DateFormat);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const tabs: TabInfo[] = [
    { id: 'profile', labelTh: 'Profile', labelEn: 'Profile', icon: <User size={18} /> },
    { id: 'security', labelTh: 'Security', labelEn: 'Security', icon: <Shield size={18} /> },
    { id: 'appearance', labelTh: 'Appearance', labelEn: 'Appearance', icon: <Palette size={18} /> },
    { id: 'language', labelTh: 'Language', labelEn: 'Language', icon: <Globe size={18} /> },
    { id: 'storage', labelTh: 'Storage', labelEn: 'Storage', icon: <HardDrive size={18} /> },
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
      setPasswordError(t.passwordMismatch);
      return;
    }
    
    if (passwordForm.new_password.length < 8) {
      setPasswordError(t.passwordTooShort);
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
      setPasswordError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  // Clear cache
  const handleClearCache = async () => {
    setClearingCache(true);
    setCacheCleared(false);
    
    try {
      // Clear Service Worker cache
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
      }
      
      // Clear browser caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Clear localStorage (except auth token)
      const token = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      localStorage.clear();
      if (token) localStorage.setItem('access_token', token);
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 3000);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setClearingCache(false);
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
      updateUser({ avatar_url: result.avatar_data || undefined });
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
      await settingsAPI.updateSettings({ theme });
    } catch (err) {
      console.error('Failed to save theme:', err);
    }
  };

  // Language change
  const handleLanguageChange = async (language: Language) => {
    settings.setLanguage(language);
    try {
      await settingsAPI.updateSettings({ language });
    } catch (err) {
      console.error('Failed to save language:', err);
    }
  };

  // Timezone change
  const handleTimezoneChange = async (timezone: string) => {
    settings.setTimezone(timezone);
    try {
      await settingsAPI.updateSettings({ timezone });
    } catch (err) {
      console.error('Failed to save timezone:', err);
    }
  };

  // Date format change
  const handleDateFormatChange = async (dateFormat: DateFormat) => {
    settings.setDateFormat(dateFormat);
    try {
      await settingsAPI.updateSettings({ date_format: dateFormat });
    } catch (err) {
      console.error('Failed to save date format:', err);
    }
  };

  const ThemeOption = ({ theme, icon, label, selected }: { theme: Theme; icon: React.ReactNode; label: string; selected: boolean }) => (
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
      <h1 className="text-2xl font-bold mb-2">{t.settings}</h1>
      <p className="text-dark-400 mb-6">{t.settingsDesc}</p>

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
                <span>{lang === 'th' ? tab.labelTh : tab.labelEn}</span>
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
                <h2 className="text-lg font-semibold mb-4">{t.profileSettings}</h2>
                
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
                
                {saveSuccess && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm flex items-center gap-2">
                    <Check size={16} />
                    {t.changesSaved}
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
                        {t.save}
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
                    <label className="block text-sm font-medium mb-1">{t.firstName}</label>
                    <Input
                      value={profileForm.first_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.lastName}</label>
                    <Input
                      value={profileForm.last_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.email}</label>
                    <Input value={user?.email || ''} disabled className="bg-dark-800" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.phone}</label>
                    <Input
                      value={profileForm.phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.department}</label>
                    <Input
                      value={profileForm.department}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileForm({ ...profileForm, department: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.position}</label>
                    <Input
                      value={profileForm.position}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileForm({ ...profileForm, position: e.target.value })}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                  {t.saveChanges}
                </Button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">{t.securitySettings}</h2>
                
                {/* Change Password */}
                <div className="space-y-4">
                  <h3 className="font-medium">{t.changePassword}</h3>
                  
                  {passwordError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                      <AlertCircle size={16} />
                      {passwordError}
                    </div>
                  )}
                  
                  {passwordSuccess && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm flex items-center gap-2">
                      <Check size={16} />
                      {t.passwordChanged}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.currentPassword}</label>
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
                    <label className="block text-sm font-medium mb-1">{t.newPassword}</label>
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
                    <label className="block text-sm font-medium mb-1">{t.confirmPassword}</label>
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
                    {t.changePassword}
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
                <h2 className="text-lg font-semibold mb-4">{t.appearanceSettings}</h2>
                
                <div>
                  <h3 className="font-medium mb-4">{t.theme}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <ThemeOption
                      theme="light"
                      icon={<Sun size={24} className="text-yellow-400" />}
                      label={t.lightTheme}
                      selected={settings.theme === 'light'}
                    />
                    <ThemeOption
                      theme="dark"
                      icon={<Moon size={24} className="text-blue-400" />}
                      label={t.darkTheme}
                      selected={settings.theme === 'dark'}
                    />
                    <ThemeOption
                      theme="system"
                      icon={<Monitor size={24} className="text-gray-400" />}
                      label={t.systemTheme}
                      selected={settings.theme === 'system'}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Language Tab */}
            {activeTab === 'language' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">{t.languageSettings}</h2>
                
                {/* Language Selection */}
                <div>
                  <h3 className="font-medium mb-3">{t.selectLanguage}</h3>
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
                      <span>LanguageThai</span>
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
                  <h3 className="font-medium mb-3">{t.timezone}</h3>
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
                  <h3 className="font-medium mb-3">{t.dateFormat}</h3>
                  <div className="flex flex-wrap gap-3">
                    {(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as DateFormat[]).map((format) => (
                      <button
                        key={format}
                        onClick={() => handleDateFormatChange(format)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          settings.date_format === format
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

            {/* Storage Tab */}
            {activeTab === 'storage' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">{t.storageSettings}</h2>
                
                {/* Clear Cache */}
                <div className="p-4 bg-dark-800 rounded-xl border border-dark-700">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Trash2 className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{t.clearCache}</h3>
                      <p className="text-sm text-dark-400 mt-1">{t.clearCacheDesc}</p>
                      <button
                        onClick={handleClearCache}
                        disabled={clearingCache}
                        className="mt-3 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {clearingCache ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t.clearing}
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            {t.clearCache}
                          </>
                        )}
                      </button>
                      {cacheCleared && (
                        <p className="text-sm text-green-400 mt-2 flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          {t.clearCacheSuccess}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* App Version */}
                <div className="p-4 bg-dark-800 rounded-xl border border-dark-700">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <RefreshCw className="w-6 h-6 text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{t.appVersion}</h3>
                      <p className="text-sm text-dark-400 mt-1">v1.0.0 (Build 2026.01.27)</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="mt-3 px-4 py-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        {t.checkUpdate}
                      </button>
                    </div>
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
