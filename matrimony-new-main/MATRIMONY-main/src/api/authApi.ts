// ──────────────────────────────────────────────────────────────
// authApi.ts — Updated to call real backend endpoints.
// Used by AppContext for register/login/forgot-password flows.
// ──────────────────────────────────────────────────────────────

import { axiosClient } from './axiosClient';
import type { RegisterRequest, LoginRequest, AuthResponse } from '../types/apiTypes';
import type { ForgotPasswordResetRequest } from '../types/auth.types';

const BASE_AUTH_URL = 'https://matrimony-production-4b00.up.railway.app/api';

export const authApi = {
  // 1. POST https://matrimony-production-4b00.up.railway.app/api/register
  register: async (payload: RegisterRequest): Promise<AuthResponse> => {
    const cleanPhone = (payload.phone || '').replace(/\D/g, '').slice(-10);
    const apiPayload = {
      register_for: payload.register_for || 'SELF',
      first_name: payload.first_name,
      last_name: payload.last_name || null,
      gender: payload.gender,
      date_of_birth: payload.date_of_birth,
      email: payload.email || null,
      phone: cleanPhone,
      password: payload.password,
      confirm_password: payload.confirm_password,
      accept_terms: Boolean(payload.accept_terms),
    };

    const targetUrl = `${BASE_AUTH_URL}/register`;
    console.log('[authApi] Calling register directly:', targetUrl, apiPayload);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(apiPayload)
    });

    const resData = await response.json().catch(() => ({}));
    if (response.ok && resData?.success !== false) {
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
      const rawUser = resData?.data?.user || resData?.data || resData?.user;
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

    let errMsg = 'Registration failed. Please try again.';
    if (typeof resData?.message === 'string') {
      errMsg = resData.message;
    } else if (typeof resData?.detail === 'string') {
      errMsg = resData.detail;
    } else if (Array.isArray(resData?.detail) && resData.detail.length > 0) {
      errMsg = resData.detail[0]?.msg || resData.detail[0]?.message || 'Invalid registration details';
    }
    throw new Error(errMsg);
  },

  // 2. POST https://matrimony-production-4b00.up.railway.app/api/login
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const apiPayload = {
      phone_or_email: payload.email,
      password: payload.password,
    };

    const targetUrl = `${BASE_AUTH_URL}/login`;
    console.log('[authApi] Calling login directly:', targetUrl, apiPayload);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(apiPayload)
    });

    const resData = await response.json().catch(() => ({}));
    if (response.ok && resData?.success !== false) {
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
      const rawUser = resData?.data?.user || resData?.data || resData?.user;
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

    let errMsg = 'Login failed. Please check your credentials.';
    if (typeof resData?.message === 'string') {
      errMsg = resData.message;
    } else if (typeof resData?.detail === 'string') {
      errMsg = resData.detail;
    } else if (Array.isArray(resData?.detail) && resData.detail.length > 0) {
      errMsg = resData.detail[0]?.msg || resData.detail[0]?.message || 'Invalid credentials';
    }
    throw new Error(errMsg);
  },

  // 3. POST https://matrimony-production-4b00.up.railway.app/api/send-mobile-otp
  sendMobileOtp: async (phone: string): Promise<{ success: boolean; message: string }> => {
    const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
    const targetUrl = `${BASE_AUTH_URL}/send-mobile-otp`;
    console.log('[authApi] Calling send-mobile-otp directly:', targetUrl, 'phone:', cleanPhone);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ phone: cleanPhone })
    });

    const resData = await response.json().catch(() => ({}));
    if (response.ok && resData?.success !== false) {
      return resData;
    }

    let errMsg = 'Failed to send OTP';
    if (typeof resData?.message === 'string') {
      errMsg = resData.message;
    } else if (typeof resData?.detail === 'string') {
      errMsg = resData.detail;
    } else if (Array.isArray(resData?.detail) && resData.detail.length > 0) {
      errMsg = resData.detail[0]?.msg || resData.detail[0]?.message || 'Invalid phone number';
    }
    throw new Error(errMsg);
  },

  // 4. POST https://matrimony-production-4b00.up.railway.app/api/verify-mobile-otp
  verifyMobileOtp: async (phone: string, otp: string): Promise<{ success: boolean; message: string; access_token?: string; refresh_token?: string; user?: any }> => {
    const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
    const cleanOtp = (otp || '').trim();
    const targetUrl = `${BASE_AUTH_URL}/verify-mobile-otp`;
    console.log('[authApi] Calling verify-mobile-otp directly:', targetUrl, 'phone:', cleanPhone, 'otp:', cleanOtp);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ phone: cleanPhone, otp: cleanOtp })
    });

    const resData = await response.json().catch(() => ({}));
    if (response.ok && resData?.success !== false) {
      const accessToken = resData?.data?.access_token || resData?.access_token;
      const refreshToken = resData?.data?.refresh_token || resData?.refresh_token;
      if (accessToken) localStorage.setItem('access_token', accessToken);
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
      return resData;
    }

    let errMsg = 'OTP verification failed';
    if (typeof resData?.message === 'string') {
      errMsg = resData.message;
    } else if (typeof resData?.detail === 'string') {
      errMsg = resData.detail;
    } else if (Array.isArray(resData?.detail) && resData.detail.length > 0) {
      errMsg = resData.detail[0]?.msg || resData.detail[0]?.message || 'Invalid OTP';
    }
    throw new Error(errMsg);
  },

  // 5. POST https://matrimony-production-4b00.up.railway.app/api/refresh
  refresh: async (refreshTokenValue?: string): Promise<{ access_token: string; refresh_token?: string }> => {
    const token = refreshTokenValue || localStorage.getItem('refresh_token') || '';
    if (!token) throw new Error('No refresh token available');

    const targetUrl = `${BASE_AUTH_URL}/refresh`;
    console.log('[authApi] Calling refresh directly:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ refresh: token })
    });

    const resData = await response.json().catch(() => ({}));
    if (response.ok && resData?.success !== false) {
      const newAccess = resData?.access || resData?.access_token || resData?.data?.access_token;
      const newRefresh = resData?.refresh || resData?.refresh_token || resData?.data?.refresh_token;

      if (newAccess) {
        localStorage.setItem('access_token', newAccess);
      }
      if (newRefresh) {
        localStorage.setItem('refresh_token', newRefresh);
      }
      return {
        access_token: newAccess || '',
        refresh_token: newRefresh || token
      };
    }

    let errMsg = 'Token refresh failed';
    if (typeof resData?.message === 'string') {
      errMsg = resData.message;
    } else if (typeof resData?.detail === 'string') {
      errMsg = resData.detail;
    }
    throw new Error(errMsg);
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
