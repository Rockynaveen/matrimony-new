// ──────────────────────────────────────────────────────────────
// Auth Service — thin wrapper around axiosClient for auth endpoints
// Maps to the exact Swagger contract:
//   POST /api/register                      → register
//   POST /api/login                         → login
//   POST /api/send-mobile-otp              → sendMobileOtp
//   POST /api/verify-mobile-otp            → verifyMobileOtp
//   POST /api/forgot-password-send-otp     → forgotPasswordSendOtp
//   POST /api/forgot-password-verify-otp   → forgotPasswordVerifyOtp
//   POST /api/forgot-password-reset        → forgotPasswordReset
// ──────────────────────────────────────────────────────────────

import { axiosClient } from '../api/axiosClient';
import type {
  RegisterRequestAPI,
  LoginRequestAPI,
  SendOTPRequest,
  VerifyOTPRequest,
  ForgotPasswordSendOTPRequest,
  ForgotPasswordVerifyOTPRequest,
  ForgotPasswordResetRequest,
  AuthSuccessResponse,
} from '../types/auth.types';

class AuthServiceError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthServiceError';
    this.status = status;
  }
}

/** Extract a human-readable error from any API response */
function extractErrorMessage(data: any, fallback: string): string {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (data.detail) {
    if (Array.isArray(data.detail)) {
      return data.detail.map((e: any) => `${e.loc?.join('.') || ''}: ${e.msg}`).join('; ');
    }
    return String(data.detail);
  }
  if (data.message) return String(data.message);
  return fallback;
}

export const authService = {
  async sendMobileOtp(payload: SendOTPRequest): Promise<AuthSuccessResponse> {
    const res = await axiosClient.post<AuthSuccessResponse>('/send-mobile-otp', payload);
    if (res.status >= 200 && res.status < 300) return res.data;
    throw new AuthServiceError(extractErrorMessage(res.data, 'Failed to send OTP'), res.status);
  },

  async verifyMobileOtp(payload: VerifyOTPRequest): Promise<AuthSuccessResponse> {
    const res = await axiosClient.post<AuthSuccessResponse>('/verify-mobile-otp', payload);
    if (res.status >= 200 && res.status < 300) return res.data;
    throw new AuthServiceError(extractErrorMessage(res.data, 'OTP verification failed'), res.status);
  },

  async register(payload: RegisterRequestAPI): Promise<AuthSuccessResponse> {
    const res = await axiosClient.post<any>('/register', payload);

    if (res.status >= 200 && res.status < 300) {
      const accessToken = res.data?.data?.access_token || res.data?.access_token;
      const refreshToken = res.data?.data?.refresh_token || res.data?.refresh_token;

      if (accessToken) {
        localStorage.setItem('access_token', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      return res.data;
    }

    throw new AuthServiceError(extractErrorMessage(res.data, 'Registration failed'), res.status);
  },

  async login(payload: LoginRequestAPI): Promise<AuthSuccessResponse> {
    const res = await axiosClient.post<any>('/login', payload);

    if (res.status >= 200 && res.status < 300) {
      const accessToken = res.data?.data?.access_token || res.data?.access_token;
      const refreshToken = res.data?.data?.refresh_token || res.data?.refresh_token;

      if (accessToken) {
        localStorage.setItem('access_token', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      return res.data;
    }

    throw new AuthServiceError(extractErrorMessage(res.data, 'Login failed. Please check your credentials.'), res.status);
  },

  async forgotPasswordSendOtp(payload: ForgotPasswordSendOTPRequest): Promise<AuthSuccessResponse> {
    const res = await axiosClient.post<AuthSuccessResponse>('/forgot-password-send-otp', payload);
    if (res.status >= 200 && res.status < 300) return res.data;
    throw new AuthServiceError(extractErrorMessage(res.data, 'Failed to send recovery OTP'), res.status);
  },

  async forgotPasswordVerifyOtp(payload: ForgotPasswordVerifyOTPRequest): Promise<AuthSuccessResponse> {
    const res = await axiosClient.post<AuthSuccessResponse>('/forgot-password-verify-otp', payload);
    if (res.status >= 200 && res.status < 300) return res.data;
    throw new AuthServiceError(extractErrorMessage(res.data, 'OTP verification failed'), res.status);
  },

  async forgotPasswordReset(payload: ForgotPasswordResetRequest): Promise<AuthSuccessResponse> {
    const res = await axiosClient.post<AuthSuccessResponse>('/forgot-password-reset', payload);
    if (res.status >= 200 && res.status < 300) return res.data;
    throw new AuthServiceError(extractErrorMessage(res.data, 'Password reset failed'), res.status);
  },

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};
