import { create } from 'zustand';

interface UIState {
  toastMessage: string | null;
  isLockedModalOpen: boolean;
  lockErrorMessage: string;
  is2FAModalOpen: boolean;
  isMobileMenuOpen: boolean;

  // Actions
  showToast: (message: string) => void;
  clearToast: () => void;
  setLockModal: (open: boolean, message?: string) => void;
  set2FAModal: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  toastMessage: null,
  isLockedModalOpen: false,
  lockErrorMessage: '',
  is2FAModalOpen: false,
  isMobileMenuOpen: false,

  showToast: (message: string) => {
    set({ toastMessage: message });
    setTimeout(() => {
      set((state) => (state.toastMessage === message ? { toastMessage: null } : state));
    }, 4000);
  },

  clearToast: () => set({ toastMessage: null }),

  setLockModal: (open: boolean, message = '') =>
    set({
      isLockedModalOpen: open,
      lockErrorMessage: message
    }),

  set2FAModal: (open: boolean) => set({ is2FAModalOpen: open }),

  setMobileMenuOpen: (open: boolean) => set({ isMobileMenuOpen: open })
}));
