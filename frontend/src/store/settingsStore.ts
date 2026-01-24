/**
 * Settings Store
 * Zustand store for user settings (theme, language, notifications)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { settingsAPI } from '../services/api';

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'th' | 'en';
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  case_updates: boolean;
  weekly_report: boolean;
  ticket_updates: boolean;
  system_announcements: boolean;
}

interface UserSettings {
  // Appearance
  theme: Theme;
  sidebar_collapsed: boolean;
  
  // Language & Region
  language: Language;
  timezone: string;
  date_format: DateFormat;
  
  // Notifications
  notifications: NotificationPreferences;
  
  // Avatar
  avatar_data: string | null;
  avatar_filename: string | null;
}

interface SettingsState extends UserSettings {
  // Loading state
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Actions
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  setTimezone: (timezone: string) => void;
  setDateFormat: (format: DateFormat) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setNotificationPreference: (key: keyof NotificationPreferences, value: boolean) => void;
  setAvatar: (data: string | null, filename: string | null) => void;
  
  // API Actions
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  saveNotifications: () => Promise<void>;
  saveAppearance: () => Promise<void>;
  saveLanguage: () => Promise<void>;
  uploadAvatar: (data: string, filename?: string) => Promise<void>;
  deleteAvatar: () => Promise<void>;
  
  // Apply theme to document
  applyTheme: () => void;
}

const defaultNotifications: NotificationPreferences = {
  email_notifications: true,
  push_notifications: true,
  case_updates: true,
  weekly_report: false,
  ticket_updates: true,
  system_announcements: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'dark',
      sidebar_collapsed: false,
      language: 'th',
      timezone: 'Asia/Bangkok',
      date_format: 'DD/MM/YYYY',
      notifications: defaultNotifications,
      avatar_data: null,
      avatar_filename: null,
      isLoading: false,
      isSaving: false,
      error: null,
      
      // Theme setter
      setTheme: (theme: Theme) => {
        set({ theme });
        get().applyTheme();
      },
      
      // Language setter
      setLanguage: (language: Language) => {
        set({ language });
        // Update HTML lang attribute
        document.documentElement.lang = language;
      },
      
      // Timezone setter
      setTimezone: (timezone: string) => set({ timezone }),
      
      // Date format setter
      setDateFormat: (date_format: DateFormat) => set({ date_format }),
      
      // Sidebar collapsed setter
      setSidebarCollapsed: (collapsed: boolean) => set({ sidebar_collapsed: collapsed }),
      
      // Notification preference setter
      setNotificationPreference: (key: keyof NotificationPreferences, value: boolean) => {
        set((state) => ({
          notifications: { ...state.notifications, [key]: value }
        }));
      },
      
      // Avatar setter
      setAvatar: (data: string | null, filename: string | null) => {
        set({ avatar_data: data, avatar_filename: filename });
      },
      
      // Apply theme to document
      applyTheme: () => {
        const { theme } = get();
        const html = document.documentElement;
        const body = document.body;
        
        // Remove existing theme classes
        html.classList.remove('light', 'dark');
        body.classList.remove('light', 'dark');
        
        let effectiveTheme = theme;
        
        if (theme === 'system') {
          // Check system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          effectiveTheme = prefersDark ? 'dark' : 'light';
        }
        
        // Apply theme class to both html and body
        if (effectiveTheme === 'light') {
          html.classList.add('light');
          body.classList.add('light');
        } else {
          html.classList.add('dark');
          body.classList.add('dark');
        }
        
        // Store in localStorage for immediate load on next visit
        localStorage.setItem('theme', theme);
      },
      
      // Load settings from API
      loadSettings: async () => {
        set({ isLoading: true, error: null });
        try {
          const settings = await settingsAPI.getSettings();
          set({
            theme: settings.theme as Theme,
            sidebar_collapsed: settings.sidebar_collapsed,
            language: settings.language as Language,
            timezone: settings.timezone,
            date_format: settings.date_format as DateFormat,
            notifications: {
              email_notifications: settings.email_notifications,
              push_notifications: settings.push_notifications,
              case_updates: settings.case_updates,
              weekly_report: settings.weekly_report,
              ticket_updates: settings.ticket_updates,
              system_announcements: settings.system_announcements,
            },
            avatar_data: settings.avatar_data,
            avatar_filename: settings.avatar_filename,
            isLoading: false,
          });
          get().applyTheme();
        } catch (error: any) {
          console.error('Failed to load settings:', error);
          set({ isLoading: false, error: 'Failed to load settings' });
        }
      },
      
      // Save all settings
      saveSettings: async () => {
        const state = get();
        set({ isSaving: true, error: null });
        try {
          await settingsAPI.updateSettings({
            theme: state.theme,
            sidebar_collapsed: state.sidebar_collapsed,
            language: state.language,
            timezone: state.timezone,
            date_format: state.date_format,
            ...state.notifications,
          });
          set({ isSaving: false });
        } catch (error: any) {
          set({ isSaving: false, error: 'Failed to save settings' });
          throw error;
        }
      },
      
      // Save notifications only
      saveNotifications: async () => {
        const { notifications } = get();
        set({ isSaving: true, error: null });
        try {
          await settingsAPI.updateNotifications(notifications);
          set({ isSaving: false });
        } catch (error: any) {
          set({ isSaving: false, error: 'Failed to save notifications' });
          throw error;
        }
      },
      
      // Save appearance only
      saveAppearance: async () => {
        const { theme, sidebar_collapsed } = get();
        set({ isSaving: true, error: null });
        try {
          await settingsAPI.updateAppearance({ theme, sidebar_collapsed });
          set({ isSaving: false });
        } catch (error: any) {
          set({ isSaving: false, error: 'Failed to save appearance' });
          throw error;
        }
      },
      
      // Save language only
      saveLanguage: async () => {
        const { language, timezone, date_format } = get();
        set({ isSaving: true, error: null });
        try {
          await settingsAPI.updateLanguage({ language, timezone, date_format });
          set({ isSaving: false });
        } catch (error: any) {
          set({ isSaving: false, error: 'Failed to save language settings' });
          throw error;
        }
      },
      
      // Upload avatar
      uploadAvatar: async (data: string, filename?: string) => {
        set({ isSaving: true, error: null });
        try {
          const response = await settingsAPI.uploadAvatar(data, filename);
          set({ 
            avatar_data: response.avatar_data, 
            avatar_filename: response.filename,
            isSaving: false 
          });
        } catch (error: any) {
          set({ isSaving: false, error: 'Failed to upload avatar' });
          throw error;
        }
      },
      
      // Delete avatar
      deleteAvatar: async () => {
        set({ isSaving: true, error: null });
        try {
          await settingsAPI.deleteAvatar();
          set({ avatar_data: null, avatar_filename: null, isSaving: false });
        } catch (error: any) {
          set({ isSaving: false, error: 'Failed to delete avatar' });
          throw error;
        }
      },
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        timezone: state.timezone,
        date_format: state.date_format,
        sidebar_collapsed: state.sidebar_collapsed,
        notifications: state.notifications,
        avatar_data: state.avatar_data,
        avatar_filename: state.avatar_filename,
      }),
    }
  )
);

// Initialize theme on app load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('settings-storage');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state?.theme) {
        const root = document.documentElement;
        if (state.theme === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          root.classList.toggle('dark', prefersDark);
        } else {
          root.classList.toggle('dark', state.theme === 'dark');
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
}

export default useSettingsStore;
