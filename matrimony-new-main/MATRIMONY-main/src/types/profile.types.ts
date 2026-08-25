// ──────────────────────────────────────────────────────────────
// Profile API Types — derived from Swagger /api/openapi.json
// ──────────────────────────────────────────────────────────────

/** GET /api/profile/ → ProfileOut */
export interface ProfileOutAPI {
  id: number | null;
  profile_photo: string | null;
  video_introduction: string | null;
  about_me: string | null;
  height: string;                    // numeric string, required
  weight: string | null;             // numeric string
  complexion: string | null;
  highest_education: string;         // required, max 255
  occupation: string;                // required, max 255
  annual_income: string | null;      // numeric string
  religion: string;                  // required, max 100
  caste: string | null;
  rashi: string | null;
  nakshatra: string | null;
  dosha: string | null;
  family_information: string | null;
  diet: string;                      // required, max 20
  smoking: string;                   // required, max 20
  drinking: string;                  // required, max 20
  languages_known: string;           // required, comma-separated, max 255
  hobbies_interests: string | null;
  marital_status: string;            // required, max 20
  disability_information: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  video_type?: 'UPLOAD' | 'YOUTUBE' | 'EXTERNAL' | null;
  video_url?: string | null;
  hide_photos?: boolean;
  is_private_profile?: boolean;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  is_basic_complete?: boolean;
  is_detailed_complete?: boolean;
  profile_completion_percentage?: number;
  is_verified?: boolean;
  created_at: string;                // ISO datetime, required
  updated_at: string;                // ISO datetime, required
}

/** POST /api/profile/ → ProfileIn  (height, weight, annual_income are number) */
export interface ProfileCreateRequest {
  profile_photo?: string | null;
  video_introduction?: string | null;
  about_me?: string;
  height: number;                    // required
  weight?: number | null;
  complexion?: string;
  highest_education: string;         // required
  occupation: string;                // required
  annual_income?: number | null;
  religion: string;                  // required
  caste?: string;
  rashi?: string;
  nakshatra?: string;
  dosha?: string;
  family_information?: string;
  diet: string;                      // required
  smoking: string;                   // required
  drinking: string;                  // required
  languages_known: string;           // required
  hobbies_interests?: string;
  marital_status: string;            // required
  disability_information?: string;
  country?: string;
  state?: string;
  city?: string;
}

/** PUT /api/profile/ → ProfileUpdate  (all fields optional, numbers nullable) */
export interface ProfileUpdateRequest {
  profile_photo?: string | null;
  video_introduction?: string | null;
  about_me?: string | null;
  height?: number | null;
  weight?: number | null;
  complexion?: string | null;
  highest_education?: string | null;
  occupation?: string | null;
  annual_income?: number | null;
  religion?: string | null;
  caste?: string | null;
  rashi?: string | null;
  nakshatra?: string | null;
  dosha?: string | null;
  family_information?: string | null;
  diet?: string | null;
  smoking?: string | null;
  drinking?: string | null;
  languages_known?: string | null;
  hobbies_interests?: string | null;
  marital_status?: string | null;
  disability_information?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
}

/** PATCH /api/profile/basic → BasicProfileUpdateSchema */
export interface BasicProfileUpdateRequest {
  gender: string;
  date_of_birth: string;            // YYYY-MM-DD
  phone: string;
  register_for?: string | null;
  password?: string;
  confirm_password?: string;
}

/** Standard API error shape */
export interface APIErrorResponse {
  success?: boolean;
  message: string;
}

/** Profile Video API Types */
export interface ProfileVideoAPI {
  video_url?: string | null;
  video_id?: string | number | null;
  video_introduction?: string | null;
  message?: string;
  success?: boolean;
}

export interface ProfileVideoUploadResponse {
  success: boolean;
  video_url?: string;
  message?: string;
}

export interface ProfileVideoDeleteResponse {
  success: boolean;
  message: string;
}

