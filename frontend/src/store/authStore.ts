import { create } from 'zustand';
import type { User } from '../types/user';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isInitialized: boolean;
  setAuth: (user: User, token: string) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  setInitialized: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isInitialized: false,

  setAuth: (user, token) => set({ user, accessToken: token }),

  setAccessToken: (token) => set({ accessToken: token }),

  clearAuth: () => set({ user: null, accessToken: null }),

  setInitialized: () => set({ isInitialized: true }),
}));
