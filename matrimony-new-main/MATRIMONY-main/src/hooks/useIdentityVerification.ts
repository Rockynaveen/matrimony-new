import { useState, useCallback, useEffect } from 'react';
import {
  identityVerificationService,
  IdentityVerificationServiceError
} from '../services/identityVerification.service';
import type {
  NormalizedVerificationState,
  IdentityDocumentUploadPayload,
  DocumentUploadVerificationOut
} from '../types/identityVerification.types';
import { useApp } from '../context/AppContext';

export interface UseIdentityVerificationReturn {
  status: NormalizedVerificationState | null;
  latestResult: DocumentUploadVerificationOut | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  successMessage: string | null;
  fetchStatus: () => Promise<NormalizedVerificationState | null>;
  submitVerification: (payload: IdentityDocumentUploadPayload) => Promise<DocumentUploadVerificationOut | null>;
  resetError: () => void;
  resetSuccess: () => void;
}

export function useIdentityVerification(autoFetch = true): UseIdentityVerificationReturn {
  const [status, setStatus] = useState<NormalizedVerificationState | null>(null);
  const [latestResult, setLatestResult] = useState<DocumentUploadVerificationOut | null>(() => {
    try {
      const stored = localStorage.getItem('latest_verification_result');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(autoFetch);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    saveStoredOnboardingStatus,
    setOnboardingStatusState,
    setVerificationStatusState,
    setCurrentUserStore,
    currentUser
  } = useApp();

  const fetchStatus = useCallback(async (): Promise<NormalizedVerificationState | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await identityVerificationService.getVerificationStatus();
      setStatus(result);

      const currentEmail = (localStorage.getItem('logged_in_email') || currentUser?.email || '').toLowerCase().trim();
      if (result.code === 'VERIFIED') {
        saveStoredOnboardingStatus({
          verification_completed: true,
          verification_status: 'VERIFIED',
          rejection_reason: null
        }, currentEmail);
        setVerificationStatusState('VERIFIED');
        setCurrentUserStore({ verified: true });
        localStorage.setItem('verification_completed', 'true');
      } else if (result.code === 'PENDING') {
        saveStoredOnboardingStatus({
          verification_completed: true,
          verification_status: 'PENDING',
          rejection_reason: null
        }, currentEmail);
        setVerificationStatusState('PENDING');
      } else if (result.code === 'REJECTED') {
        saveStoredOnboardingStatus({
          verification_completed: false,
          verification_status: 'REJECTED',
          rejection_reason: result.adminReviewMessage || result.message
        }, currentEmail);
        setVerificationStatusState('REJECTED');
        setCurrentUserStore({ verified: false });
        localStorage.removeItem('verification_completed');
      }

      return result;
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to retrieve identity verification status.';
      setError(errMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [saveStoredOnboardingStatus, setOnboardingStatusState, setVerificationStatusState, setCurrentUserStore, currentUser?.email]);

  const submitVerification = useCallback(
    async (payload: IdentityDocumentUploadPayload): Promise<DocumentUploadVerificationOut | null> => {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      try {
        const response = await identityVerificationService.uploadIdentityDocument(payload);
        setLatestResult(response);
        try {
          localStorage.setItem('latest_verification_result', JSON.stringify(response));
        } catch {}

        const currentEmail = (localStorage.getItem('logged_in_email') || currentUser?.email || '').toLowerCase().trim();

        if (response.success && (response.verification_status === 'VERIFIED' || response.status === 'VERIFIED' || response.status === 'SUCCESS')) {
          setSuccessMessage(response.message || 'Identity verified successfully! Green trust badge granted.');
          saveStoredOnboardingStatus({
            verification_completed: true,
            verification_status: 'VERIFIED',
            rejection_reason: null
          }, currentEmail);
          setVerificationStatusState('VERIFIED');
          setCurrentUserStore({ verified: true });
          localStorage.setItem('verification_completed', 'true');
        } else if (response.status === 'PENDING' || response.verification_status === 'PENDING') {
          setSuccessMessage(response.message || 'Verification submitted for safety review.');
          saveStoredOnboardingStatus({
            verification_completed: true,
            verification_status: 'PENDING',
            rejection_reason: null
          }, currentEmail);
          setVerificationStatusState('PENDING');
        } else {
          setSuccessMessage(response.message || 'Document uploaded successfully.');
        }

        // Refresh latest status from backend
        await fetchStatus();
        return response;
      } catch (err: any) {
        let msg = 'Unable to submit your verification right now. Please check your documents and try again.';
        if (err instanceof IdentityVerificationServiceError) {
          msg = err.message;
        } else if (err?.message) {
          msg = err.message;
        }
        setError(msg);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchStatus, saveStoredOnboardingStatus, setOnboardingStatusState, setVerificationStatusState, setCurrentUserStore, currentUser?.email]
  );

  const resetError = useCallback(() => setError(null), []);
  const resetSuccess = useCallback(() => setSuccessMessage(null), []);

  useEffect(() => {
    if (autoFetch) {
      fetchStatus();
    }
  }, [autoFetch, fetchStatus]);

  return {
    status,
    latestResult,
    isLoading,
    isSubmitting,
    error,
    successMessage,
    fetchStatus,
    submitVerification,
    resetError,
    resetSuccess
  };
}
