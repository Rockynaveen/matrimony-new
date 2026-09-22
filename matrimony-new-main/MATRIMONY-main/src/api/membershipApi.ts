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
   * POST /membership/plans/
   * Create a new membership plan (Admin / Super Admin)
   */
  createPlan: async (payload: CreatePlanPayload): Promise<ApiMembershipPlan> => {
    const response = await axiosClient.post<any>('/membership/plans/', payload);
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
    try {
      const response = await axiosClient.get<any>('/membership/user-memberships/');
      if (response.status >= 200 && response.status < 300) {
        const data = response.data;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.results)
          ? data.results
          : data && typeof data === 'object' && data.id
          ? [data]
          : [];
        if (list.length > 0) return list;
      }
    } catch {}

    // Fallback to local membership history
    try {
      const localHistory = localStorage.getItem('user_memberships_history');
      if (localHistory) {
        const parsed = JSON.parse(localHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (_) {}

    return [];
  },

  /**
   * GET /membership/user-memberships/by-user/{userId}
   * Fetch specific user membership details by User ID
   */
  getUserMembershipByUserId: async (userId: string | number): Promise<ApiUserMembership | ApiUserMembership[] | null> => {
    try {
      const response = await axiosClient.get<any>(`/membership/user-memberships/by-user/${userId}`);
      if (response.status >= 200 && response.status < 300) {
        const data = response.data;
        if (data?.data) return data.data;
        return data;
      }
    } catch {}

    try {
      const localHistory = localStorage.getItem('user_memberships_history');
      if (localHistory) {
        const parsed = JSON.parse(localHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0];
        }
      }
    } catch (_) {}

    return null;
  },

  /**
   * GET /membership/transactions/
   * Fetch transaction logs
   */
  getTransactions: async (): Promise<ApiTransaction[]> => {
    let apiList: ApiTransaction[] = [];
    try {
      const response = await axiosClient.get<any>('/membership/transactions/');
      if (response.status >= 200 && response.status < 300) {
        const data = response.data;
        if (Array.isArray(data)) apiList = data;
        else if (Array.isArray(data?.data)) apiList = data.data;
        else if (Array.isArray(data?.results)) apiList = data.results;
      }
    } catch {}

    // Merge with local offline/online transactions
    try {
      const localTxns = JSON.parse(localStorage.getItem('user_membership_transactions') || '[]');
      if (Array.isArray(localTxns) && localTxns.length > 0) {
        const combined = [...localTxns, ...apiList];
        const seen = new Set<string>();
        return combined.filter(t => {
          const key = t.transaction_id || String(t.id);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }
    } catch (_) {}

    return apiList;
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
   * Helper: Get locally active membership details if present
   */
  getLocalActiveMembership: (): import('../types/membershipTypes').MyMembershipOut | null => {
    try {
      const stored = localStorage.getItem('user_active_membership');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.plan_name) {
          return parsed;
        }
      }
    } catch (_) {}
    return null;
  },

  /**
   * Activate a plan locally and update user credits and transactions history
   */
  activatePlanLocally: (plan: ApiMembershipPlan | any, meta?: any): import('../types/membershipTypes').MyMembershipOut => {
    const planName = plan.name || 'Premium';
    const numericPrice = typeof plan.price === 'string' ? parseFloat(plan.price) : Number(plan.price || 0);
    const profileCredits = Number(plan.profile_credits ?? 10);
    const validityDays = plan.validity_days ? Number(plan.validity_days) : 365;
    const expiresAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString();

    const activeObj: import('../types/membershipTypes').MyMembershipOut = {
      plan_name: planName,
      price: isNaN(numericPrice) ? 0 : numericPrice,
      profile_credits: profileCredits,
      used_credits: 0,
      remaining_credits: profileCredits,
      validity_days: validityDays,
      expires_at: expiresAt
    };

    localStorage.setItem('user_active_membership', JSON.stringify(activeObj));
    localStorage.setItem('user_membership_credits', String(profileCredits));

    try {
      const existingTxns = JSON.parse(localStorage.getItem('user_membership_transactions') || '[]');
      const newTxn: ApiTransaction = {
        id: Date.now(),
        customer_name: meta?.customer_name || localStorage.getItem('logged_in_name') || 'Member',
        customer_email: meta?.customer_email || localStorage.getItem('logged_in_email') || 'member@example.com',
        customer_phone: meta?.customer_phone || '',
        plan: {
          id: plan.id || 1,
          name: planName,
          price: isNaN(numericPrice) ? 0 : numericPrice,
          profile_credits: profileCredits,
          validity_days: validityDays,
          profile_boost_count: plan.profile_boost_count || 5,
          is_featured_profile: Boolean(plan.is_featured_profile),
          unlimited_messaging: Boolean(plan.unlimited_messaging),
          is_active: true
        },
        purchase_type: meta?.purchase_type || 'ONLINE',
        amount: isNaN(numericPrice) ? 0 : numericPrice,
        payment_method: meta?.payment_method || 'Razorpay UPI / Cards',
        payment_status: 'SUCCESS',
        transaction_id: meta?.transaction_id || meta?.razorpay_payment_id || `TXN-${Date.now()}`,
        invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        created_at: new Date().toISOString()
      };
      existingTxns.unshift(newTxn);
      localStorage.setItem('user_membership_transactions', JSON.stringify(existingTxns));

      const existingMemberships = JSON.parse(localStorage.getItem('user_memberships_history') || '[]');
      const newMembershipEntry: ApiUserMembership = {
        id: Date.now(),
        user: {
          id: Number(localStorage.getItem('user_id')) || 1,
          first_name: localStorage.getItem('logged_in_name') || 'Member',
          last_name: '',
          phone: null,
          email: localStorage.getItem('logged_in_email')
        },
        plan: {
          id: plan.id || 1,
          name: planName,
          price: isNaN(numericPrice) ? 0 : numericPrice,
          profile_credits: profileCredits,
          validity_days: validityDays,
          profile_boost_count: plan.profile_boost_count || 5,
          is_featured_profile: Boolean(plan.is_featured_profile),
          unlimited_messaging: Boolean(plan.unlimited_messaging),
          is_active: true
        },
        remaining_credits: profileCredits,
        remaining_boosts: plan.profile_boost_count || 5,
        purchased_at: new Date().toISOString(),
        expires_at: expiresAt,
        is_active: true
      };
      const updatedMemberships = [newMembershipEntry, ...existingMemberships.map((m: any) => ({ ...m, is_active: false }))];
      localStorage.setItem('user_memberships_history', JSON.stringify(updatedMemberships));
    } catch (_) {}

    return activeObj;
  },

  /**
   * Consume 1 contact credit when user unlocks a profile
   */
  consumeCredit: (): number => {
    try {
      const active = membershipApi.getLocalActiveMembership();
      if (active && active.remaining_credits > 0) {
        active.remaining_credits -= 1;
        active.used_credits = (active.used_credits || 0) + 1;
        localStorage.setItem('user_active_membership', JSON.stringify(active));
        localStorage.setItem('user_membership_credits', String(active.remaining_credits));

        try {
          const history = JSON.parse(localStorage.getItem('user_memberships_history') || '[]');
          if (Array.isArray(history) && history.length > 0) {
            history[0].remaining_credits = active.remaining_credits;
            localStorage.setItem('user_memberships_history', JSON.stringify(history));
          }
        } catch (_) {}

        return active.remaining_credits;
      }
    } catch (_) {}
    return 0;
  },

  /**
   * GET /api/membership/my-membership/
   * Fetch user's active membership plan & remaining profile credits
   */
  getMyMembership: async (): Promise<import('../types/membershipTypes').MyMembershipOut> => {
    const localActive = membershipApi.getLocalActiveMembership();

    const candidateUrls = [
      '/membership/my-membership/',
      '/membership/my-membership',
      '/membership/me/',
      '/membership/me'
    ];

    for (const url of candidateUrls) {
      try {
        const response = await axiosClient.get<any>(url);
        if (response.status >= 200 && response.status < 300 && response.data) {
          const data = response.data.data || response.data;
          if (data && (data.plan_name || data.plan?.name) && data.plan_name !== 'Free' && data.plan?.name !== 'Free') {
            const apiResult = {
              plan_name: data.plan_name || data.plan?.name || 'Free',
              price: Number(data.price || data.plan?.price || 0),
              profile_credits: Number(data.profile_credits ?? data.plan?.profile_credits ?? 4),
              used_credits: Number(data.used_credits ?? 0),
              remaining_credits: Number(data.remaining_credits ?? (localActive?.remaining_credits ?? 3)),
              validity_days: data.validity_days ?? data.plan?.validity_days ?? null,
              expires_at: data.expires_at ?? null
            };
            localStorage.setItem('user_active_membership', JSON.stringify(apiResult));
            return apiResult;
          }
        }
      } catch {
        continue;
      }
    }

    if (localActive) {
      return localActive;
    }

    return {
      plan_name: 'Free',
      price: 0.00,
      profile_credits: 4,
      used_credits: 1,
      remaining_credits: 3,
      validity_days: null,
      expires_at: null
    };
  }
};
