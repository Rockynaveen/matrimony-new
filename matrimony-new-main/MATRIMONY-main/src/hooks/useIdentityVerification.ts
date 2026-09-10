import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { verificationService } from '../services/verification.service';
import type { VerificationStatusResponse, VerificationState } from '../types/apiTypes';

export const identityKeys = {
  all: ['identity'] as const,
  verificationStatus: () => [...identityKeys.all, 'verification', 'status'] as const,
};

/**
 * Hook to query live Identity Verification Status
 * Calls GET https://matrimony-production-4b00.up.railway.app/api/identity/verification/status
 */
export function useIdentityVerificationStatus() {
  const hasToken = Boolean(localStorage.getItem('access_token'));

  return useQuery<VerificationStatusResponse, Error>({
    queryKey: identityKeys.verificationStatus(),
    queryFn: () => verificationService.getVerificationStatus(),
    enabled: hasToken,
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: (query) => {
      // Auto-poll every 10 seconds if currently in review/pending
      const currentStatus = query.state.data?.status;
      return currentStatus === 'PENDING' ? 10000 : false;
    }
  });
}

/**
 * Hook to submit identity verification documents
 * Calls POST https://matrimony-production-4b00.up.railway.app/api/identity/verify/document-upload
 */
export function useSubmitVerificationDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => verificationService.submitVerification(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: identityKeys.verificationStatus() });
    }
  });
}
