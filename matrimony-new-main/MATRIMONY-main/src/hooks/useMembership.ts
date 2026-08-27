import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membershipApi } from '../api/membershipApi';
import type { MyMembershipOut, ApiMembershipPlan } from '../types/membershipTypes';

export const membershipKeys = {
  all: ['membership'] as const,
  myMembership: () => [...membershipKeys.all, 'my-membership'] as const,
  plans: () => [...membershipKeys.all, 'plans'] as const,
};

export function useMyMembership() {
  const hasToken = !!localStorage.getItem('access_token');
  return useQuery<MyMembershipOut, Error>({
    queryKey: membershipKeys.myMembership(),
    queryFn: () => membershipApi.getMyMembership(),
    enabled: hasToken,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000
  });
}

export function useMembershipPlans() {
  return useQuery<ApiMembershipPlan[], Error>({
    queryKey: membershipKeys.plans(),
    queryFn: () => membershipApi.getPlans(),
    staleTime: 5 * 60 * 1000,
  });
}
