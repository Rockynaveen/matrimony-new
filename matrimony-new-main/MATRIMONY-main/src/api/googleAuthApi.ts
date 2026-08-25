// ──────────────────────────────────────────────────────────────
// googleAuthApi.ts — Handles /api/google-register and /api/google-login
// derived from Swagger /api/openapi.json schemas
// ──────────────────────────────────────────────────────────────

import { axiosClient } from './axiosClient';
import type { GoogleRegisterRequest, GoogleLoginRequest, AuthResponse } from '../types/apiTypes';

export interface GoogleLoginSchemaAPI {
  id_token: string;                  // required
  action?: string;                   // default "login"
  gender?: string | null;
  register_for?: string | null;
  date_of_birth?: string | null;
  phone?: string | null;
}

export const googleAuthApi = {
  /**
   * POST /api/google-register
   * Body: { first_name, last_name, email, google_id }
   * Called ONLY during Google Registration.
   */
  googleRegister: async (payload: GoogleRegisterRequest): Promise<AuthResponse> => {
    const apiPayload = {
      first_name: payload.first_name,
      last_name: payload.last_name || null,
      email: payload.email,
      google_id: payload.google_id
    };

    const response = await axiosClient.post<any>('/google-register', apiPayload);

    if (response.status >= 200 && response.status < 300) {
      const resData = response.data;
      const accessToken = resData?.data?.access_token || resData?.access_token;
      const refreshToken = resData?.data?.refresh_token || resData?.refresh_token;

      if (accessToken) {
        localStorage.setItem('access_token', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      return {
        access_token: accessToken || '',
        refresh_token: refreshToken || '',
        user: resData?.data || resData?.user
      };
    }

    const errMsg = (response.data as any)?.message || (response.data as any)?.detail || 'Google registration failed.';
    throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
  },

  /**
   * POST /api/google-login
   * Body: { id_token, action, gender, register_for, date_of_birth, phone }
   * Called ONLY during Google Login. Single network request.
   */
  googleLogin: async (payload: GoogleLoginRequest | GoogleLoginSchemaAPI): Promise<AuthResponse> => {
    const apiPayload = {
      id_token: (payload as any).id_token || (payload as any).google_id || 'google_token_id',
      action: (payload as any).action || 'login',
      gender: (payload as any).gender || null,
      register_for: (payload as any).register_for || null,
      date_of_birth: (payload as any).date_of_birth || null,
      phone: (payload as any).phone || null
    };

    const response = await axiosClient.post<any>('/google-login', apiPayload);

    if (response.status >= 200 && response.status < 300) {
      const resData = response.data;
      const accessToken = resData?.data?.access_token || resData?.access_token;
      const refreshToken = resData?.data?.refresh_token || resData?.refresh_token;

      if (accessToken) {
        localStorage.setItem('access_token', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      return {
        access_token: accessToken || '',
        refresh_token: refreshToken || '',
        user: resData?.data || resData?.user
      };
    }

    const errMsg = (response.data as any)?.message || (response.data as any)?.detail || 'Google login failed.';
    throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
  }
};
