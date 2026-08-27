import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../types/user';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  currentUser: User;
  googleAvatar: string | null;

  // Actions
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  setCurrentUser: (user: Partial<User>) => void;
  setGoogleAvatar: (avatarUrl: string | null) => void;
  logout: () => void;
}

const defaultUser: User = {
  id: '',
  name: '',
  email: '',
  phone: '',
  avatar: '',
  is2FAEnabled: true,
  status: 'Active',
  joinedDate: ''
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      currentUser: defaultUser,
      googleAvatar: null,

      setTokens: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
          isAuthenticated: Boolean(accessToken)
        }),

      setCurrentUser: (userUpdates) =>
        set((state) => ({
          currentUser: {
            ...state.currentUser,
            ...userUpdates
          }
        })),

      setGoogleAvatar: (avatarUrl) =>
        set({
          googleAvatar: avatarUrl
        }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          currentUser: defaultUser,
          googleAvatar: null
        })
    }),
    {
      name: 'vivah_auth_store',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
