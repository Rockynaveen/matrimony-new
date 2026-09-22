import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membershipApi } from '../api/membershipApi';
import type { MyMembershipOut, ApiMembershipPlan } from '../types/membershipTypes';

export const membershipKeys = {
  all: ['membership'] as const,
  myMembership: () => [...membershipKeys.all, 'my-membership'] as const,
  plans: () => [...membershipKeys.all, 'plans'] as const,
};

export function useMyMembership() {
  return useQuery<MyMembershipOut, Error>({
    queryKey: membershipKeys.myMembership(),
    queryFn: () => membershipApi.getMyMembership(),
    initialData: () => {
      const local = membershipApi.getLocalActiveMembership();
      if (local) return local;
      const storedCredits = localStorage.getItem('user_membership_credits');
      const credits = storedCredits !== null && !isNaN(Number(storedCredits)) ? Number(storedCredits) : 3;
      return {
        plan_name: 'Free',
        price: 0,
        profile_credits: 3,
        used_credits: Math.max(0, 3 - credits),
        remaining_credits: credits,
        validity_days: null,
        expires_at: null
      };
    },
    staleTime: 5 * 1000
  });
}

export function useMembershipPlans() {
  return useQuery<ApiMembershipPlan[], Error>({
    queryKey: membershipKeys.plans(),
    queryFn: () => membershipApi.getPlans(),
    staleTime: 5 * 60 * 1000,
  });
}
