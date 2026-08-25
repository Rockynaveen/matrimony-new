import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp, getNextPendingRoute } from '../../context/AppContext';

export type StepRequirement =
  | 'authenticated'
  | 'basic_profile'
  | 'complete_profile'
  | 'partner_preferences'
  | 'verification'
  | 'onboarded';

interface ProtectedRouteProps {
  children: React.ReactNode;
  step?: StepRequirement;
  requireBasicComplete?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  step
}) => {
  const { isAuthenticated, onboardingStatus } = useApp();
  const location = useLocation();

  if (!isAuthenticated) {
    const targetPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${targetPath}`} replace />;
  }

  const currentPath = location.pathname;

  // 1. If accessing Basic Profile page:
  if (currentPath === '/complete-basic-profile' || step === 'basic_profile') {
    if (onboardingStatus.registration_method !== 'google' || onboardingStatus.basic_profile_completed) {
      const nextRoute = getNextPendingRoute(onboardingStatus);
      if (nextRoute !== '/complete-basic-profile') {
        return <Navigate to={nextRoute} replace />;
      }
    }
    return <>{children}</>;
  }

  // 2. If Google registration user has NOT completed Basic Profile:
  if (onboardingStatus.registration_method === 'google' && !onboardingStatus.basic_profile_completed) {
    if (currentPath !== '/complete-basic-profile') {
      return <Navigate to="/complete-basic-profile" replace />;
    }
  }

  // 3. If accessing Complete Profile page:
  if (currentPath === '/profile/complete' || step === 'complete_profile') {
    return <>{children}</>;
  }

  // 4. If accessing Partner Preferences page:
  if (currentPath === '/preferences' || step === 'partner_preferences') {
    if (!onboardingStatus.complete_profile_completed) {
      return <Navigate to="/profile/complete" replace />;
    }
    return <>{children}</>;
  }

  // 5. If accessing Verification page:
  if (currentPath === '/verification' || step === 'verification') {
    if (!onboardingStatus.complete_profile_completed) {
      return <Navigate to="/profile/complete" replace />;
    }
    if (!onboardingStatus.partner_preferences_completed) {
      return <Navigate to="/preferences" replace />;
    }
    return <>{children}</>;
  }

  // 6. For fully onboarded core app routes (Matches, Dashboard, Search, etc.):
  const isSkippedForSession =
    Boolean(onboardingStatus.verification_skipped_for_session) ||
    sessionStorage.getItem('verification_skipped_session') === 'true';

  const hasPassedVerification =
    onboardingStatus.verification_completed ||
    onboardingStatus.verification_status === 'PENDING' ||
    onboardingStatus.verification_status === 'VERIFIED' ||
    isSkippedForSession;

  const isFullyOnboarded =
    onboardingStatus.registration_completed &&
    (onboardingStatus.registration_method !== 'google' || onboardingStatus.basic_profile_completed) &&
    onboardingStatus.complete_profile_completed &&
    onboardingStatus.partner_preferences_completed &&
    hasPassedVerification;

  if (!isFullyOnboarded) {
    const nextPending = getNextPendingRoute(onboardingStatus);
    if (nextPending !== currentPath) {
      return <Navigate to={nextPending} replace />;
    }
  }

  return <>{children}</>;
};

