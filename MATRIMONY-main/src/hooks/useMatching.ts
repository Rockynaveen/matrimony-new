import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchingApi } from '../api/matchingApi';
import type {
  InterestSendSchema,
  InterestUpdateSchema,
  ShortlistCreateSchema,
  IgnoreCreateSchema,
  BlockCreateSchema
} from '../types/matching.types';

export const matchingKeys = {
  all: ['matching'] as const,
  recommendations: () => [...matchingKeys.all, 'recommendations'] as const,
  sentInterests: () => [...matchingKeys.all, 'interests', 'sent'] as const,
  receivedInterests: () => [...matchingKeys.all, 'interests', 'received'] as const,
  interestDetail: (id: number) => [...matchingKeys.all, 'interests', 'detail', id] as const,
  shortlist: () => [...matchingKeys.all, 'shortlist'] as const,
  ignored: () => [...matchingKeys.all, 'ignored'] as const,
  blocked: () => [...matchingKeys.all, 'blocked'] as const,
};

// 1. Recommendations Query
export function useRecommendations() {
  const hasToken = !!localStorage.getItem('access_token');
  return useQuery({
    queryKey: matchingKeys.recommendations(),
    queryFn: () => matchingApi.getRecommendations(),
    staleTime: 2 * 60 * 1000, // 2 mins
    enabled: hasToken,
  });
}

// 2. Send Interest Mutation
export function useSendInterest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InterestSendSchema) => matchingApi.sendInterest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchingKeys.sentInterests() });
    }
  });
}

// 3. Sent Interests Query
export function useSentInterests() {
  const hasToken = !!localStorage.getItem('access_token');
  return useQuery({
    queryKey: matchingKeys.sentInterests(),
    queryFn: () => matchingApi.getSentInterests(),
    enabled: hasToken,
  });
}

// 4. Received Interests Query
export function useReceivedInterests() {
  const hasToken = !!localStorage.getItem('access_token');
  return useQuery({
    queryKey: matchingKeys.receivedInterests(),
    queryFn: () => matchingApi.getReceivedInterests(),
    enabled: hasToken,
  });
}

// 5. Get Individual Interest Query
export function useInterest(interestId: number) {
  return useQuery({
    queryKey: matchingKeys.interestDetail(interestId),
    queryFn: () => matchingApi.getInterest(interestId),
    enabled: !!interestId,
  });
}

// 6. Update Interest Mutation
export function useUpdateInterest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ interestId, payload }: { interestId: number; payload: InterestUpdateSchema }) =>
      matchingApi.updateInterest(interestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchingKeys.receivedInterests() });
      queryClient.invalidateQueries({ queryKey: matchingKeys.sentInterests() });
    }
  });
}

// 6.5. Delete / Withdraw Interest Mutation
export function useDeleteInterest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (interestId: number) => matchingApi.deleteInterest(interestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchingKeys.sentInterests() });
      queryClient.invalidateQueries({ queryKey: matchingKeys.receivedInterests() });
    }
  });
}

// 7. Add to Shortlist Mutation
export function useAddToShortlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ShortlistCreateSchema) => matchingApi.addToShortlist(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchingKeys.shortlist() });
      queryClient.invalidateQueries({ queryKey: matchingKeys.recommendations() });
    }
  });
}

// 8. Shortlisted Profiles Query
export function useShortlist() {
  const hasToken = !!localStorage.getItem('access_token');
  return useQuery({
    queryKey: matchingKeys.shortlist(),
    queryFn: () => matchingApi.getShortlist(),
    enabled: hasToken,
  });
}

// 9. Remove from Shortlist Mutation
export function useRemoveFromShortlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => matchingApi.removeFromShortlist(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchingKeys.shortlist() });
      queryClient.invalidateQueries({ queryKey: matchingKeys.recommendations() });
    }
  });
}

// 10. Add to Ignore Mutation
export function useAddToIgnore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: IgnoreCreateSchema) => matchingApi.addToIgnore(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchingKeys.ignored() });
      queryClient.invalidateQueries({ queryKey: matchingKeys.recommendations() });
      queryClient.invalidateQueries({ queryKey: matchingKeys.receivedInterests() });
      queryClient.invalidateQueries({ queryKey: matchingKeys.sentInterests() });
      queryClient.invalidateQueries({ queryKey: matchingKeys.all });
    }
  });
}

// 11. Ignored Profiles Query
export function useIgnoredProfiles() {
  const hasToken = !!localStorage.getItem('access_token');
  return useQuery({
    queryKey: matchingKeys.ignored(),
    queryFn: () => matchingApi.getIgnoredProfiles(),
    enabled: hasToken,
  });
}

// 12. Remove from Ignore Mutation
export function useRemoveFromIgnore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => matchingApi.removeFromIgnore(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchingKeys.ignored() });
      queryClient.invalidateQueries({ queryKey: matchingKeys.recommendations() });
    }
  });
}

// 13. Block Profile Mutation
export function useBlockProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BlockCreateSchema) => matchingApi.blockProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchingKeys.blocked() });
      queryClient.invalidateQueries({ queryKey: matchingKeys.recommendations() });
      queryClient.invalidateQueries({ queryKey: matchingKeys.shortlist() });
      queryClient.invalidateQueries({ queryKey: matchingKeys.receivedInterests() });
      queryClient.invalidateQueries({ queryKey: matchingKeys.sentInterests() });
      queryClient.invalidateQueries({ queryKey: matchingKeys.all });
    }
  });
}

// 14. Blocked Profiles Query
export function useBlockedProfiles() {
  const hasToken = !!localStorage.getItem('access_token');
  return useQuery({
    queryKey: matchingKeys.blocked(),
    queryFn: () => matchingApi.getBlockedProfiles(),
    enabled: hasToken,
  });
}

// 15. Unblock Profile Mutation
export function useUnblockProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => matchingApi.unblockProfile(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchingKeys.blocked() });
      queryClient.invalidateQueries({ queryKey: matchingKeys.recommendations() });
    }
  });
}
