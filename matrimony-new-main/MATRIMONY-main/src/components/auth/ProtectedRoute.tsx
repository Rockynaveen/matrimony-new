import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export type StepRequirement =
  | 'authenticated'
  | 'complete_profile'
  | 'partner_preferences'
  | 'verification'
  | 'onboarded';

interface ProtectedRouteProps {
  children: React.ReactNode;
  step?: StepRequirement;
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

  // 1. If accessing legacy Basic Profile page, redirect directly to Complete Profile:
  if (currentPath === '/complete-basic-profile') {
    return <Navigate to="/profile/complete" replace />;
  }

  // 2. If accessing Complete Profile page:
  if (currentPath === '/profile/complete' || step === 'complete_profile') {
    return <>{children}</>;
  }

  // 3. If accessing Partner Preferences page:
  if (currentPath === '/preferences' || step === 'partner_preferences') {
    if (!onboardingStatus.complete_profile_completed) {
      return <Navigate to="/profile/complete" replace />;
    }
    return <>{children}</>;
  }

  // 4. If accessing Verification page:
  if (
    currentPath === '/verification' ||
    currentPath === '/profile/identity-verification' ||
    step === 'verification'
  ) {
    if (!onboardingStatus.complete_profile_completed) {
      return <Navigate to="/profile/complete" replace />;
    }
    if (!onboardingStatus.partner_preferences_completed) {
      return <Navigate to="/preferences" replace />;
    }
    return <>{children}</>;
  }

  // 5. Verification check (Verify Now vs. Verify Later as per Section 10.1)
  const isVerificationCompleted =
    Boolean(onboardingStatus.verification_completed) ||
    onboardingStatus.verification_status === 'VERIFIED' ||
    localStorage.getItem('verification_completed') === 'true' ||
    localStorage.getItem('verification_skipped') === 'true' ||
    Boolean((onboardingStatus as any).verification_skipped);

  if (!onboardingStatus.complete_profile_completed) {
    return <Navigate to="/profile/complete" replace />;
  }

  if (!onboardingStatus.partner_preferences_completed) {
    return <Navigate to="/preferences" replace />;
  }

  // If verification is not completed, redirect strictly to verification
  if (!isVerificationCompleted) {
    return <Navigate to="/verification" replace />;
  }

  return <>{children}</>;
};


