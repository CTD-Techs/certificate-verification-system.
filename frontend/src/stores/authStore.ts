import { create } from 'zustand';
import { User } from '@/types';
import { authService } from '@/services';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => void;
  hasRole: (role: string | string[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
    if (user) {
      authService.setUser(user);
    }
  },

  setToken: (token) => {
    set({ token, isAuthenticated: !!token });
    if (token) {
      authService.setToken(token);
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await authService.login({ email, password });
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
      authService.setToken(response.token);
      authService.setUser(response.user);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const response = await authService.register(data);
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
      authService.setToken(response.token);
      authService.setUser(response.user);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Ignore errors during logout
    } finally {
      set({ user: null, token: null, isAuthenticated: false });
      authService.clearAuth();
    }
  },

  loadUser: () => {
    const token = authService.getToken();
    const user = authService.getUser();
    if (token && user) {
      set({ user, token, isAuthenticated: true });
    }
  },

  hasRole: (role) => {
    const { user } = get();
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  },
}));