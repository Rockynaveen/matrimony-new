import { axiosClient } from './axiosClient';
import type {
  ApiMembershipPlan,
  CreatePlanPayload,
  ApiUserMembership,
  ApiTransaction,
  CreateOfflineTransactionPayload,
  InitiateCheckoutPayload,
  InitiateCheckoutResponse,
  VerifyCheckoutPayload
} from '../types/membershipTypes';

export const membershipApi = {
  /**
   * GET /membership/plans/
   * Fetch active public membership plans
   */
  getPlans: async (): Promise<ApiMembershipPlan[]> => {
    const response = await axiosClient.get<any>('/membership/plans/');
    if (response.status >= 200 && response.status < 300) {
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data?.results)) return data.results;
      return [];
    }
    const errMsg = (response.data as any)?.message || 'Failed to fetch membership plans';
    throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
  },

  /**
   * POST /membership/plans/all
   * Create a new membership plan (Admin / Super Admin)
   */
  createPlan: async (payload: CreatePlanPayload): Promise<ApiMembershipPlan> => {
    const response = await axiosClient.post<any>('/membership/plans/all', payload);
    if (response.status >= 200 && response.status < 300) {
      const data = response.data;
      return data?.data || data;
    }
    const errMsg = (response.data as any)?.message || (response.data as any)?.detail || 'Failed to create membership plan';
    throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
  },

  /**
   * GET /membership/plans/all
   * Fetch all membership plans
   */
  getAllPlans: async (): Promise<ApiMembershipPlan[]> => {
    const response = await axiosClient.get<any>('/membership/plans/all');
    if (response.status >= 200 && response.status < 300) {
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data?.results)) return data.results;
      return [];
    }
    return membershipApi.getPlans();
  },

  /**
   * GET /membership/user-memberships/
   * Fetch user membership records
   */
  getUserMemberships: async (): Promise<ApiUserMembership[]> => {
    const response = await axiosClient.get<any>('/membership/user-memberships/');
    if (response.status >= 200 && response.status < 300) {
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data?.results)) return data.results;
      if (data && typeof data === 'object' && data.id) return [data];
      return [];
    }
    const errMsg = (response.data as any)?.message || 'Failed to fetch user memberships';
    throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
  },

  /**
   * GET /membership/user-memberships/by-user/{userId}
   * Fetch specific user membership details by User ID
   */
  getUserMembershipByUserId: async (userId: string | number): Promise<ApiUserMembership | ApiUserMembership[] | null> => {
    const response = await axiosClient.get<any>(`/membership/user-memberships/by-user/${userId}`);
    if (response.status >= 200 && response.status < 300) {
      const data = response.data;
      if (data?.data) return data.data;
      return data;
    }
    const errMsg = (response.data as any)?.message || `Failed to fetch membership for user ${userId}`;
    throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
  },

  /**
   * GET /membership/transactions/
   * Fetch transaction logs
   */
  getTransactions: async (): Promise<ApiTransaction[]> => {
    const response = await axiosClient.get<any>('/membership/transactions/');
    if (response.status >= 200 && response.status < 300) {
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data?.results)) return data.results;
      return [];
    }
    const errMsg = (response.data as any)?.message || 'Failed to fetch transaction logs';
    throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
  },

  /**
   * POST /membership/transactions/offline
   * Record an offline payment transaction
   */
  createOfflineTransaction: async (payload: CreateOfflineTransactionPayload): Promise<ApiTransaction> => {
    const apiPayload = {
      ...payload,
      plan_id: Math.trunc(Number(payload.plan_id) || 1)
    };
    const response = await axiosClient.post<any>('/membership/transactions/offline', apiPayload);
    if (response.status >= 200 && response.status < 300) {
      const data = response.data;
      return data?.data || data;
    }
    const errMsg = (response.data as any)?.message || (response.data as any)?.detail || 'Failed to record offline transaction';
    throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
  },

  /**
   * POST /membership/checkout/initiate
   * Body required by backend: { "plan_id": <int> }
   */
  initiateCheckout: async (payload: InitiateCheckoutPayload): Promise<InitiateCheckoutResponse> => {
    const planIdInt = Math.trunc(Number(payload.plan_id) || 1);
    const response = await axiosClient.post<any>('/membership/checkout/initiate', {
      plan_id: planIdInt
    });

    if (response.status >= 200 && response.status < 300) {
      const data = response.data;
      return data?.data || data;
    }

    const errMsg = (response.data as any)?.message
      || (response.data as any)?.detail
      || 'Failed to initiate checkout';
    throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
  },

  /**
   * POST /membership/checkout/verify
   * Body required by backend:
   * {
   *   "razorpay_order_id": string,
   *   "razorpay_payment_id": string,
   *   "razorpay_signature": string,
   *   "plan_id": int
   * }
   */
  verifyCheckout: async (payload: VerifyCheckoutPayload): Promise<{ success?: boolean; message?: string; [key: string]: any }> => {
    const apiPayload = {
      razorpay_order_id: payload.razorpay_order_id,
      razorpay_payment_id: payload.razorpay_payment_id,
      razorpay_signature: payload.razorpay_signature,
      plan_id: Math.trunc(Number(payload.plan_id) || 1)
    };

    const response = await axiosClient.post<any>('/membership/checkout/verify', apiPayload);

    if (response.status >= 200 && response.status < 300) {
      const data = response.data;
      return data?.data || data;
    }

    const errMsg = (response.data as any)?.message
      || (response.data as any)?.detail
      || 'Payment verification failed';
    throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
  },

  /**
   * GET /api/membership/my-membership/
   * Fetch user's active membership plan & remaining profile credits
   */
  getMyMembership: async (): Promise<import('../types/membershipTypes').MyMembershipOut> => {
    const candidateUrls = [
      '/membership/my-membership',
      '/membership/my-membership/',
      '/membership/me',
      '/membership/me/'
    ];

    for (const url of candidateUrls) {
      try {
        const response = await axiosClient.get<any>(url);
        if (response.status >= 200 && response.status < 300 && response.data) {
          const data = response.data.data || response.data;
          return {
            plan_name: data.plan_name || data.plan?.name || 'Free',
            price: Number(data.price || data.plan?.price || 0),
            profile_credits: Number(data.profile_credits ?? data.plan?.profile_credits ?? 4),
            used_credits: Number(data.used_credits ?? 0),
            remaining_credits: Number(data.remaining_credits ?? 3)
          };
        }
      } catch {
        continue;
      }
    }

    return {
      plan_name: 'Free',
      price: 0.00,
      profile_credits: 4,
      used_credits: 1,
      remaining_credits: 3
    };
  }
};
