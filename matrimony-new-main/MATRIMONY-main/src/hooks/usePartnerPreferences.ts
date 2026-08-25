// ──────────────────────────────────────────────────────────────
// Partner Preferences TanStack Query Hooks
// ──────────────────────────────────────────────────────────────

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { partnerPreferencesService } from '../services/partnerPreferences.service';
import type {
  PartnerPreferenceAPI,
  PartnerPreferenceCreateRequest,
  PartnerPreferenceUpdateRequest,
} from '../types/partnerPreferences.types';

export const partnerPreferencesKeys = {
  all: ['partner-preferences'] as const,
  detail: () => [...partnerPreferencesKeys.all, 'detail'] as const,
};

// ─── GET /api/partner-preferences/ ────────────────────────────

export function usePartnerPreferences(
  options?: Omit<UseQueryOptions<PartnerPreferenceAPI | null, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<PartnerPreferenceAPI | null, Error>({
    queryKey: partnerPreferencesKeys.detail(),
    queryFn: () => partnerPreferencesService.getPreferences(),
    staleTime: 5 * 60 * 1000,
    retry: false,
    ...options,
  });
}

// ─── POST /api/partner-preferences/ ───────────────────────────

export function useCreatePartnerPreferences() {
  const queryClient = useQueryClient();

  return useMutation<PartnerPreferenceAPI, Error, PartnerPreferenceCreateRequest>({
    mutationFn: (payload) => partnerPreferencesService.createPreferences(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(partnerPreferencesKeys.detail(), data);
    },
  });
}

// ─── PUT /api/partner-preferences/ ────────────────────────────

export function useUpdatePartnerPreferences() {
  const queryClient = useQueryClient();

  return useMutation<PartnerPreferenceAPI, Error, PartnerPreferenceUpdateRequest>({
    mutationFn: (payload) => partnerPreferencesService.updatePreferences(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(partnerPreferencesKeys.detail(), data);
    },
  });
}

// ─── DELETE /api/partner-preferences/ ─────────────────────────

export function useDeletePartnerPreferences() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, Error, void>({
    mutationFn: () => partnerPreferencesService.deletePreferences(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: partnerPreferencesKeys.all });
    },
  });
}
