export interface ApiMembershipPlan {
  id: number;
  uuid?: string;
  slug?: string;
  name: string;
  price: string | number;
  profile_credits: number;
  interest_credits?: number;
  validity_days: number | null;
  profile_boost_count: number;
  is_featured_profile: boolean;
  unlimited_messaging: boolean;
  is_free_trial?: boolean;
  is_active: boolean;
}

export interface CreatePlanPayload {
  name: string;
  price: number;
  profile_credits: number;
  validity_days?: number | null;
  profile_boost_count?: number;
  is_featured_profile?: boolean;
  unlimited_messaging?: boolean;
  is_active?: boolean;
  interest_credits?: number;
  is_free_trial?: boolean;
}

export interface UserBasicInfo {
  id: number;
  uuid?: string;
  slug?: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email?: string | null;
}

export interface ApiUserMembership {
  id: number;
  uuid?: string;
  user: UserBasicInfo;
  plan: ApiMembershipPlan;
  remaining_credits: number;
  remaining_interest_credits?: number;
  remaining_boosts: number;
  purchased_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export interface ApiTransaction {
  id: number;
  uuid?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  plan: ApiMembershipPlan;
  purchase_type: 'ONLINE' | 'OFFLINE' | string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | string;
  order_id: string;
  payment_id: string;
  amount: string | number;
  created_at: string;
}

export interface CreateOfflineTransactionPayload {
  user_id: number;
  plan_id: number;
  amount: number | string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  notes?: string;
  [key: string]: any;
}

export interface InitiateCheckoutPayload {
  plan_id: number;
}

export interface InitiateCheckoutResponse {
  order_id: string;
  amount_paise?: number;
  razorpay_key_id?: string;
  plan?: ApiMembershipPlan;
  [key: string]: any;
}

export interface VerifyCheckoutPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  plan_id: number;
}

export interface MyMembershipOut {
  plan_name: string;
  price: number;
  profile_credits: number;
  used_credits: number;
  remaining_credits: number;
  validity_days?: number | null;
  expires_at?: string | null;
}
