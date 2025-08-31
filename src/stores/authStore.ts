import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState, LoginRequest, RegisterRequest } from '../types';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

interface AuthStore extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(credentials);
          const { user, token } = response.data;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          toast.success(`Welcome back, ${user.firstName}!`);
        } catch (error: any) {
          set({ isLoading: false });
          const message = error.response?.data?.message || 'Login failed';
          toast.error(message);
          throw error;
        }
      },

      register: async (userData: RegisterRequest) => {
        set({ isLoading: true });
        try {
          const response = await authService.register(userData);
          const { user, token } = response.data;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          toast.success(`Welcome to UA Designs PMS, ${user.firstName}!`);
        } catch (error: any) {
          set({ isLoading: false });
          const message =
            error.response?.data?.message || 'Registration failed';
          toast.error(message);
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        localStorage.removeItem('auth-storage');
        toast.success('Logged out successfully');
      },

      refreshToken: async () => {
        try {
          const response = await authService.refreshToken();
          const { token } = response.data;

          set({ token });
        } catch (error) {
          get().logout();
          throw error;
        }
      },

      updateProfile: async (userData: Partial<User>) => {
        set({ isLoading: true });
        try {
          const response = await authService.updateProfile(userData);
          const { user } = response.data;

          set({
            user,
            isLoading: false,
          });

          toast.success('Profile updated successfully');
        } catch (error: any) {
          set({ isLoading: false });
          const message =
            error.response?.data?.message || 'Profile update failed';
          toast.error(message);
          throw error;
        }
      },

      resetPassword: async (email: string) => {
        set({ isLoading: true });
        try {
          await authService.resetPassword(email);
          set({ isLoading: false });
          toast.success('Password reset email sent');
        } catch (error: any) {
          set({ isLoading: false });
          const message =
            error.response?.data?.message || 'Password reset failed';
          toast.error(message);
          throw error;
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        set({ isLoading: true });
        try {
          await authService.changePassword(currentPassword, newPassword);
          set({ isLoading: false });
          toast.success('Password changed successfully');
        } catch (error: any) {
          set({ isLoading: false });
          const message =
            error.response?.data?.message || 'Password change failed';
          toast.error(message);
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: state => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
