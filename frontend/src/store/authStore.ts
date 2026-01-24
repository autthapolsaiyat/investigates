/**
 * Auth Store
 * Zustand store for authentication state with 2FA support
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, twoFactorAPI, clearTokens, getAccessToken } from '../services/api';
import type { User, LoginRequest, RegisterRequest } from '../services/api';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // 2FA state
  requires2FA: boolean;
  tempToken: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<{ requires2FA: boolean }>;
  verify2FA: (code: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  clear2FA: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      requires2FA: false,
      tempToken: null,

      // Login
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null, requires2FA: false, tempToken: null });
        try {
          const response = await authAPI.login(credentials);
          
          // Check if 2FA is required
          if (response.requires_2fa && response.temp_token) {
            set({
              isLoading: false,
              requires2FA: true,
              tempToken: response.temp_token,
            });
            return { requires2FA: true };
          }
          
          // Normal login success
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            requires2FA: false,
            tempToken: null,
          });
          return { requires2FA: false };
        } catch (error: any) {
          const message = error.response?.data?.detail || 'Login failed. Please try again.';
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: message,
            requires2FA: false,
            tempToken: null,
          });
          throw error;
        }
      },

      // Verify 2FA code
      verify2FA: async (code: string) => {
        const { tempToken } = get();
        if (!tempToken) {
          set({ error: 'No pending 2FA verification' });
          throw new Error('No pending 2FA verification');
        }
        
        set({ isLoading: true, error: null });
        try {
          const response = await twoFactorAPI.loginWith2FA(tempToken, code);
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            requires2FA: false,
            tempToken: null,
          });
        } catch (error: any) {
          const message = error.response?.data?.detail || 'Invalid 2FA code';
          set({
            isLoading: false,
            error: message,
          });
          throw error;
        }
      },

      // Register
      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null });
        try {
          await authAPI.register(data);
          set({ isLoading: false, error: null });
        } catch (error: any) {
          const message = error.response?.data?.detail || 'Registration failed. Please try again.';
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      // Logout
      logout: async () => {
        set({ isLoading: true });
        try {
          await authAPI.logout();
        } catch (error) {
          // Ignore logout errors
        } finally {
          clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            requires2FA: false,
            tempToken: null,
          });
        }
      },

      // Check authentication status
      checkAuth: async () => {
        const token = getAccessToken();
        if (!token) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        set({ isLoading: true });
        try {
          const user = await authAPI.me();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Clear 2FA state (go back to login)
      clear2FA: () => set({ requires2FA: false, tempToken: null, error: null }),

      // Update user (for profile updates)
      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
