// ──────────────────────────────────────────────────────────────
// authApi.ts — Updated to call real backend endpoints.
// Used by AppContext for register/login/forgot-password flows.
// ──────────────────────────────────────────────────────────────

import { axiosClient } from './axiosClient';
import type { RegisterRequest, LoginRequest, AuthResponse } from '../types/apiTypes';
import type { ForgotPasswordResetRequest } from '../types/auth.types';

export const authApi = {
  // POST /api/register
  register: async (payload: RegisterRequest): Promise<AuthResponse> => {
    const apiPayload = {
      register_for: payload.register_for,
      first_name: payload.first_name,
      last_name: payload.last_name || null,
      gender: payload.gender,
      date_of_birth: payload.date_of_birth,
      email: payload.email || null,
      phone: payload.phone,
      password: payload.password,
      confirm_password: payload.confirm_password,
      accept_terms: payload.accept_terms,
    };

    const response = await axiosClient.post<any>('/register', apiPayload);

    if (response.status >= 200 && response.status < 300) {
      const resData = response.data;
      const accessToken = resData?.data?.access_token || resData?.access_token;
      const refreshToken = resData?.data?.refresh_token || resData?.refresh_token;

      if (accessToken) {
        localStorage.setItem('access_token', accessToken);
        try {
          const parts = accessToken.split('.');
          if (parts.length >= 2) {
            const tokenPayload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            const uid = tokenPayload.user_id || tokenPayload.id || tokenPayload.sub;
            if (uid) localStorage.setItem('user_id', String(uid));
          }
        } catch {}
      }
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      const rawUser = resData?.data || resData?.user;
      const explicitUid = rawUser?.id || rawUser?.user_id || resData?.user_id;
      if (explicitUid) {
        localStorage.setItem('user_id', String(explicitUid));
      }
      return {
        access_token: accessToken || '',
        refresh_token: refreshToken || '',
        user: rawUser
      };
    }

    const errMsg = (response.data as any)?.message
      || (response.data as any)?.detail
      || 'Registration failed. Please try again.';
    throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
  },

  // POST /api/login
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const apiPayload = {
      phone_or_email: payload.email,
      password: payload.password,
    };

    const response = await axiosClient.post<any>('/login', apiPayload);

    if (response.status >= 200 && response.status < 300) {
      const resData = response.data;
      const accessToken = resData?.data?.access_token || resData?.access_token;
      const refreshToken = resData?.data?.refresh_token || resData?.refresh_token;

      if (accessToken) {
        localStorage.setItem('access_token', accessToken);
        try {
          const parts = accessToken.split('.');
          if (parts.length >= 2) {
            const tokenPayload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            const uid = tokenPayload.user_id || tokenPayload.id || tokenPayload.sub;
            if (uid) localStorage.setItem('user_id', String(uid));
          }
        } catch {}
      }
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      const rawUser = resData?.data || resData?.user;
      const explicitUid = rawUser?.id || rawUser?.user_id || resData?.user_id;
      if (explicitUid) {
        localStorage.setItem('user_id', String(explicitUid));
      }
      return {
        access_token: accessToken || '',
        refresh_token: refreshToken || '',
        user: rawUser
      };
    }

    const errMsg = (response.data as any)?.message
      || (response.data as any)?.detail
      || 'Login failed. Please check your credentials.';
    throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
  },

  // POST /api/send-mobile-otp
  sendMobileOtp: async (phone: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosClient.post<{ success: boolean; message: string }>(
      '/send-mobile-otp',
      { phone }
    );

    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }

    const errMsg = (response.data as any)?.message || 'Failed to send OTP';
    throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
  },

  // POST /api/verify-mobile-otp
  verifyMobileOtp: async (phone: string, otp: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosClient.post<{ success: boolean; message: string }>(
      '/verify-mobile-otp',
      { phone, otp }
    );

    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }

    const errMsg = (response.data as any)?.message || 'OTP verification failed';
    throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
  },

  // POST /api/forgot-password-send-otp
  forgotPasswordSendOtp: async (phone_or_email: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosClient.post<{ success: boolean; message: string }>(
      '/forgot-password-send-otp',
      { phone_or_email }
    );

    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }

    const errMsg = (response.data as any)?.message || 'Failed to send recovery OTP';
    throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
  },

  // POST /api/forgot-password-verify-otp
  forgotPasswordVerifyOtp: async (phone_or_email: string, otp: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosClient.post<{ success: boolean; message: string }>(
      '/forgot-password-verify-otp',
      { phone_or_email, otp }
    );

    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }

    const errMsg = (response.data as any)?.message || 'OTP verification failed';
    throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
  },

  // POST /api/forgot-password-reset
  forgotPasswordReset: async (payload: ForgotPasswordResetRequest): Promise<{ success: boolean; message: string }> => {
    const response = await axiosClient.post<{ success: boolean; message: string }>(
      '/forgot-password-reset',
      payload
    );

    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }

    const errMsg = (response.data as any)?.message || 'Password reset failed';
    throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
  },

  // POST /api/logout
  logout: async (): Promise<any> => {
    const refreshToken = localStorage.getItem('refresh_token') || '';
    const response = await axiosClient.post<any>('/logout', {
      refresh: refreshToken,
      refresh_token: refreshToken
    });
    return response.data;
  },
};
