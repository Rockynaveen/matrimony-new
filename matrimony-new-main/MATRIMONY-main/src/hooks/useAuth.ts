import { useAuthStore } from '../store/useAuthStore';
import { useOnboardingStore } from '../store/useOnboardingStore';

export const useAuth = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentUser = useAuthStore((state) => state.currentUser);
  const googleAvatar = useAuthStore((state) => state.googleAvatar);
  const logout = useAuthStore((state) => state.logout);
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);

  const onboardingStatus = useOnboardingStore((state) => state.onboardingStatus);
  const verificationStatus = useOnboardingStore((state) => state.verificationStatus);
  const isVerificationSkipped = useOnboardingStore((state) => state.isVerificationSkipped);
  const setOnboardingStatus = useOnboardingStore((state) => state.setOnboardingStatus);

  return {
    isAuthenticated,
    currentUser,
    googleAvatar,
    logout,
    setCurrentUser,
    onboardingStatus,
    verificationStatus,
    isVerificationSkipped,
    setOnboardingStatus
  };
};
