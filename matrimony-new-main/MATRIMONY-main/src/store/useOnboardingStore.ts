import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserOnboardingStatus } from '../types/user';

interface OnboardingState {
  onboardingStatus: UserOnboardingStatus;
  verificationStatus: 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  isVerificationSkipped: boolean;

  // Actions
  setOnboardingStatus: (status: Partial<UserOnboardingStatus>) => void;
  setVerificationStatus: (status: 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED') => void;
  skipVerificationForSession: () => void;
  resetOnboarding: () => void;
}

const defaultOnboarding: UserOnboardingStatus = {
  is_basic_complete: false,
  is_detailed_complete: false,
  is_verified: false,
  verification_status: 'NOT_SUBMITTED'
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      onboardingStatus: defaultOnboarding,
      verificationStatus: 'NOT_SUBMITTED',
      isVerificationSkipped: false,

      setOnboardingStatus: (statusUpdates) =>
        set((state) => ({
          onboardingStatus: {
            ...state.onboardingStatus,
            ...statusUpdates
          },
          verificationStatus: statusUpdates.verification_status || state.verificationStatus
        })),

      setVerificationStatus: (verificationStatus) =>
        set((state) => ({
          verificationStatus,
          onboardingStatus: {
            ...state.onboardingStatus,
            verification_status: verificationStatus,
            is_verified: verificationStatus === 'VERIFIED'
          }
        })),

      skipVerificationForSession: () => set({ isVerificationSkipped: true }),

      resetOnboarding: () =>
        set({
          onboardingStatus: defaultOnboarding,
          verificationStatus: 'NOT_SUBMITTED',
          isVerificationSkipped: false
        })
    }),
    {
      name: 'vivah_onboarding_store',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
