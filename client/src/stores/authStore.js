import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      // Initialize auth state
      initialize: async () => {
        const token = get().token;
        if (!token) {
          set({ isLoading: false });
          return;
        }

        try {
          const response = await api.get('/auth/me');
          set({
            user: response.data,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Token invalid, clear auth state
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      // Login
      login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { user, token } = response.data;

        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });

        return response.data;
      },

      // Register
      register: async (data) => {
        const response = await api.post('/auth/register', data);
        const { user, token } = response.data;

        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });

        return response.data;
      },

      // Logout
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          // Ignore errors
        }

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      // Update user
      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }));
      },

      // Forgot password
      forgotPassword: async (email) => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
      },

      // Reset password
      resetPassword: async (token, password) => {
        const response = await api.post('/auth/reset-password', {
          token,
          password,
        });
        return response.data;
      },

      // Verify email
      verifyEmail: async (token) => {
        const response = await api.get(`/auth/verify-email/${token}`);
        return response.data;
      },

      // Resend verification email
      resendVerification: async () => {
        const response = await api.post('/auth/resend-verification');
        return response.data;
      },
    }),
    {
      name: 'hypeform-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize auth on app load
if (typeof window !== 'undefined') {
  useAuthStore.getState().initialize();
}
