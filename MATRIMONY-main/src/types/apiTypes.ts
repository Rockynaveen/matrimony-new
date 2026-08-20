export type GenderType = 'Male' | 'Female' | 'Other';

export interface RegisterRequest {
  register_for: 'SELF' | 'SON' | 'DAUGHTER' | 'BROTHER' | 'SISTER' | 'FRIEND' | 'RELATIVE';
  first_name: string;
  last_name: string;
  gender: GenderType;
  date_of_birth: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  accept_terms: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

export interface GoogleRegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  google_id: string;
}

export interface GoogleLoginRequest {
  id_token?: string;
  google_id?: string;
  email?: string;
  action?: string;
  gender?: string | null;
  register_for?: string | null;
  date_of_birth?: string | null;
  phone?: string | null;
}

export interface PatchBasicProfileRequest {
  gender: GenderType | string;
  date_of_birth: string;
  phone: string;
  register_for?: string;
  password?: string;
  confirm_password?: string;
}

export interface DetailedProfileRequest {
  id?: number;
  profile_photo?: string;
  photo_url?: string;
  video_introduction?: string;
  video_url?: string;
  about_me?: string;
  height?: string;
  weight?: string;
  complexion?: string;
  highest_education?: string;
  occupation?: string;
  annual_income?: string;
  religion?: string;
  caste?: string;
  subcaste?: string;
  rashi?: string;
  nakshatra?: string;
  dosha?: string;
  family_information?: string;
  family_type?: string;
  family_values?: string;
  family_status?: string;
  father_occupation?: string;
  mother_occupation?: string;
  siblings?: string;
  diet?: string;
  smoking?: string;
  drinking?: string;
  languages_known?: string | string[];
  hobbies_interests?: string;
  hobbies?: string[];
  marital_status?: string;
  disability_information?: string;
  disability_info?: string;
  country?: string;
  state?: string;
  city?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileApiResponse {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  is_basic_complete: boolean;
  is_detailed_complete: boolean;
  is_preferences_complete?: boolean;
  profile_completion_percentage: number;
  detailed_profile?: DetailedProfileRequest;
}

export interface UserBasicOut {
  id: number | string;
  first_name?: string;
  last_name?: string;
  email?: string;
  profile_photo?: string;
}

export interface UserReportOut {
  id: number;
  reporter?: UserBasicOut;
  reported_user?: UserBasicOut;
  reason: string;
  description?: string | null;
  is_resolved: boolean;
  created_at: string;
}

export interface UserReportCreateIn {
  reporter_id?: number;
  reported_user_id: number;
  reason: string;
  description?: string;
}

export interface PhotoRequestOut {
  id: number;
  requester?: UserBasicOut;
  profile_owner?: UserBasicOut;
  status: 'pending' | 'approved' | 'rejected' | string;
  created_at: string;
  responded_at?: string | null;
}

export interface PhotoAccessRequestCreateIn {
  requester_id?: number;
  profile_owner_id: number;
}
