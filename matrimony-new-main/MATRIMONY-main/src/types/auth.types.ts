// ──────────────────────────────────────────────────────────────
// Auth API Types — derived from Swagger /api/openapi.json
// ──────────────────────────────────────────────────────────────

/** POST /api/register → RegisterSchema */
export interface RegisterRequestAPI {
  register_for: string;              // required
  first_name: string;                // required
  last_name?: string | null;         // optional
  gender: string;                    // required
  date_of_birth: string;             // required, YYYY-MM-DD
  email?: string | null;             // optional, email format
  phone: string;                     // required
  password: string;                  // required
  confirm_password: string;          // required
  accept_terms: boolean;             // required
}

/** POST /api/login → LoginSchema */
export interface LoginRequestAPI {
  phone_or_email: string;            // required — can be phone or email
  password: string;                  // required
}

/** POST /api/send-mobile-otp → SendOTPSchema */
export interface SendOTPRequest {
  phone: string;                     // required
}

/** POST /api/verify-mobile-otp → VerifyOTPSchema */
export interface VerifyOTPRequest {
  phone: string;                     // required
  otp: string;                       // required
}

/** POST /api/forgot-password-send-otp → ForgotPasswordSendOTPSchema */
export interface ForgotPasswordSendOTPRequest {
  phone_or_email: string;            // required
}

/** POST /api/forgot-password-verify-otp → ForgotPasswordVerifyOTPSchema */
export interface ForgotPasswordVerifyOTPRequest {
  phone_or_email: string;            // required
  otp: string;                       // required
}

/** POST /api/forgot-password-reset → ForgotPasswordResetSchema */
export interface ForgotPasswordResetRequest {
  phone_or_email: string;            // required
  password: string;                  // required
  confirm_password: string;          // required
  otp: string;                       // required
}

/** Generic error response from backend */
export interface AuthErrorResponse {
  success?: boolean;
  message: string;
}

/** Generic success response */
export interface AuthSuccessResponse {
  success?: boolean;
  message?: string;
  access_token?: string;
  refresh_token?: string;
  [key: string]: any;
}
