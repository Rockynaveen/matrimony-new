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

function extractApiErrorMessage(data: any, fallback: string): string {
  if (!data) return fallback;
  if (typeof data === 'string') {
    const msgMatch = data.match(/'msg':\s*'([^']+)'/) || data.match(/"msg":\s*"([^"]+)"/);
    if (msgMatch && msgMatch[1]) {
      return msgMatch[1].replace(/^Value error,\s*/i, '');
    }
    const errMatch = data.match(/'error':\s*'([^']+)'/) || data.match(/"error":\s*"([^"]+)"/);
    if (errMatch && errMatch[1]) {
      return errMatch[1];
    }
    return data;
  }
  if (typeof data.message === 'string' && data.message) {
    return data.message;
  }
  if (Array.isArray(data.detail) && data.detail.length > 0) {
    const first = data.detail[0];
    if (typeof first === 'string') return first;
    if (first && typeof first.msg === 'string') {
      return first.msg.replace(/^Value error,\s*/i, '');
    }
    if (first && typeof first.error === 'string') {
      return first.error;
    }
    return JSON.stringify(data.detail);
  }
  if (typeof data.detail === 'string' && data.detail) {
    const msgMatch = data.detail.match(/'msg':\s*'([^']+)'/) || data.detail.match(/"msg":\s*"([^"]+)"/);
    if (msgMatch && msgMatch[1]) {
      return msgMatch[1].replace(/^Value error,\s*/i, '');
    }
    const errMatch = data.detail.match(/'error':\s*'([^']+)'/) || data.detail.match(/"error":\s*"([^"]+)"/);
    if (errMatch && errMatch[1]) {
      return errMatch[1];
    }
    return data.detail;
  }
  if (typeof data.error === 'string' && data.error) {
    return data.error;
  }
  return fallback;
}

export const googleAuthApi = {
  /**
   * POST /api/google-register
   * Body: {
   *   first_name, last_name, email, google_id,
   *   password, confirm_password, date_of_birth, gender, phone, register_for
   * }
   */
  googleRegister: async (payload: GoogleRegisterRequest): Promise<AuthResponse> => {
    const password = payload.password || 'GoogleAuth@2026!';
    const apiPayload = {
      first_name: payload.first_name,
      last_name: payload.last_name || '',
      email: payload.email,
      google_id: payload.google_id,
      password: password,
      confirm_password: payload.confirm_password || password,
      date_of_birth: payload.date_of_birth || '2000-01-01',
      gender: payload.gender || 'Male',
      phone: payload.phone || '9999999999',
      register_for: payload.register_for || 'SELF'
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

    const errMsg = extractApiErrorMessage(response.data, 'Google registration failed.');
    throw new Error(errMsg);
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

    const errMsg = extractApiErrorMessage(response.data, 'Google login failed.');
    throw new Error(errMsg);
  }
};
